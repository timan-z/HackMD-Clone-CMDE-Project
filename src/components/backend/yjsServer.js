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
import * as Y from "yjs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path:'./.env'});

// Create WebSocket server:
const YJS_PORT = 1234;
const wss = new WebSocketServer({ port: YJS_PORT }, () => {
    console.log(`DEBUG: Yjs WebSocket Server running on ws://localhost:${YJS_PORT}`);
});

// PostgreSQL connection:
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const docs = new Map(); // Memory cache of Yjs documents per room. (RoomId -> Y.Doc)
const roomClients = new Map();  // RoomId -> Set of WebSocket clients.

// [1] - Fetch doc from DB or create a new one:
async function loadDoc(roomId) {
    console.log("1. DEBUG: Function loadDoc entered...");

    if(docs.has(roomId)) return docs.get(roomId);
    const doc = new Y.Doc(); // New doc.
    
    //console.log("DEBUG: The value of doc is => [", doc, "]");

    try {
        const result = await pool.query("SELECT content FROM ydocs WHERE room_id = $1", [roomId]);
        if(result.rows.length > 0) {
            const encoded = result.rows[0].content;
            
            console.log("Debug: The value of encoded is => [", encoded, "]");
            console.log("Debug: please work...");

            Y.applyUpdate(doc, encoded);
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
    console.log("2. DEBUG: Function saveDoc entered...");
    
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

// DEBUG: AUTO-SAVE ALL DOCUMENTS IN MEMORY TO THE DATABASE IN INTERVALS (NOT SURE I WANT TO KEEP THIS BUT IT'D LOOK GOOD IN README.MD)
setInterval(() => {
  for (const [roomId, doc] of docs.entries()) {
    saveDoc(roomId, doc);
  }
}, 1000 * 60); // every 60 seconds

// mINIMAL WEBSOCKET MESSAGE HANDLER FOR YJS SYNCING:
wss.on("connection", async(conn,req)=> {
    //console.log("New Yjs WebSocket connection established.");
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.pathname.slice(1);
    const doc = await loadDoc(roomId);

    console.log("wss.on-DEBUG: The value of roomId => [", roomId, "]");

    if(!roomClients.has(roomId)) {
        roomClients.set(roomId, new Set());
    }
    roomClients.get(roomId).add(conn);

    //console.log("DEBUG: The value of url => [", url, "]");
    //console.log("DEBUG: The value of doc => [", doc, "]");
    //console.log("DEBUG: The value fo roomId => [", roomId, "]");

    // Yjs update handling:
    conn.binaryType = "arraybuffer";

    const broadcast = (message) => {
        const clientsInRoom = roomClients.get(roomId);
        if(!clientsInRoom) return;

        for(const client of clientsInRoom) {
            if(client !== conn && client.readyState === 1) {
                client.send(message);
            }
        }
    };

    const handleMessage = (data) => {

        if(!(data instanceof Buffer)) {
            console.warn('Ignoring non-buffer message:', data);
            return;
        }

        const update = new Uint8Array(data);
        try {
            Y.applyUpdate(doc, update);
            broadcast(update);  // echo to all clients.
        } catch(err) {
            console.error(`ERROR: Failed to apply update because => ${err}`);
        }
    }
    conn.on("message", handleMessage);

    // sending initial document state:
    const state = Y.encodeStateAsUpdate(doc);
    conn.send(state);

    // Handle disconnect:
    conn.on("close", ()=>{
        const clients = roomClients.get(roomId);
        if(clients) {
            clients.delete(conn);
            if(clients.size === 0) {
                roomClients.delete(roomId);
            }
        }

        const stillConnected = [...wss.clients].some(client => {
            try {
                const clientRoom = new URL(client.upgradeReq?.url || '', `http://${client.upgradeReq?.headers?.host}`).pathname.slice(1);
                return clientRoom === roomId;
            } catch {
                return false;
            }
        });
        if(!stillConnected) {
            saveDoc(roomId, doc);
            docs.delete(roomId);
        }
    });
});
