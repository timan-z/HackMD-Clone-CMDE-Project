/* NOTE:+EDIT: NEW ADDITION AND PROJECT STRUCTURAL CHANGE AS OF 8/16/2025:
The way this project is run locally is to have one process running to host the frontend (npm run dev)
and then three others to run the backend processes (Express API Server, Socket.IO Server, and Yjs WebSocket provider).

- Makes sense that the frontend process is kept separate. The three others are all for the backend though, and since I'm
planning on hosting them, I should merge them together (so I can serve them on one port on, say, Railway).

So this file here "server.js" basically squashes socketIOServer.js and expressServer.js together.
It will also embed the Yjs provider in it (my "npx y-websocket --port 1234" command). */

// DEBUG:+EDIT:+TO-DO: ^ Embedding the Yjs provider more complicated than I was expecting, this is something I should return to later for the sake of time.
import express from "express";
import http from "http"; // Express runs on HTTP.
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import pkg from 'lodash';
const { throttle } = pkg;

// Routes:
import authRoutes from "./routes/auth.js";
import { saveRoomData } from "../utility/utilityFuncsBE.js"; // adjust relative path
dotenv.config({ path:'./.env'});

// Socket.IO setup:
const app = express();
const server = http.createServer(app);
// Socket.IO-related variables:
const firstUserJoined = new Map(); // will have boolean values (true/false) mapped to RoomId values...
const latestEdDocs = new Map(); // Maps strings to roomIds.
const latestEdTokens = new Map(); // ^ coincides with latestEdDocs, just saving a valid token so saveRoomData function works...
let connectedUsers = {}; // This will my array var holding info about all the users currently connected to the webpage.
let clientCursors = []; // This will be my array var holding the client-cursor info objects for rendering in each Text Editor. (RemoteCursorOverlay.jsx)

// DEBUG: IS THE PROBLEM THE SLASH???
let FRONTEND_URL = null;
if(process.env.FRONTEND_URL.endsWith('/')) {
    console.log("endsWith if-condition was entered...");
    FRONTEND_URL = FRONTEND_URL.slice(0, -1);   // remove last character.
}
// DEBUG: IS THE PROBLEM THE SLASH???

// Attaching Socket.IO:
const io = new Server(server, {
  cors: {
    //origin: process.env.FRONTEND_URL || "http://localhost:5173",
    origin: FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials:true,
  },
});

console.log("DEBUG: The value of FRONTEND_URL => ", process.env.FRONTEND_URL);

// expressServer.js stuff:
//app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json()); // Parses incoming JSON requests. 

// Postgres-related
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error acquiring client", err);
    return;
  }
  client.query("SELECT NOW()", (err, result) => {
    release();
    if (err) return console.error("Error executing query", err.stack);
    console.log("PostgreSQL connected: ", result.rows);
  });
});

// Routes:
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => { res.send("Backend is running."); });

