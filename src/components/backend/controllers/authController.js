import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path:'./.env'});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET;


console.log("DEBUG: REFRESH STUFF!!! THE VALUE OF process.env.VITE_CLOUDINARY_CLOUD_NAME => [", process.env.VITE_CLOUDINARY_CLOUD_NAME, "]");


// 1. Function for User Registration:
// DEBUG: TESTED WITH POSTMAN -- THIS ONE WORKS!
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

// 2. Function for User Login:
// DEBUG: TESTED WITH POSTMAN -- THIS ONE WORKS!
export const loginUser = async(req, res) => {
    const { email, username, password } = req.body;

    try {
        const loginRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]); // See if valid email.
        const user = loginRes.rows[0];

        const loginResAlt = await pool.query("SELECT * FROM users WHERE username = $1", [username]); // See if valid username.
        const userAlt = loginResAlt.rows[0];

        if(!user || !userAlt) return res.status(401).json({ error: "Invalid login credentials - no account with that email or username exists!" });

        const match = await bcrypt.compare(password, user.password);    // Password check.
        const matchAlt = await bcrypt.compare(password, userAlt.password);

        if(!match || !matchAlt) return res.status(401).json({ error: "Invalid login credentials - invalid password!" });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "10d" });
        // Return user info to the front-end and the memory token:
        res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
    } catch(err) {
        res.status(500).json({ error: "Couldn't login - Internal server error, probably."});
    }
};

// Function for retrieving Current User:
// DEBUG: TESTED WITH POSTMAN - THIS ONE WORKS! Make sure you don't have POST in the url though (in addition to selecting POST), this caused some problems for me.
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
