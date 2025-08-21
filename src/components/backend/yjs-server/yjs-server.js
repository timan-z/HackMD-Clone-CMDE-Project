// Nevermind let's just try to stick with the older version of setupWSConnection before I can figure out something else.
// NOTE:+TO-DO: Figure out how to write a custom server later ^ I need to get this stuff up and hosted wasted so muc htime.
const http = require("http");
const WebSocket = require("ws");
const setupWSConnection = require("y-websocket/bin/utils").setupWSConnection;
const LeveldbPersistence = require("y-leveldb").LeveldbPersistence;

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || 1234;
const DATA_DIR = process.env.YPERSISTENCE || "./yjs-data";

// Persistence (LevelDB)
const ldb = new LeveldbPersistence(DATA_DIR);

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("8/21/2025-DEBUG: Yjs WebSocket server with LevelDB persistence");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (conn, req) => {
  setupWSConnection(conn, req, {
    persistenceDir: DATA_DIR,
    ldb
  });
});

server.listen(port, host, () => {
  console.log(`8/21/2025-DEBUG: Yjs WebSocket server running on ws://${host}:${port}`);
  console.log(`8/21/2025-DEBUG: Persistence dir: ${DATA_DIR}`);
});
