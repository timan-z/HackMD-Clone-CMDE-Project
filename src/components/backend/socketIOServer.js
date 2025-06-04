// NOTE: My command for starting this server is "node src/components/Server.js"

/* For implementing real-time Text Editor collaboration between multiple users, I'll
be using Socket.IO with Express as my backend for real-time synchronization. */
import express from "express";
import http from "http"; // Express runs on HTTP.
import { Server } from "socket.io";
import cors from "cors";
import pkg from 'lodash';
import { connect } from "http2";
const { throttle } = pkg;

// FOR SERVER SET-UP STUFF:
import * as Y from 'yjs';
const yDocs = new Map();    // Key: roomId, Value: Y.Doc instance (serialized)



const firstUserJoined = new Map(); // will have boolean values (true/false) mapped to RoomId values...


/* NOTE-TO-SELF:
 - io.emit will send this event to *all* clients (including the server, which here will be irrelevant).
 - socket.emit will send the event *only* to the specific client that triggered it.
 - socket.broadcast.emit will send the even to all *other* clients except the sender.
*/

// setup:
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    // You need this stuff below to bypass issues with cors.
    cors: {
        origin: "http://localhost:5173", // This is **my** frontend URL; NOTE: I should have a variable for this in .env I think.
        methods: ["GET", "POST"],
    },
});

let connectedUsers = {}; // This will my array var holding info about all the users currently connected to the webpage.
let clientCursors = []; // This will be my array var holding the client-cursor info objects for rendering in each Text Editor. (RemoteCursorOverlay.jsx)

/*const saveYDocToPostgres = async(roomId, ydoc) => {
    const binaryData = Y.encodeStateAsUpdate(ydoc); // Turning ydoc document state to Uint8Array.

    try {
        console.log("NEED TO CALL api.js FUNCTION HERE!!!");

    } catch(err) {
        console.error(`ERROR: Failed to save Yjs doc for Room ID:(${roomId}) because of: ${err}`);
    }
}*/

io.on("connection", (socket) => {
    // connection notice (to the overall Socket.IO server):
    console.log("A user connected: ", socket.id);

    // connection notice (to a particular Text Editor Room):
    socket.on("join-room", (roomId, userId, username) => {
        socket.join(roomId);    // We'll have a room specifically matching the Text Editor RoomId...
        socket.userId = userId;
        socket.username = username;
        socket.roomId = roomId;

        console.log("JOIN-DEBUG: join-room socket entered!!!");
        



        /*if(!firstUserJoined.has(roomId)) {
            firstUserJoined.set(roomId, true);
            console.log(`Join-Debug: The first user to join Room (ID:${roomId}) has entered.`);
            //socket.to(roomId).emit("load-existing"); 
            setTimeout(() => {
                socket.emit("load-existing");
            }, 2000);
            console.log(`Join-Debug: The emit was sent but nothing received.`);
        }*/




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
            socket.emit("load-existing");
        }
    });








    // Handle notifications from the client-side:
    socket.on("notification", (data) => {
        
        console.log("DEBUG: socket.on(\"notification\") HAS BEEN ENTERED!!!");

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

            console.log("DEBUG: The for-loop I'm expecting to run is about to run...");
            console.log("DEBUG: The value of data.userId => [", data.userId, "]");

            // Loop through all connected sockets to see if the kicked user is connected (if so, they are booted in real-time):
            for(const [socketId, userData] of io.sockets.sockets) {

                console.log("Debug: The value of socketId => [", socketId, "]");
                console.log("Debug: The value of userData.userId => [", userData.userId, "]");

                if(userData.userId === data.userId) {

                    console.log("Debug: Sending the emit I expect to be emitted!");

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
        console.log("DEBUG: The client sending their cursor position: [", clientId, "]");
        console.log("DEBUG: The client sending their username: [", clientUsername, "]");
        console.log("DEBUG: Their cursor position: ", absCursorPos);
        const clientCursor = {cursorPos: absCursorPos, id:clientId, username: clientUsername};
        const isItAlrThere = clientCursors.findIndex(item => item.id === clientId); // Check if there's already an obj in clientCursors rep'ing this socket.        

        if(isItAlrThere !== -1) {
            // Obj with id===clientId present in clientCursors means that specific element needs to be replaced (isItAlrThere === index):
            clientCursors[isItAlrThere] = clientCursor;
        } else {
            // Not present, so we can push it in:
            clientCursors.push(clientCursor);
        }
        console.log("DEBUG: Current state of clientCursors: ", clientCursors);
        // Broadcasting the state of clientCursors:
        broadcastCursors();
    });

    // socket "disconnect" and "leave-room" are handled the same way:
    const discLeaveHandler = (socket) => {
        console.log("User disconnected:", socket.id);
        console.log("DEBUG: [clientCursors Pre-Splice] => ", clientCursors);

        // After disconnection, I need to remove the recently-disconnected socket from array clientCursors too:
        let targetIndex = 0;
        clientCursors.forEach(client => {
            /* NOTE:+DEBUG: Eventually I'm going to phase out "socket.id" as my foreign cursor identifier (what appears in the tag)
            so *maybe* note I'll need to rework this (but ig I could keep "socket.id" and just use add another parameter for the display name). */
            if(client.id === socket.id) {
                clientCursors.splice(targetIndex, 1);
            }
            targetIndex += 1; 
        });
        console.log("DEBUG: [clientCursors Post-Splice] => ", clientCursors);
        broadcastCursors();

        // UPDATE: NEW ADDITIONS (REMOVING Socket FROM connectedUsers):
        const {userId, roomId, username} = socket;
        if(roomId && connectedUsers[roomId]) {
            connectedUsers[roomId] = connectedUsers[roomId].filter(
                (user) => user.socketId !== socket.id
            );

            // Notify remaining users in the room:
            io.to(roomId).emit("active-users-list", connectedUsers[roomId]);
            // Clean up empty rooms (if applicable):
            if(connectedUsers[roomId].length === 0) {
                delete connectedUsers[roomId];
            }
            console.log("DEBUG: The value of userId => [", userId, "]");
            console.log("DEBUG: The value of username => [", username, "]");
        }
        // ABOVE-UPDATE: SEEMS TO WORK QUITE GOOD SO FAR...

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

server.listen(4000, () => console.log("Server running on port 4000")); // specify port 4000 as the server location.
