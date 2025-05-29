// TESTING IF THIS WORKS. (my yjsServer.js file but with setupWSConnection removed for manual logic or something).
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { encodeStateAsUpdate, applyUpdate } from 'yjs';
import dotenv from 'dotenv';
import pg from 'pg';
import { readSyncMessage, writeUpdate } from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import { encodeAwarenessUpdate } from 'y-protocols/awareness.js';

dotenv.config({ path: './.env' });

// DB setup
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Yjs server setup
const YJS_PORT = 1234;
const wss = new WebSocketServer({ port: YJS_PORT });
const docs = new Map(); // roomId -> { doc, awareness }

// --- Load Y.Doc from DB or initialize new ---
async function loadDoc(roomId) {
  if (docs.has(roomId)) return docs.get(roomId);

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);

  try {
    const result = await pool.query(
      'SELECT content FROM ydocs WHERE room_id = $1',
      [roomId]
    );

    if (result.rows.length > 0) {
      const encoded = result.rows[0].content;
      Y.applyUpdate(doc, Buffer.from(encoded, 'binary'));
      console.log(`Loaded document for room [${roomId}]`);
    } else {
      console.log(`New document for room [${roomId}]`);
    }
  } catch (err) {
    console.error(`DB Load Error for room [${roomId}]:`, err);
  }

  docs.set(roomId, { doc, awareness });
  return { doc, awareness };
}

// --- Save Y.Doc to DB ---
async function saveDoc(roomId, doc) {
  const update = Y.encodeStateAsUpdate(doc);
  try {
    await pool.query(
      `INSERT INTO ydocs (room_id, content, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (room_id) DO UPDATE SET content = $2, updated_at = NOW()`,
      [roomId, update]
    );
    console.log(`Saved document for room [${roomId}]`);
  } catch (err) {
    console.error(`DB Save Error for room [${roomId}]:`, err);
  }
}

// --- Handle new WebSocket connections ---
wss.on('connection', async (conn, req) => {
  const roomId = new URL(req.url, `http://${req.headers.host}`).pathname.slice(1);
  const { doc, awareness } = await loadDoc(roomId);

  // Map to track clients for awareness
  const clients = new Set();
  clients.add(conn);

  // Send initial sync
  const syncStep1 = Y.encodeStateVector(doc);
  conn.send(writeUpdate(doc, syncStep1));

  // Handle awareness changes
  const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
    const changedClients = added.concat(updated, removed);
    const update = encodeAwarenessUpdate(awareness, changedClients);
    for (const client of clients) {
      if (client !== conn && client.readyState === 1) {
        client.send(update);
      }
    }
  };

  awareness.on('update', awarenessChangeHandler);

  // Handle incoming messages
  conn.on('message', (message) => {
    const decoder = new Uint8Array(message);
    try {
      const messageType = decoder[0];
      if (messageType === 0) {
        const update = decoder.slice(1);
        Y.applyUpdate(doc, update);
        for (const client of clients) {
          if (client !== conn && client.readyState === 1) {
            client.send(update);
          }
        }
      } else if (messageType === 1) {
        awareness.applyAwarenessUpdate(decoder.slice(1), conn);
      }
    } catch (err) {
      console.error(`Message error for room [${roomId}]:`, err);
    }
  });

  conn.on('close', () => {
    clients.delete(conn);
    const allGone = [...wss.clients].every(
      (c) =>
        new URL(c?.upgradeReq?.url ?? '', `http://${c?.upgradeReq?.headers?.host}`).pathname.slice(1) !== roomId
    );

    if (allGone) {
      saveDoc(roomId, doc);
      docs.delete(roomId);
      console.log(`Room [${roomId}] cleaned up`);
    }
  });
});

console.log(`Yjs WebSocket Server running at ws://localhost:${YJS_PORT}`);
