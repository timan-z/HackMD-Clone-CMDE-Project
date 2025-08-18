import http from "http";
import express from "express";
import { WebSocketServer } from "ws";

// Correct CommonJS import + destructuring for v1.x
import pkg from "y-websocket";
const { setupWSConnection } = pkg;

const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.get("/", (_req, res) => res.send("Yjs WS provider OK"));
app.get("/healthz", (_req, res) => res.send("ok"));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, perMessageDeflate: false });

server.on("upgrade", (req, socket, head) => {
  console.log("HTTP upgrade attempt:", {
    url: req.url,
    origin: req.headers.origin,
    host: req.headers.host
  });
});

wss.on("connection", (ws, req) => {
  const docName = req.url.slice(1);
  console.log("WebSocket connected for doc:", docName, "origin:", req.headers.origin);
  setupWSConnection(ws, req, { docName });
});

server.listen(PORT, HOST, () => {
  console.log(`Yjs WS server listening on ${HOST}:${PORT}`);
});
