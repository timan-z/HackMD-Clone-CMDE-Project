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

// SCRAPPED! NOT GOING TO MOVE FORWARD WITH THIS!

import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import {
  readSyncMessage,
  writeSyncStep1,
  writeSyncStep2,
  writeUpdate
} from "y-protocols/sync";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate
} from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: './.env' });

const YJS_PORT = 1234;
const wss = new WebSocketServer({ port: YJS_PORT }, () => {
  console.log(`Yjs WebSocket Server running at ws://localhost:${YJS_PORT}`);
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const docs = new Map();
const roomClients = new Map();
const awarenessStates = new Map();

async function loadDoc(roomId) {
  if (docs.has(roomId)) return docs.get(roomId);
  const doc = new Y.Doc();
  try {
    const result = await pool.query("SELECT content FROM ydocs WHERE room_id = $1", [roomId]);
    if (result.rows.length > 0) {
      const encoded = Buffer.isBuffer(result.rows[0].content)
        ? result.rows[0].content
        : Buffer.from(result.rows[0].content, 'hex');
      Y.applyUpdate(doc, encoded);
      console.log(`Loaded doc for Room ID(${roomId}), content length: ${encoded.length}`);
    } else {
      console.log(`Created new doc for Room ID(${roomId})`);
    }
  } catch (err) {
    console.error(`Error loading doc (${roomId}): ${err}`);
  }
  docs.set(roomId, doc);
  return doc;
}

async function saveDoc(roomId, doc) {
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
    console.error(`Error saving doc (${roomId}): ${err}`);
  }
}

setInterval(() => {
  for (const [roomId, doc] of docs.entries()) {
    saveDoc(roomId, doc);
  }
}, 60000);

setInterval(() => {
  for (const [roomId, awareness] of awarenessStates.entries()) {
    awareness.removeStates(Array.from(awareness.getStates().keys()));
  }
}, 300000);

wss.on("connection", async (conn, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.pathname.slice(1);
  const doc = await loadDoc(roomId);

  if (!roomClients.has(roomId)) {
    roomClients.set(roomId, new Set());
  }
  const clients = roomClients.get(roomId);
  clients.add(conn);
  conn.binaryType = "arraybuffer";

  if (!awarenessStates.has(roomId)) {
    const awareness = new Awareness(doc);
    awarenessStates.set(roomId, awareness);
  }
  const awareness = awarenessStates.get(roomId);
  const connAwarenessId = Math.floor(Math.random() * 0xFFFFFFFF);
  awareness.setLocalState(connAwarenessId, {});

  const awarenessBroadcast = (changedClients, origin) => {
    const changed = encoding.createEncoder();
    encoding.writeVarUint(changed, 0x90);
    encoding.writeVarUint8Array(changed, encodeAwarenessUpdate(awareness, changedClients));
    const message = encoding.toUint8Array(changed);

    for (const client of clients) {
      if (client !== origin && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  };

  awareness.on("update", awarenessBroadcast);

  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0);
  writeSyncStep1(encoder, doc);
  conn.send(encoding.toUint8Array(encoder));

  const awarenessUpdate = encoding.createEncoder();
  encoding.writeVarUint(awarenessUpdate, 0x90);
  encoding.writeVarUint8Array(awarenessUpdate, encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys())));
  conn.send(encoding.toUint8Array(awarenessUpdate));

  conn.on("message", (data) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const encoder = encoding.createEncoder();
    const messageType = decoding.readVarUint(decoder);
    try {
      switch (messageType) {
        case 0:
        case 1:
        case 2:
          readSyncMessage(decoder, encoder, doc, conn);
          if (encoding.length(encoder) > 0) {
            conn.send(encoding.toUint8Array(encoder));
          }
          if (messageType === 2) {
            for (const client of clients) {
              if (client !== conn && client.readyState === WebSocket.OPEN) {
                client.send(data);
              }
            }
          }
          break;
        case 0x90:
          const update = decoding.readVarUint8Array(decoder);
          applyAwarenessUpdate(awareness, update, conn);
          break;
        default:
          console.warn("Unknown message type:", messageType);
      }
    } catch (err) {
      console.error("Failed to process Yjs message: ", err);
    }
  });

  conn.on("close", () => {
    awareness.removeStates([connAwarenessId]);
    clients.delete(conn);
    if (clients.size === 0) {
      saveDoc(roomId, doc);
      docs.delete(roomId);
      roomClients.delete(roomId);
      awarenessStates.delete(roomId);
    }
  });
});
