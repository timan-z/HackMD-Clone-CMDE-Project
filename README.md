# "HackMD Clone" (A Collaborative Markdown Editor built with React, Lexical, Yjs, and PostgreSQL)
<u>Version</u>: <b>1.0</b><br>
<u>Author</u>: <b>Timan Zheng</b><br>
<u>Date</u>: <b>6/17/2025</b> (_Completed from Jan - Jun 2025 part-time while working full-time_)<br>
<u>Description</u>: <b>This is a full-stack, real-time Collaborative Markdown Editor built with React, Lexical, Yjs, Socket.IO, and PostgreSQL among various other technologies. It is a web application that enables multiple users to edit markdown documents simultaneously with live cursor rendering, real-time interaction such as messaging and notifications, and robust session and user management. As the name suggets, this project was heavily inspired by and aims to capture the capabilities and modern UI of the existing CMDE HackMD but also similar products like Google Docs.</b>

## Table of Contents (_This will be a large README.doc_)
- [Overview]
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)


## Key Features
- **Live Markdown Editing (CRDT Sync)** powered by Lexical and Yjs + WebSocketProvider
- **Real-Time Collaboration** with custom floating remote cursors
- **(Editor) Room Management** with ownership and user roles 
- **Invite Link System** with expiration logic
- **Real-Time Messaging** between users in a room and via Socket.IO (messages persist w/ PostgreSQL)
- **Transient Notifications** (user joined, left, messaged, promoted to owner, etc)
- **User Authentication** with JWT and session cookies
- **Persistent Document state** via PostgreSQL + Yjs binary storage









## Tech Stack
### Frontend
- ReactJS (Vite)
- Lexical Editor (by Meta)
- TailwindCSS (custom monospace/Matrix-style theme)
- Socket.IO Client
- React Router
- FileReader API (uploads and "Blob download") 

### Backend
- Express.js (Node.js)
- PostgreSQL
- Socket.IO Server
- Yjs (custom provider & shared document state persistence)
- y-websocket
- JWT & bcrypt for authentication

### Tooling
- dotenv, nodemon, pg, cookie-parser, etc.












<br>
FUTURE TO-DO:
- Replace JavaScript markdown rendering with Rust compiled.
- Implement version control.
- Replace current version of how I'm loading and retrieving existing documents from the backend (wasn't able to figure it out, might need to dig deeper into the Lexical documentation for this).
- Minimal styling as of this moment -- I can admittedly make things look nicer than they do at the moment.

FUTURE IMPROVEMENTS:
(minor one) - Allow for Room owner to re-name rooms.