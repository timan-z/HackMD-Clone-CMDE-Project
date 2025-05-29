// NOTE: So it looks like I never actually had a Yjs WebSocket server running at localhost:1234
// and that's why I was seeing the "WebSocket closed before the connection was established" warning in my console.log.
// (I'M GOING TO MAKE THAT SERVER HERE SO THAT WARNING GOES AWAY).

// In my Editor.jsx file, I had "new WebsocketProvider('ws://localhost:1234', id, doc, { connect: false });" but that's
// on the client-side and primarily for setting up real-time sync on the frontend (used for real-time editing / cursors).

// My expressServer.js file is just an Express + PostgreSQL backend -- not a WebSocket server that speaks the Yjs Protocol (I do that HERE).
// (Of course I now want to change the "connect: false" to "connect: true").

/* THIS yjsServer.js FILE WILL:
[1]. Load the document state to the Editor Room when the first client joins an empty room.
[2]. Save the document state to the database when a client disconnects.
*/

const http = require("http");
const { WebSocketServer } = require("ws");
//const { setupWSConnection } = require("y-websocket/bin/utils.js");
const { setupWSConnection } = require("y-websocket/server.js");
const Y = require("yjs");
const pg = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: './.env' });

// Yjs WebSocket Server:
const YJS_PORT = 1234;
const wss = new WebSocketServer({ port: YJS_PORT });

// PostgreSQL setup:
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// In-memory Yjs document cache:
const docs = new Map();

// [1] Load doc from DB (or create new one):
async function loadDoc(roomId) {
    console.log("DEBUG: Function loadDoc entered...");

    if (docs.has(roomId)) return docs.get(roomId);
    const doc = new Y.Doc();

    try {
        const result = await pool.query("SELECT content FROM ydocs WHERE room_id = $1", [roomId]);
        if (result.rows.length > 0) {
            const encoded = result.rows[0].content;
            Y.applyUpdate(doc, Buffer.from(encoded, "binary"));
            console.log(`Loaded doc for Room ID(${roomId})`);
        } else {
            console.log(`Created a new doc for Room ID(${roomId})`);
        }
    } catch (err) {
        console.error(`ERROR loading document in Room ID:(${roomId}) => ${err}`);
    }

    docs.set(roomId, doc);
    return doc;
}

// [2] Save doc to DB on final disconnect:
async function saveDoc(roomId, doc) {
    console.log("DEBUG: Function saveDoc entered...");

    const update = Y.encodeStateAsUpdate(doc);
    try {
        await pool.query(
            `INSERT INTO ydocs (room_id, content, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT(room_id) DO UPDATE SET content = $2, updated_at = NOW()`,
            [roomId, update]
        );
        console.log(`Saved doc for Room ID(${roomId})`);
    } catch (err) {
        console.error(`ERROR saving document in Room ID:(${roomId}) => ${err}`);
    }
}

// WebSocket connection logic:
wss.on("connection", async (conn, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const roomId = url.pathname.slice(1);
    const doc = await loadDoc(roomId);

    console.log("DEBUG: The value of roomId => [", roomId, "]");

    setupWSConnection(conn, req, {
        doc,
        gc: true,
    });

    conn.on("close", () => {
        const isEmpty = [...wss.clients].every((client) => {
            const clientUrl = new URL(client.upgradeReq?.url ?? "", `http://${client.upgradeReq?.headers?.host}`);
            return clientUrl.pathname.slice(1) !== roomId;
        });

        if (isEmpty) {
            saveDoc(roomId, doc);
            docs.delete(roomId);
        }
    });
});

console.log(`Yjs WebSocket Server running on ws://localhost:${YJS_PORT}`);
