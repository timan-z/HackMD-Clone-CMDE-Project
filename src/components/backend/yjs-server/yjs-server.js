import http from "http";
import WebSocket, {WebSocketServer} from "ws";
import * as Y from "yjs";
import { LeveldbPersistence } from "y-leveldb";

const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = process.env.YPERSISTENCE || "./yjs-data";

const ldb = new LeveldbPersistence(DATA_DIR);
const docs = new Map(); // in-memory Y.Docs (cached alongside persistence)

// Setting up setupWSConnection manually since /bin/utils.js isn't exposed anymore...
function setupWSConnection(ws, req, { docName, persistence }) {
  let doc = docs.get(docName);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docName, doc);

    // Try to load persisted state
    persistence.getYDoc(docName).then((persistedDoc) => {
      const persistedState = Y.encodeStateAsUpdate(persistedDoc);
      Y.applyUpdate(doc, persistedState);
    });
  }

  // Sync step 1: send state vector to client
  ws.on("message", (message) => {
    const encoder = Y.encodeStateAsUpdate(doc);
    ws.send(encoder);
  });

  // Sync step 2: apply client updates
  ws.on("message", (update) => {
    Y.applyUpdate(doc, new Uint8Array(update));
    persistence.storeUpdate(docName, update);

    // Broadcast to other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(update);
      }
    });
  });

  ws.on("close", () => {
    console.log(`[yjs-server] closed connection for doc: ${docName}`);
  });
}

// HTTP + WebSocket server:
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Yjs WebSocket Server running.");
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    const docName = req.url.slice(1).split("?")[0];
    setupWSConnection(ws, req, { docName, persistence: ldb });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[yjs-server] running on ws://${HOST}:${PORT}`);
  console.log(`[yjs-server] persistence dir: ${DATA_DIR}`);
});
