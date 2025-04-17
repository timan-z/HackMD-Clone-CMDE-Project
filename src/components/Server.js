// NOTE: My command for starting this server is "node src/components/Server.js"

/* For implementing real-time Text Editor collaboration between multiple users, I'll
be using Socket.IO with Express as my backend for real-time synchronization. */
import express from "express";
import http from "http"; // Express runs on HTTP.
import { Server } from "socket.io";
import cors from "cors";
import pkg from 'lodash';
const { throttle } = pkg;

/* NOTE-TO-SELF:
 - io.emit will send this event to *all* clients (including the server, which here will be irrelevant).
 - socket.emit will send the event *only* to the specific client that triggered it.
 - socket.broadcast.emit will send the even to all *other* clients except the sender.
*/

// setup:
const app = express();
const server = http.createServer(app);


// RAAAAAAAAAAAAA
import * as Y from 'yjs';


const io = new Server(server, {
    // You need this stuff below to bypass issues with cors.
    cors: {
        origin: "http://localhost:5173", // This is **my** frontend URL; NOTE: I should have a variable for this in .env I think.
        methods: ["GET", "POST"],
    },
});

const docs = new Map(); // in-memory shared state
function getYDoc(docName) {
    if(!docs.has(docName)) {
        const ydoc = new Y.Doc();
        docs.set(docName, ydoc);
    }
    return docs.get(docName);
}

io.on("connection", (socket) => {
    // connection notice:
    console.log("A user connected: ", socket.id);

    /*const doc = getYDoc('room-1');
    // When a client connects, send them the current Yjs state:
    const stateUpdate = Y.encodeStateAsUpdate(doc);
    socket.emit('yjs-init', Array.from(stateUpdate));

    socket.on("yjs-update", (update) => {
        console.log(`[SERVER] Received yjs-update from ${socket.id}`);
        console.log("[YJS] update received:", update);
        const binary = new Uint8Array(update);
        Y.applyUpdate(doc, binary);

        console.log("[SERVER] Emitting yjs-init to", socket.id)

        socket.broadcast.emit("yjs-update", update);    // forward to all others.
    });*/

    // disconnection notice:
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

    });
});

server.listen(4000, () => console.log("Server running on port 4000")); // specify port 4000 as the server location.