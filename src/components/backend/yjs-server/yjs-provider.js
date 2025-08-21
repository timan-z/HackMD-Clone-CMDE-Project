const { spawn } = require("child_process");
const path = require("path"); // 8/19/2025-DEBUG: ATTEMPTING TO ADD LevelDB PERSISTENCE DIRECTORY.
const fs = require("fs"); // 8/19/2025-DEBUG: ATTEMPTING TO ADD LevelDB PERSISTENCE DIRECTORY.

const PORT = process.env.PORT || "1234";
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = process.env.YPERSISTENCE || path.join(__dirname, "yjs-data"); // 8/19/2025-DEBUG: ATTEMPTING TO ADD LevelDB PERSISTENCE DIRECTORY.

// 8/19/2025-DEBUG: ATTEMPTING TO ADD LevelDB PERSISTENCE DIRECTORY.
try {
  fs.mkdirSync(DATA_DIR, {recursive: true});
} catch(e) {
  // yeet
}

// CLI command and args.
//const cmd = "npx";
const node = process.execPath; // 8/19/2025-DEBUG: ATTEMPTING TO ADD LevelDB PERSISTENCE DIRECTORY.
const serverScript = path.join(__dirname, "node_modules", "y-websocket", "bin", "server.js"); // 8/19/2025-DEBUG: ATTEMPTING TO ADD LevelDB PERSISTENCE DIRECTORY.
const args = [serverScript, "--port", PORT, "--host", HOST];

// Build child env: copy current env but force HOST and PORT
const childEnv = Object.assign({}, process.env, { HOST, PORT: String(PORT), YPERSISTENCE: DATA_DIR, });
console.log(`[wrapper] Spawning: ${node} ${args.map(a => JSON.stringify(a)).join(" ")}`);
console.log(`[wrapper] YPERSISTENCE dir: ${DATA_DIR}`);

const wsProc = spawn(node, args, {
  stdio: "inherit",
  env: childEnv,
  shell: false,
});

wsProc.on("exit", (code, signal) => {
  console.log(`[wrapper] y-websocket process exited with code=${code}, signal=${signal}`);
  if (signal || code !== 0) process.exit(code === null ? 1 : code);
});
wsProc.on("error", (err) => {
  console.error("[wrapper] Failed to start y-websocket CLI:", err);
  process.exit(1);
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[wrapper] Received ${signal}, shutting down child process...`);
  if (!wsProc.killed) wsProc.kill("SIGTERM");
  setTimeout(() => {
    if (!wsProc.killed) try { wsProc.kill("SIGKILL"); } catch (e) {}
    process.exit(0);
  }, 5000);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log(`[wrapper] started - forwarding to y-websocket on ${HOST}:${PORT}`);