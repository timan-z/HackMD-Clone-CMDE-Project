/* This is my backend file for setting up an Express server. Here's where I'll have code for:
0. Connect to PostgreSQL.
1. Signing up / Registering users.
2. Logging in w/Email + Password
3. Authenticating users with JWT Tokens.
4. Storing session Tokens in the frontend (browser localStorage).
5. Storing user credentials securely in PostgreSQL w/ Hashed Passwords.
6. Enable protected frontend routes (login-page, dashboard, editor).
*/
/* NOTE: Most of the issues I'm running into sending Postman requests to my routes are usually just permission issues
that can be fixed with grants in psql (look them up, throw them into chatgpt or something to figure them out idc). */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import authRoutes from './routes/auth.js'; // authRoutes is just a variable name for the router being exported from auth.js

dotenv.config({ path:'./.env'});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173", // My frontend port (from running "npm run dev")
    credentials: true
}));
  
app.use(express.json()); // Parses incoming JSON requests. 

// Connect to PostgreSQL:
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

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
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`EXPRESS Server is running on port ${PORT}`);
});
