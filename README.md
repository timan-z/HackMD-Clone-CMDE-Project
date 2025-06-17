# "HackMD Clone" (A Collaborative Markdown Editor built with React, Lexical, Yjs, and PostgreSQL)
<u>Version</u>: <b>1.0</b><br>
<u>Author</u>: <b>Timan Zheng</b><br>
<u>Date</u>: <b>6/17/2025</b> (_Completed from Jan - Jun 2025 part-time while working full-time_)<br>
<u>Description</u>: <b>This is a full-stack, real-time Collaborative Markdown Editor built with React, Lexical, Yjs, Socket.IO, and PostgreSQL among various other technologies. It is a web application that enables multiple users to edit markdown documents simultaneously with live cursor rendering, real-time interaction such as messaging and notifications, and robust session and user management. As the name suggets, this project was heavily inspired by and aims to capture the capabilities and modern UI of the existing CMDE HackMD but also similar products like Google Docs.</b>

## Table of Contents (_This will be a large README.doc_)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)

## Key Features
### Editor & Document Features
- Real-time collaborative text editing using <b>Yjs</b> CRDT
- Markdown preview rendering via `markdown-it`
- Persistent document state saved to PostgreSQL and loaded on start if applicable
- Custom remote cursor tracking and rendering within Text Editor.
### User & Room Management 
- Login and Register forms with validation and visual error popups
- Role-based room access and permissions (`king` / `member`)
- Invite links with expiration logic
- (`king`) Kick users, transfer ownership, and manage members in any room
### Real-Time Communication
- Socket.IO-powered live user presence & messaging
- Room-wide and private notifications
- Real-time DM system integrated into the editor
### Markdown Preview
- Live preview of Markdown content
- Task list support via `markdown-it-task-lists`
### Auth + Session Persistence
- JWT-based login + registration
- User state stored in `localStorage`
- Protected routes via custom `<PrivateRoute>` wrappers

## Tech Stack
### <b>Frontend</b>
- <b>ReactJS</b> (Vite)
- <b>Lexical Editor</b> (by Meta)
- <b>Socket.IO Client</b>
- <b>Yjs</b> + `y-websocket`
- <b>Markdown-it</b> + Task List Plugin
- <b>React Router DOM</b>
- <b>FileReader API</b> (for markdown uploads & Blob-based downloads)
- <b>CSS styling</b> with a custom monospace/Matrix-style theme. 

### <b>Backend</b>
- <b>Express.js</b> REST API (<b>expresServer.js</b>)
- <b>Socket.IO</b> server (<b>socketIOServer.js</b>)
- <b>PostgreSQL</b> for persistence
- <b>pg</b> Node.js driver
- <b>dotenv</b>, <b>cors</b>, <b>uuid</b>, <b>bcrypt</b>, <b>jsonwebtoken</b>

### Realtime Sync & Storage
- Yjs CRDT framework for collaborative editing
- Custom `saveRoomData()` & `getRoomData()` handlers for syncing state to DB