// Socket.IO logic:
io.on("connection", (socket) => {
    // connection notice (to the overall Socket.IO server):
    console.log("A user connected: ", socket.id);

    // connection notice (to a particular Text Editor Room):
    socket.on("join-room", (roomId, userId, username) => {
        socket.join(roomId);    // We'll have a room specifically matching the Text Editor RoomId...
        socket.userId = userId;
        socket.username = username;
        socket.roomId = roomId;

        let joinNotif = `User {${username}} ID:(${userId}) has connected to Socket.IO Server #${roomId}`;
        console.log(joinNotif);
        // When a User joins a specific Text Room, I want that to come as a notification Room-wide:
        socket.to(roomId).emit("notification", {
          message: joinNotif,
          timeStamp: Date.now() 
        });

        // I want to track this user's "activity" status for this Room:
        if(!connectedUsers[roomId]) connectedUsers[roomId] = [];

        const alreadyExists = connectedUsers[roomId].some(
            (user) => user.userId === userId
        );

        if(!alreadyExists) {
            connectedUsers[roomId].push({
                socketId: socket.id, userId, username
            });
        }

        // Emit updated list (of Active Users) to the Editor Room:
        io.to(roomId).emit("active-users-list", connectedUsers[roomId]);
    });

    // socket to signal loading of prior document data (on mount):
    socket.on("ready-for-load", (roomId) => {
        if (!firstUserJoined.has(roomId)) {
            firstUserJoined.set(roomId, true);
            console.log("First client in room is ready, sending load-existing...");
            socket.emit("load-existing"); // actual document data will already be stored in a state variable...
        }
    });

    // socket to receive latest documents of the text editor doc for a specific room:
    socket.on("send-latest-doc", (roomId, jsonString, token) => {
        latestEdDocs.set(roomId, jsonString);
        latestEdTokens.set(roomId, token);
    });

    // Handle notifications from the client-side:
    socket.on("notification", (data) => {
        // This notification is from Dashboard.jsx -- it's for when a User decides to leave the Room (resigning access):
        if(data.type === "leave-room") {
            socket.to(data.roomId).emit("notification", {
                type: data.type,
                roomId: data.roomId,
                userId: data.userId,
                username: data.username,
                message: data.message,
                timestamp: Date.now(),
            });
            return;
        }
        
        // This notification is from ManageUsersSection.jsx -- for when the Owner kicks a User from the room (removing access):
        if(data.type === "kick-user") {
            socket.to(data.roomId).emit("notification", {
                type: data.type,
                roomId: data.roomId,
                userId: data.userId,
                username: data.username,
                message: data.message,
                timestamp: Date.now(),
            });

            // Loop through all connected sockets to see if the kicked user is connected (if so, they are booted in real-time):
            for(const [socketId, userData] of io.sockets.sockets) {
                if(userData.userId === data.userId) {
                    // Emit a event to the target socket:
                    io.to(socketId).emit("you-have-been-kicked", {
                        roomId: data.roomId,
                        message: "You have been kicked from the room by the owner.",
                        timestamp: Date.now(),
                    });
                    break;
                }
            }
            return;
        }

        // This notification is from ManageUsersSection.jsx -- for when the Owner transfers ownership to another user:
        if(data.type === "transfer-ownership") {
            socket.to(data.roomId).emit("notification", {
                type:data.type,
                roomId:data.roomId,
                targetUserId:data.targetUserId,
                currentUserId:data.currentUserId,
                targetUsername:data.targetUsername,
                message:data.message,
                timestamp:Date.now(),
            });
            return;
        }
    })

    // Handle client sending private messages:
    socket.on('private-message', ({from, to, text}) => {
        for(const [socketId, userData] of io.sockets.sockets.entries()) {
            if(userData.userId === to) {
                io.to(socketId).emit('private-message', {from, to, text});  // For emitting the actual message.
                io.to(socketId).emit('notification', {  // For emitting the notification.
                    type:"dm",
                    from,
                    to,
                    message: `New message from ${socket.username}.`,
                    timestamp: Date.now()
                })
                break;
            }
        }
    });

    // Wrapping an emit.broadcast of clientCursors with a throttle to (try to) prevent race conditions:
    const broadcastCursors = throttle(() => {
        socket.broadcast.emit("update-cursors", clientCursors);
    }, 100); // 100ms seems like a reasonable interval.

    // Handle client sending their cursor position within the Text Editor (*will happen frequently*). Needed for foreign cursor rendering!!!: 
    socket.on("send-cursor-pos", (absCursorPos, clientId, clientUsername) => {
        const clientCursor = {cursorPos: absCursorPos, id:clientId, username: clientUsername};
        const isItAlrThere = clientCursors.findIndex(item => item.id === clientId); // Check if there's already an obj in clientCursors rep'ing this socket.        

        if(isItAlrThere !== -1) {
            // Obj with id===clientId present in clientCursors means that specific element needs to be replaced (isItAlrThere === index):
            clientCursors[isItAlrThere] = clientCursor;
        } else {
            // Not present, so we can push it in:
            clientCursors.push(clientCursor);
        }
        // Broadcasting the state of clientCursors:
        broadcastCursors();
    });

    // socket "disconnect" and "leave-room" are handled the same way:
    const discLeaveHandler = (socket) => {
        console.log("User disconnected:", socket.id);

        // After disconnection, I need to remove the recently-disconnected socket from array clientCursors too:
        let targetIndex = 0;
        clientCursors.forEach(client => {
            if(client.id === socket.id) {
                clientCursors.splice(targetIndex, 1);
            }
            targetIndex += 1; 
        });
        broadcastCursors();

        const {userId, roomId, username} = socket;

        if(connectedUsers[roomId]?.length === 0) {
            firstUserJoined.delete(roomId);
        }

        if(roomId && connectedUsers[roomId]) {
            connectedUsers[roomId] = connectedUsers[roomId].filter(
                (user) => user.socketId !== socket.id
            );

            // Notify remaining users in the room:
            io.to(roomId).emit("active-users-list", connectedUsers[roomId]);
            // Clean up empty rooms (if applicable):

            if(connectedUsers[roomId].length === 0) {
                // save room data to postgresql:
                saveRoomData(roomId, latestEdDocs.get(roomId), latestEdTokens.get(roomId));

                delete connectedUsers[roomId];
                delete latestEdDocs[roomId];
                delete latestEdTokens[roomId];

                firstUserJoined.delete(roomId); // get rid of this too (flag that lets you know if prev-data should be loaded).
            }
        }

        // NOW - EMIT A NOTIFICATION INDICATING THAT USER HAS LEFT THE ROOM:
        socket.to(roomId).emit("notification", {
            type:"leave-session",
            roomId: roomId,
            userId: userId,
            username: username,
            message: `${username} ID:(${userId}) has left this Editing session.`,
            timestamp: Date.now()
        });        
    };

    // leave-room notice:
    socket.on("leave-room", ()=> {
        socket.hasLeftRoom = true;
        discLeaveHandler(socket);
    });
    // disconnection notice (from the server):
    socket.on("disconnect", () => {
        // Clean-up only occurs if it hasn't already happened (see socket.on("leave-room"))
        if(!socket.hasLeftRoom) {
            discLeaveHandler(socket);
        }
    });

});

// Start server:
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
