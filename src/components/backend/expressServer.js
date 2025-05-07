/* This is my backend file for setting up an Express server. Here's where I'll have code for:
0. Connect to PostgreSQL.
1. Signing up / Registering users.
2. Logging in w/Email + Password (DEBUG: When testing, just use one email and have the "+1", "+2" etc cheat for testing multiple accounts).
3. Authenticating users with JWT Tokens.
4. Storing session Tokens in the frontend (browser localStorage).
5. Storing user credentials securely in PostgreSQL w/ Hashed Passwords.
6. Enable protected frontend routes (login-page, dashboard, editor).
*/

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
//import authRoutes from './routes/auth.js';

dotenv.config({ path:'./.env'});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Parses incoming JSON requests. 



console.log("1-DEBUG: The value of PORT is => [", PORT, "]");
console.log("2-DEBUG: The value of process.env.DATABASE_URL is => [", process.env.DATABASE_URL, "]");
console.log("3-DEBUG: The value of process.env.VITE_CLOUDINARY_CLOUD_NAME is => [", process.env.VITE_CLOUDINARY_CLOUD_NAME, "]");



// Connect to PostgreSQL:
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// DEBUG: Test the DB connection.
pool.connect((err, client, release) => {

    if(err) {
        console.error("Error acquiring client", err);
        return;
    }
    client.query("SELECT NOW()", (err, result) => {
        release();
        if(err) {
            return console.error("Error executing query", err.stack);
        }
        console.log("PostgreSQL connected: ", result.rows);
    });
});

app.get("/", (req, res) => {
    res.send("Backend is running.");
});

// Routes:
//app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`EXPRESS Server is running on port ${PORT}`);
});
