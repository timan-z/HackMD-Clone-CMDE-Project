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

        res.status(201).json({message: "ROOM HAS BEEN CREATED", roomID: edRoomID});
    } catch(err) {
        console.error("ERROR creating Editor Room: ", err);
        res.status(500).json({ error: "ERROR: Failed to create editor room."});
    }
};

// 2.2. Function for retrieving all Editor Rooms associated with a certain user:
export const getAllEdRooms = async (req, res) => {

    console.log("DEBUG: THE FUNCTION getAllEdRooms WAS ENTERED!!!");

    const userID = req.user.id; // Will get obtained by func verifyToken...
    try {

        console.log("DEBUG: POOL.QUERY IS ABOUT TO HAPPEN!!!");

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

        console.log("DEBUG: OKAY SO IT MADE IT TO THIS POINT???");
        console.log("Debug: The value of roomsRes.rows => [", roomsRes.rows, "]");

        res.json(roomsRes.rows);
    } catch (err) {
        console.error("DEBUG: FAILED TO RETRIEVE ROOMS => [", err, "]");
        res.status(500).json({error: "COULD NOT RETRIEVE EDITOR ROOMS."});
    }
};

// 2.3. Function for checking to see if logged-in user has access to a specific Editor Room:
export const checkEditorAccess = async(req, res) => {
    const userID = req.user.id;
    const roomID = req.params.roomId;

    try {
        const accessRes = await pool.query(
            `SELECT * FROM user_rooms WHERE user_id = $1 AND room_id = $2`, [userID, roomID]
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
