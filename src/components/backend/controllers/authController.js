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

    console.log("AUTH-DEBUG: Is the AUTH-DEBUG function createNewEdRoom even entered at all???");

    let { edRoomName } = req.body;
    if(!edRoomName) {
        edRoomName = ""; // can be empty idc.
    }
    const userID = req.user.id; // See function verifyToken (look in auth.js first, where it is imported).


    console.log("auth-DEBUG: The value of edRoomName => [", edRoomName, "]");
    console.log("auth-DEBUG: The value of userID => [", userID, "]");



    try {
        const edRoomID = uuidv4();


        console.log("auth-DEBUG: The value of userID => [", edRoomID, "]");


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
