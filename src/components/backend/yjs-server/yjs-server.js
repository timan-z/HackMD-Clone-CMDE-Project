// Nevermind let's just try to stick with the older version of setupWSConnection before I can figure out something else.
// NOTE:+TO-DO: Figure out how to write a custom server later ^ I need to get this stuff up and hosted wasted so muc htime.

/* 8/22/2025-DEBUG: For now, we're just going to seed on first person to join a room to make sure that I 100% guarantee
editor sync across all users that join the same editor room. (Temporarily just to ensure this logic actually works).
- Ideally, I'm supposed to be seeding the Editor rooms on initial room creation (intercepting the API call to the backend), which is outside 
the scope of the Editor.jsx file. (This is also much better for Version Control which I plan on integrating down the line).
- Also, given that I'm manually creating a server instead of just programmatically running a CLI command, I should merge this file w/ server.js
*/
const http = require("http");
const WebSocket = require("ws");
const setupWSConnection = require("y-websocket/bin/utils").setupWSConnection;
const LeveldbPersistence = require("y-leveldb").LeveldbPersistence;
const Y = require("yjs");

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || 1234;
const DATA_DIR = process.env.YPERSISTENCE || "./yjs-data";

// Persistence (LevelDB)
const ldb = new LeveldbPersistence(DATA_DIR);

// 8/22/2025-DEBUG: Below.
function extractRoomName(req) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.searchParams.has("room")) return url.searchParams.get("room");
    let pathname = url.pathname || "";
    if (pathname.startsWith("/")) pathname = pathname.slice(1);
    return pathname || null;
  } catch {
    return null;
  }
}
// 8/22/2025-DEBUG: Above.

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("8/21/2025-DEBUG: Yjs WebSocket server with LevelDB persistence");
});

const wss = new WebSocket.Server({ server });

// 8/22/2025-DEBUG: Below.
async function ensureSeed({ room, enableWrite }) {
  // Load persisted Y.Doc
  const ydoc = await ldb.getYDoc(room || "");
  const meta = ydoc.getMap("meta");
  const root = ydoc.getXmlFragment("root")  // will create root if it's not present... DEBUG: Maybe this is bad.
  const before = {
    bootstrapped: meta.get("bootstrapped") === true,
    rootLength: root.length,
    updateSize: Y.encodeStateAsUpdate(ydoc).byteLength
  };

  console.log("[SEED] before", { room, ...before });
  if (before.bootstrapped) {
    console.log("[SEED] already bootstrapped — nothing to do", { room });
    return;
  }

  // Prepare the mutation (inside a transaction)
  ydoc.transact(() => {
    meta.set("bootstrapped", true);
    const para = new Y.XmlElement("paragraph");
    const text = new Y.XmlText();
    para.insert(0, [text]);
    root.insert(0, [para]);
  });

  const afterUpdate = Y.encodeStateAsUpdate(ydoc);
  const after = {
    bootstrapped: meta.get("bootstrapped") === true,
    rootLength: root.length,
    updateSize: afterUpdate.byteLength
  };
  console.log("[SEED] after (not persisted yet)", { room, ...after });

  if (!enableWrite) {
    console.log("[SEED] DRY RUN — not persisting", { room });
    return;
  }
  await ldb.storeUpdate(room || "", afterUpdate);
  console.log("[SEED] persisted", { room });
}
// 8/22/2025-DEBUG: Above.

wss.on("connection", async(conn, req) => {
  // 8/22/2025-DEBUG: Below.
  const room = extractRoomName(req);
  console.log("[WS] Incoming connection.", {url: req.url, room, host:req.headers.host});
  
  console.log("debug: About to enter the try-block in wss.on(connection...)");
  try {
    // Load whatever's persisted for this room:
    const ydoc = await ldb.getYDoc(room || "");
    const meta = ydoc.getMap("meta");
    const root = ydoc.getXmlFragment("root"); // exists even if empty
    const updateSize = Y.encodeStateAsUpdate(ydoc).byteLength;
    console.log("[WS] pre-connection doc snapshot", {
      room,
      bootstrapped: meta.get("bootstrapped") === true,
      rootLength: root.length,
      updateSize
    });

    // DEBUG: Dry-run seeding pass.
    const enableWrite = process.env.USE_SERVER_SEED === "1";
    await ensureSeed({ room, enableWrite });
  } catch(e) {
    console.error("[WS] snapshot error", e);
  }
  console.log("debug: exiting the try-block in wss.on(connection...), about to setupWSConnection(...)");
  // 8/22/2025-DEBUG: Above.

  setupWSConnection(conn, req, { persistenceDir: DATA_DIR, ldb });
});

server.listen(port, host, () => {
  console.log(`8/21/2025-DEBUG: Yjs WebSocket server running on ws://${host}:${port}`);
  console.log(`8/21/2025-DEBUG: Persistence dir: ${DATA_DIR}`);
});