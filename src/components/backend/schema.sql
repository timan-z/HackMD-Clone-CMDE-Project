-- DROP TABLES IF THEY EXIST (Obviously, this schema.sql file should only be ran if you're okay to wipe all existing data):
DROP TABLE IF EXISTS invite_links;
DROP TABLE IF EXISTS user_rooms;
DROP TABLE IF EXISTS ydocs;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;

-- 1. users table:
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    displayname VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. rooms table:
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. user_rooms table (middle-man table connecting 1 and 2):
CREATE TABLE user_rooms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member'
);

-- 4. invite_links table:
CREATE TABLE invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ydocs table:
CREATE TABLE ydocs(
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. messages table:
CREATE TABLE messages(
    id UUID PRIMARY KEY REFERENCES gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* THE SQL COMMANDS I RAN MANUALLY ORIGINALLY ON THE PSQL COMMAND LINE (TABLE BY TABLE):
******************************************************************************************
"
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    displayname VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_rooms(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' // <-- and if you are the creator of a room, this is changed to King/Owner (later on I'll implement ability to pass of "King" status).
);

CREATE TABLE invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ydocs(
    room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

"
******************************************************************************************
*/

/* NOTE: DO NOT FORGET I NEED TO GRANT PERMISSION FOR EACH OF THE TABLES DIRECTLY BEFORE I CAN SEND THEM POOL.QUERY THINGS
-- GRANTING ALL PERMISSIONS ON THE DATABASE ALONE DOESN'T HELP -- I NEED ALL OF THEM */
