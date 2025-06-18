/* This schemaSetup.js file will extract information from the .env file (relating to the backend database specifics)
and then programmatically trigger the schema.sql file and set all necessary permissions so that this project
can work as expected: */

import dotenv from 'dotenv';
import pg from 'pg';
import { URL } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const execAsync = promisify(exec);
const dbUrl = process.env.DATABASE_URL;
if(!dbUrl) {
    console.error("ERROR: Could not run the SQL commands of schema.sql because DATABASE_URL is not defined in .env");
    process.exit(1);
}

const parsed = new URL(dbUrl);
const port = parsed.port || 5432;
const pgUser = parsed.username;
if(!pgUser) {
    console.error("ERROR: Could not parse username value from DATABASE_URL in .env");
    process.exit(1);
}

const pgPass = parsed.password;
if(!pgPass) {
    console.error("ERROR: Could not parse user password value from DATABASE_URL in .env");
    process.exit(1);
}

const dbName = parsed.pathname.replace('/', '');
if(!dbName) {
    console.error("ERROR: Could not parse database name from DATABASE_URL in .env");
    process.exit(1);
}

console.log("DEBUG: The value of dbUrl => [", dbUrl, "]");
console.log("DEBUG: The value of pgUser => [", pgUser, "]");
console.log("DEBUG: The value of dbName => [", dbName, "]");
console.log("DEBUG: The value fo pgPass => [", pgPass, "]");

const pool = new pg.Pool({connectionString: dbUrl});
const tables = ['users', 'rooms', 'user_rooms', 'messages', 'invite_links', 'ydocs'];

// Construct psql comamnd for running schema.sql:
const runSchemaSQL = async () => {
    console.log("Running schema.sql...");
    try {
        //await execAsync(`cmd.exe /C "set PGPASSWORD=${pgPass} && psql -U ${pgUser} -d ${dbName} -p ${port} -f ./src/components/backend/schema.sql`);
        await execAsync(`psql -U ${pgUser} -d ${dbName} -p ${port} -f ./src/components/backend/schema.sql`);
        console.log("schema.sql has been executed.");
    } catch(err) {
        console.error("ERROR: Error when running schema.sql => [", err.stderr || err, "]");
        process.exit(1);
    }
};

/* Main reason I have this schemaSetup.js file in the first place is because, since .sql files
are declarative, I can't have anything in there to grant permissions (with a dynamic "user" value).
I've got to do that here and the function below is for that: */
const grantAll = async () => {
    try {
        for(const table of tables) {
            const query = `GRANT ALL PRIVILEGES ON TABLE ${table} TO ${pgUser};`;
            await pool.query(query);
            console.log(`Granted privileges on Table:(${table}) to User:(${pgUser}).`);
        }
    } catch(err) {
        console.error("ERROR: Error occurred during privilege granting: ", err);
    } finally {
        await pool.end();
    }
};

const main = async() => {
    await runSchemaSQL();
    await grantAll();
};

main();
