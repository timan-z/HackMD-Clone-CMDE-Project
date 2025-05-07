import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path:'./.env'});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("DEBUG: The value of process.env.DATABASE_URL => [", process.env.DATABASE_URL, "]");
