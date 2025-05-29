/* NOTE: So it looks like I never actually had a Yjs Websocket server running at localhost:1234
and that's why I was seeing the "WebSocket closed before the connection was established" warning in my console.log.
(I'M GOING TO MAKE THAT SERVER HERE SO THAT WARNING GOES AWAY).

- In my Editor.jsx file, I had "new WebsocketProvider('ws://localhost:1234', id, doc, { connect: false });" but that's
on the client-side but that's primarily for setting up real-time sync on the frontend (remember I used it for the real-time editing/foreign cursors).

- My expressServer.js file is **just** a Express + PostgreSQL backend -- not a Websocket server that speaks the Yjs Protocol (I do that HERE).
(Of course I now want to change the "connect: false" to "connect: true").
*/

/* THIS yjsServer.js FILE WILL:
[1]. Load the document state to the Editor Room when the first client joins an empty room.
[2]. Save the document state to the database when a client disconnects.
*/

import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket";
import * as Y from "yjs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path:'./.env'});

// Yjs server:
const YJS_PORT = 1234;
const wss = new WebSocketServer({ port: YJS_PORT });

// Connect to PostgreSQL:
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// In-memory doc cache:
const docs = new Map();

// [1] - Fetch doc from DB or create a new one:
async function loadDoc(roomId) {

    console.log("DEBUG: Function loadDoc entered...");

    if(docs.has(roomId)) return docs.get(roomId);
    const doc = new Y.Doc(); // New doc.
    
    try {
        const result = await pool.query("SELECT content FROM ydocs WHERE room_id = $1", [roomId]);
        if(result.rows.length > 0) {
            const encoded = result.rows[0].content;
            Y.applyUpdate(doc, Buffer.from(encoded, "binary"));
            console.log(`Loaded doc for Room ID(${roomId})`);
        } else {
            console.log(`Created a new doc for Room ID(${roomId})`);
        }
    } catch(err) {
        console.error(`ERROR loading document in Room ID:(${roomId}) because => ${err}`);
    }
    docs.set(roomId, doc);
    return doc;
}

// [2] - Save to the DB on final member disconnect:
async function saveDoc(roomId, doc) {


    console.log("DEBUG: Function saveDoc entered...");
    

    const update = Y.encodeStateAsUpdate(doc);
    try {
        await pool.query(
            `INSERT INTO ydocs (room_id, content, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT(room_id) DO UPDATE SET content = $2, updated_at = NOW()`,
        [roomId, update]);

        console.log(`Saved doc for Room ID(${roomId})`);
    } catch(err) {
        console.error(`ERROR saving document in Room ID:(${roomId}) because => ${err}`);
    }
}



wss.on("connection", async(conn,req)=> {
    //console.log("New Yjs WebSocket connection established.");
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.pathname.slice(1);
    const doc = await loadDoc(roomId);

    console.log("DEBUG: The value fo roomId => [", roomId, "]");

    setupWSConnection(conn, req, {
        doc,
        gc:true,
    });
    // Save on connection close (last client leaves room):
    conn.on("close", ()=> {
        const isEmpty = [...wss.clients].every(
            (client) => new URL(client.upgradeReq?.url ?? "", `http://${client.upgradeReq?.headers?.host}`).pathname.slice(1) !== roomId
        );

        if(isEmpty) {
            // basically, if a room is empty, we save its content to PostgreSQL backend and get rid of it here (to free up space):
            saveDoc(roomId, doc);
            docs.delete(roomId);
        }
    });

});

console.log(`Yjs WebSocket Server running on ws://localhost:${YJS_PORT}`);
