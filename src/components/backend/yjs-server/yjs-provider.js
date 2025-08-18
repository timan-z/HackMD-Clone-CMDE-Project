const { spawn } = require("child_process");

const PORT = process.env.PORT || "1234";
const HOST = process.env.HOST || "0.0.0.0";

// CLI command and args. Uses npx so it prefers local node_modules/.bin first.
const cmd = "npx";
const args = ["y-websocket", "--port", PORT, "--host", HOST];

// Start the child process
console.log(`[wrapper] Spawning: ${cmd} ${args.join(" ")}`);
const wsProc = spawn(cmd, args, {
  stdio: "inherit",
  env: process.env,
  shell: false,
});

// Track child exit
wsProc.on("exit", (code, signal) => {
  console.log(`[wrapper] y-websocket process exited with code=${code}, signal=${signal}`);
  // If the websocket server exits unexpectedly, exit the wrapper too so host restarts the container.
  if (signal || code !== 0) {
    process.exit(code === null ? 1 : code);
  }
});

// Forward error events
wsProc.on("error", (err) => {
  console.error("[wrapper] Failed to start y-websocket CLI:", err);
  process.exit(1);
});

// Graceful shutdown handling
let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[wrapper] Received ${signal}, shutting down child process...`);
  if (!wsProc.killed) {
    // Send SIGTERM to the child
    wsProc.kill("SIGTERM");
  }

  // Give it a moment to exit, then force kill
  setTimeout(() => {
    if (!wsProc.killed) {
      console.log("[wrapper] Force-killing child process");
      try { wsProc.kill("SIGKILL"); } catch (e) {}
    }
    process.exit(0);
  }, 5000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// log so Railway logs show wrapper is running
console.log(`[wrapper] started - forwarding to y-websocket on ${HOST}:${PORT}`);
