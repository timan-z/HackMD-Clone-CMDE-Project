import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pg from "pg";


import {v4 as uuidv4} from 'uuid'; // For creating new Editor Rooms.
/* NOTE:
- I should be safe using uuidv4(); to generate Room IDs because the probability of duplication is astronomically low
AND since it's my primary key in the database anyways, PostgreSQL will automatically reject duplicates for me. 
*/





dotenv.config({ path:'./.env'});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET;


console.log("DEBUG: REFRESH STUFF!!! THE VALUE OF process.env.VITE_CLOUDINARY_CLOUD_NAME => [", process.env.VITE_CLOUDINARY_CLOUD_NAME, "]");

// 1. USER-RELATED:
// 1.1. Function for User Registration:
export const registerUser = async(req, res) => {
    const { username, email, password } = req.body;
    console.log("DEBUG: Incoming registration => [", { username, email, password }, "]");

    try {
        const hashed = await bcrypt.hash(password, 10); // use bcrypt to hash the input password.
        console.log("DEBUG: Hashed password => [", hashed, "]");

        // Registration attempt:
        const registerRes = await pool.query(
            "INSERT INTO users(username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, hashed]
        );
        const user = registerRes.rows[0];
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "10d" });  // Remembering users.

        // Sends the user and memory token to the frontend.
        res.json({ user, token });
    } catch (err) {
        // Upon failure, 400 response error is sent to the frontend.
        console.error("DEBUG: Registration Error => [", err, "]");
        res.status(400).json({ error: "ERROR: User registration failed! Username or email either already exists or input was invalid." });
    }
};

// 1.2. Function for User Login:
export const loginUser = async(req, res) => {
    const { email, username, password } = req.body;

    try {
        // You can login with email OR username, which of which will be discerned below (with email being prioritized):
        const loginRes = email ? await pool.query("SELECT * FROM users WHERE email = $1", [email]) // see if valid email.
            : await pool.query("SELECT * FROM users WHERE username = $1", [username]); // see if valid username.

        const user = loginRes.rows[0];
        
        console.log("DEBUG: SOMETHING NEW HERE!!!");

        if(!user) {
            return res.status(401).json({error: "Invalid login credentials - no account with that email or username exists! AHHHHHHH"});
        }

        const match = await bcrypt.compare(password, user.password);

        if(!match) {
            return res.status(401).json({ error: "Invalid login credentials - incorrect password!" });
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "10d" });
        // Return user info to the front-end and the memory token:
        res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
    } catch(err) {
        res.status(500).json({ error: "Couldn't login - Internal server error, probably."});
    }
};

// 1.3. Function for retrieving Current User:
export const getCurrentUser = async(req, res) => {
    // Look for JWT memory token in the Authorization header:
    const token = req.headers.authorization?.split(" ")[1];

    if(!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const decodeRes = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [decoded.id]);
        res.json(decodeRes.rows[0]);
    } catch (err) {
        res.status(401).json({ error: "Invalid token. Current user could not be retrieved. Re-login buddy." });
    }
};

// 2. MULTI-USER SESSION MANAGEMENT-RELATED:
// 2.1. Function for creating new user 
export const createNewEdRoom = async(req, res) => {

    let { edRoomName } = req.body;
    if(!edRoomName) {
        edRoomName = ""; // can be empty idc.
    }
    const userID = req.user.id; // See function verifyToken (look in auth.js first, where it is imported).

    try {
        const edRoomID = uuidv4();

        // Insert into rooms table:
        await pool.query("INSERT INTO rooms (id, name, created_by) VALUES ($1, $2, $3)", [edRoomID, edRoomName, userID]);
        // Now also make a value for the middleman table that connects Table users and Table rooms:
        await pool.query("INSERT INTO user_rooms (user_id, room_id, role) VALUES ($1, $2, $3)", [userID, edRoomID, "king"]);

        res.status(201).json({message: "ROOM HAS BEEN CREATED", roomId: edRoomID});
    } catch(err) {
        console.error("ERROR creating Editor Room: ", err);
        res.status(500).json({ error: "ERROR: Failed to create editor room."});
    }
};

// 2.2. Function for retrieving all Editor Rooms associated with a certain user:
export const getAllEdRooms = async (req, res) => {
    const userID = req.user.id; // Will get obtained by func verifyToken...
    try {
        const roomsRes = await pool.query(`
            SELECT
                ur.id AS user_room_id,
                ur.role,
                r.id AS room_id,
                r.name AS room_name,
                r.created_at,
                u.username AS creator_name
            FROM user_rooms ur
            JOIN rooms r ON ur.room_id = r.id
            JOIN users u ON r.created_by = u.id
            WHERE ur.user_id = $1
            ORDER BY r.created_at DESC
        `, [userID]);

        res.json(roomsRes.rows);
    } catch (err) {
        console.error("DEBUG: FAILED TO RETRIEVE ROOMS => [", err, "]");
        res.status(500).json({error: "COULD NOT RETRIEVE EDITOR ROOMS."});
    }
};

// 2.3. Function for checking to see if logged-in user has access to a specific Editor Room:
export const checkEditorAccess = async(req, res) => {
    const userID = req.user.id;
    const roomId = req.params.roomId;

    try {
        const accessRes = await pool.query(
            `SELECT * FROM user_rooms WHERE user_id = $1 AND room_id = $2`, [userID, roomId]
        );
        if(accessRes.rows.length > 0) {
            return res.json({ access: true});
        } else {
            return res.json({ access: false});
        }
    } catch (err) {
        console.error("ERROR checking Editor Room Access: ", err);
        res.status(500).json({ error: "Internal Server Error ", access: false});
    }
};