## Project Structure
```
mde-part2/
├─ .env
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ gifs/
│  │  ├─ create-room-fwwm.gif
│  │  └─ join-room-fwwm.gif
│  └─ images/
│     ├─ house-icon.png
│     ├─ notif-icon.png
│     └─ users-icon.png
├─ src/
│  ├─ components/
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  ├─ styles/
│  │  │  └─ index.css
│  │  ├─ backend/
│  │  │  ├─ expressServer.js
│  │  │  ├─ socketIOServer.js
│  │  │  ├─ schema.sql
│  │  │  ├─ routes/
│  │  │  │  └─ auth.js
│  │  │  └─ controllers/
│  │  │     └─ authController.js
│  │  ├─ core-features/
│  │  │  ├─ Toolbar.jsx
│  │  │  ├─ MDParser.jsx
│  │  │  ├─ PrivateRoute.jsx
│  │  │  ├─ PrivateRouteEditor.jsx
│  │  │  ├─ PrivateRouteMisc.jsx
│  │  │  ├─ RemoteCursorOverlay.jsx
│  │  │  └─ utilityFuncs.js
│  │  ├─ misc-features/
│  │  │  ├─ ChatBox.jsx
│  │  │  ├─ ManageUsersListEntry.jsx
│  │  │  ├─ ManageUsersListSection.jsx
│  │  │  ├─ ManageUsersSection.jsx
│  │  │  ├─ NotificationBar.jsx
│  │  │  ├─ NotificationBarHeader.jsx
│  │  │  ├─ UsersListContainer.jsx
│  │  │  ├─ UsersListEntry.jsx
│  │  │  ├─ UsersListHeader.jsx
│  │  │  └─ UsersListSection.jsx
│  │  ├─ pages/
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ Editor.jsx
│  │  │  ├─ Login.jsx
│  │  │  └─ Register.jsx
│  │  └─ utility/
│  │     ├─ api.js
│  │     ├─ utilityFuncs.js
│  │     └─ utilityFuncsBE.js
```
## Architecture Overview (Mermaid Diagram)
```
graph TD
    A[Login/Register Pages] --> B[JWT Auth via Express API]
    B --> C[PostgreSQL Users Table]
    D[Editor Page] --> E[Yjs WebSocket Server]
    E --> F[Collaborative Document Sync]
    D --> G[Socket.IO Server]
    G --> H[Active Users, Cursors, Messaging]
    D --> M[On Mount: Fetch Existing Doc]
    M --> N[GET Express API /ydocs]
    D --> I[Document Autosave]
    I --> J[PUT Express API /ydocs]
    D --> K[Markdown Parser]
    K --> L[Live Preview]
```
- <b>A->B->C</b> - Login and registration requests from the client hit the Express API, which authenticates them with JWT against the `users` table in my PostgreSQL backend.
- <b>D->E->F</b> - The Editor component connects to a `y-websocket` server which handles real-time collaborative editing via Yjs (the two sync).
- <b>D->G->H</b> - The Editor connects to a Socket.IO server to manage real-time interaction (presence, chat, cursor sharing, etc).
- <b>D->I->N</b> - On initial render, the editor checks if a saved version of the doc exists. Calls a `GET /api/ydocs/:roomId` route on the Express API, which pulls the Yjs document (as binary or string) from the ydocs table.
- <b>D->I->J</b> - During editing or on disconnect, autosaves are sent via a `PUT /api/ydocs` request. Content is saved into the `ydocs` table using `saveRoomData()` in your backend.
- <b>D->K->L</b> - The raw content is parsed using `markdown-it` with task list support (`MDParser.jsx`) and rendered as a live preview beside the editor.

## Setup & Run
### Prerequisites
- PostgreSQL running with schema from `schema.sql`
- Node.js v18+
- Cloudinary account (if you want to use the Upload `Image` functionality of the Editor).

### Environment Setup
Create `.env` file (_you can obviously adjust the values seen here like the `PORT` value chosen etc, this is just what I had in my setup, but be weary of what you would need to tweak in the code. Cloudinary values and an account are needed for the Upload Image functionality of the Editor (found in the Toolbar)_):
```
PORT=5000
DATABASE_URL=postgres://youruser:yourpassword@localhost:5432/yourdb
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
JWT_SECRET=your_jwt_secret
```
### Startup Commands (across four separate terminals)
```
npm run dev                                     # 1. Frontend (Vite)
npx y-websocket --port 1234                     # 2. Yjs WebSocket Provider
node src/components/backend/socketIOServer.js   # 3. Socket.IO Server
node src/components/backend/expressServer.js    # 4. Express API Server
```
## Database Schema (PostgreSQL)
(_See full schema in `schema.sql`_)

Includes the following tables:
- `users`
- `rooms`
- `user_rooms`
- `invite_links`
- `ydocs` (_Admittedly, the name of this table should be changed -- I will elaborate more in the limitations section of the README_).
- `messages` (private chat messages)

## Testing Suggestions
- <b>Test role-based access by creating two accounts and joining the same room</b> (_type at the same time and watch the custom cursor rendering take form, message each other, keep an eye on notifications in one user's table when the other joins_).
- <b>Try kicking users or transferring ownership from Dashboard in real-time</b>














<br>
FUTURE TO-DO:
- Replace JavaScript markdown rendering with Rust compiled.
- Implement version control.
- Replace current version of how I'm loading and retrieving existing documents from the backend (wasn't able to figure it out, might need to dig deeper into the Lexical documentation for this).
- Minimal styling as of this moment -- I can admittedly make things look nicer than they do at the moment.

FUTURE IMPROVEMENTS:
(minor one) - Allow for Room owner to re-name rooms.

Admittedly I got caught up in the weed swhen it came to implementing a Messaging and Notifications feature -- time I definitely should have spent towards incorporating Version Control or something to that effect.

DONT FORGET TO MAKE NOTE OF THE CLOUDINARY THING -- THAT'S SOMETHING IMPORTANT TO NOTE DOWN...

This was a massive project that I kind of let get off the rails and overcomplicated far too much.
