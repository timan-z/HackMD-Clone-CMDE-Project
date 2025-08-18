const { spawn } = require("child_process");

const PORT = process.env.PORT || "1234";
const HOST = "0.0.0.0";

// CLI command and args.
const cmd = "npx";
const args = ["y-websocket", "--port", PORT, "--host", HOST];

// Build child env: copy current env but force HOST and PORT
const childEnv = Object.assign({}, process.env, { HOST, PORT: String(PORT) });

console.log(`[wrapper] Spawning: ${cmd} ${args.join(" ")}`);
const wsProc = spawn(cmd, args, {
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
