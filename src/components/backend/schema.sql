
/* Have already created the table in my psql shell with the command:
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    displayname VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
This file is largely here for reference.
*/

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    displayname TEXT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
)

/* The table I make for Editor Sessions (aka Rooms):
CREATE TABLE rooms(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

/* The middle-man table I make connecting Table "users" and Table "rooms" (I forgot everything about SQL, sorry Prof Ritu and Fangju...):
CREATE TABLE user_rooms(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    room_id UUID REFERENCES rooms(id),
    role TEXT DEFAULT 'member' // <-- and if you are the creator of a room, this is changed to King/Owner (later on I'll implement ability to pass of "King" status).
);

*/

/* This command for the table I'm using to store Shareable Invite links:
CREATE TABLE invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

*/



/* NOTE: DO NOT FORGET I NEED TO GRANT PERMISSION FOR EACH OF THE TABLES DIRECTLY BEFORE I CAN SEND THEM POOL.QUERY THINGS
-- GRANTING ALL PERMISSIONS ON THE DATABASE ALONE DOESN'T HELP -- I NEED ALL OF THEM */