// 2.4. Function for generating shareable invite links:
export const generateEdInvLink = async(req, res) => {
    const {roomId} = req.params;
    const {expiresInMinutes} = req.body;
    const userId = req.user.id;

    // Ensure requester is the Editor Room owner:
    // NOTE: ^ FOR NOW... **Maybe** later on, I can add permissions for users set by the Owner and toggle who can do what.
    const ownerCheck = await pool.query(`
        SELECT role FROM user_rooms WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId]);

    if(ownerCheck.rows[0]?.role !== 'king') {
        return res.status(403).json({ error: "Only the room owner (king) can generate Room invites."});
    }

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000); // NOTE: Going to make the invites last one hour.
    const result = await pool.query(`
        INSERT INTO invite_links (room_id, created_by, expires_at) VALUES ($1, $2, $3) RETURNING id
    `, [roomId, userId, expiresAt]);

    const inviteId = result.rows[0].id;
    res.json({ inviteURL: `${inviteId}` });
}

// 2.5. Function for joining an Editor Room via Invite Link:
export const joinEdRoomViaInv = async(req, res) => {
    const {inviteId} = req.params;
    const userId = req.user.id;

    const result = await pool.query(`
        SELECT room_id, expires_at FROM invite_links WHERE id = $1
    `, [inviteId]);

    const invite = result.rows[0];
    if(!invite || new Date(invite.expires_at) < new Date()) {
        return res.status(400).json({ error: "Looks like this Invite has is invalid! (Or has expired)."});
    }
    // Add user if not already in room:
    const check = await pool.query(`
        SELECT * FROM user_rooms WHERE user_id = $1 AND room_id = $2
    `, [userId, invite.room_id]);
    
    // If the current user is not the Room, they will be granted access:
    if(check.rowCount === 0) {
        await pool.query(`
            INSERT INTO user_rooms (user_id, room_id) VALUES ($1, $2)
        `, [userId, invite.room_id]);

        return res.json({ success: true, roomId: invite.room_id });
    } 
    // Some kind of notification that says you're already there:
    res.json({ success: false, error: "ERROR: You're already in this room!"});
};

// 2.6. Function for LEAVING an Editor Room:
export const leaveEdRoom = async(req, res) => {
    const {roomId} = req.params;
    const userId = req.user.id;

    // Need to check to see if this user is the Owner of the Editor Room server (if they are, they cannot leave it):
    const ownerCheck = await pool.query(`
        SELECT role FROM user_rooms WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId]);

    if(ownerCheck.rows[0]?.role === 'king') {
        return res.status(403).json({ success: false, error: "The Editor owner (king) cannot leave the Room."});
    }

    // Otherwise, just leave it:
    await pool.query(`
        DELETE FROM user_rooms WHERE user_id = $1 AND room_id = $2;
    `, [userId, roomId]);
    
    res.json({ success: true });
};

// 2.7. Function for DELETING an Editor Room:
export const deleteEdRoom = async(req, res) => {
    const {roomId} = req.params;
    const userId = req.user.id;
    // Basically the reverse of 2.6. -- this user will only be able to delete the editor room if they are its owner:
    const ownerCheck = await pool.query(`
        SELECT role FROM user_rooms WHERE room_id = $1 AND user_id = $2
    `, [roomId, userId]);
    if(ownerCheck.rows[0]?.role !== 'king') {
        return res.status(403).json({ success: false, error: "The Editor owner (king) is the ONLY one who can delete the Room."});
    }

    // Delete:
    // DEBUG: Maybe I can't do multiple queries here...
    await pool.query(`
        DELETE FROM rooms WHERE id = $1; 
    `, [roomId]);   // NOTE: I should rework my user_rooms to have "room_id UUID REFERENCES rooms(id)" become "room_id UUID REFERENCES rooms(id) ON DELETE CASCADE"

    res.json({ success: true});
};

// 3. USER MANAGEMENT:
// 3.1. Function for retrieving a list of users associated with a particular room:
export const getEdRoomUsers = async(req, res) => {
    const {roomId} = req.params;
    try {
        const usersData = await pool.query(`
            SELECT 
                u.id AS user_id,
                u.username,
                u.displayname,
                ur.role,
                ur.room_id
            FROM user_rooms ur
            JOIN users u ON ur.user_id = u.id
            WHERE ur.room_id = $1
        `, [roomId]);



        console.log("DEBUG rows:", usersData.rows);


        
        res.json(usersData.rows);
    } catch(err) {
        console.error("ERROR while fetching users for room ID:(", roomId, ") because of: ", err);
        res.status(500).json({ error: "Failed to fetch users for the room" });
    }
};

// 3.2. Function for kicking a specific user from a particular room.
export const kickEdRoomUser = async(req, res) => {
    const {roomId} = req.params;
    const targetUserId = req.params.userId;

    // Remove this user from the Editor Room:
    try {
        await pool.query(`DELETE FROM user_rooms WHERE room_id = $1 AND user_id = $2`, [roomId, targetUserId]);
        res.status(201).json({success: true});
    } catch (err) {
        console.error("ERROR while attempting to kick User ID:(", targetUserId, ") from Room ID:(", roomId, ") because of: ", err);
        res.status(500).json({ success:false, error: "FAILED TO KICK USER" });
    }
};
