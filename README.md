# "HackMD Clone" (A Collaborative Markdown Editor built with React, Lexical, Yjs, and PostgreSQL)
<u>Version</u>: <b>1.0</b><br>
<u>Author</u>: <b>Timan Zheng</b><br>
<u>Date</u>: <b>6/17/2025</b> (_Completed from Jan - Jun 2025 part-time while working full-time_)<br>
<u>Description</u>: <b>This is a full-stack, real-time Collaborative Markdown Editor built with React, Lexical, Yjs, Socket.IO, and PostgreSQL among various other technologies. It is a web application that enables multiple users to edit markdown documents simultaneously with live cursor rendering, real-time interaction such as messaging and notifications, and robust session and user management. As the name suggets, this project was heavily inspired by and aims to capture the capabilities and modern UI of the existing CMDE HackMD but also similar products like Google Docs.</b>

## Table of Contents
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Design](#architecture-overview-mermaid-diagram)
- [How SQL Queries Flow](#how-sql-queries-flow-here)
- [Setup & Run](#setup--run)
- [Database Schema (PostgreSQL)](#database-schema-postgresql)
- [Testing Suggestions](#testing-suggestions)
- [Some Limitations](#some-limitations)
- [Future Improvements](#future-improvements-and-things-to-add)

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

## How SQL Queries "Flow" Here:
1. My React frontend code (e.g., a file like `Dashboard.jsx`) invokes a function that was invoked from my `/utility/api.js` file (where I have reusable functions to interact with my Express API e.g., `getAllRooms()`).
```
export const getAllRooms = async(token) => {
    const result = await fetch(`${API_BASE}/auth/rooms`, {
        method:"GET",
        headers: { Authorization: `Bearer ${token}` },
    });
    return await result.json();
};
```
2. Then, on the backend Express server, the request sent by `api.js` is received and all necessary information is extracted in `auth.js` with `router.get('/rooms', verifyToken, getAllEdRooms);` (where those two functions passed are executed from left to right, the former just being some JWT verification function that also passes some arguments off to `getAllEdRooms`).
3. Then, in `authController.js`, `getAllEdRooms` runs, and that's what sends the information I want back to the frontend:
```
export const getAllEdRooms = async (req, res) => {
    const userID = req.user.id; // Will get obtained by func verifyToken...
    try {
        const roomsRes = await pool.query(`
            SELECT
                ur.id AS user_room_id,
                ur.role,
                r.id AS room_id,
                r.name AS room_name,
                r.created_at,
                u.username AS creator_name
            FROM user_rooms ur
            JOIN rooms r ON ur.room_id = r.id
            JOIN users u ON r.created_by = u.id
            WHERE ur.user_id = $1
            ORDER BY r.created_at DESC
        `, [userID]);

        res.json(roomsRes.rows);
    } catch (err) {
        console.error("DEBUG: FAILED TO RETRIEVE ROOMS => [", err, "]");
        res.status(500).json({error: "COULD NOT RETRIEVE EDITOR ROOMS."});
    }
};
```
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
- <b>Sign up</b> and register two different accounts (you can do this in two separate browsers, maybe one browser and an incognito tab).
- From the <b>Dashboard</b>, create a new Editor Room and create an invite link, invite the other account you made.
- Have one user join said room and then the other user join that room, <b>watch the Notifications symbol animate</b> in response to their entry (click it and view the Notification, optionally you can clear it).
- <b>Begin typing in the Text Editor</b>, then open the other user's tab and <b>notice the custom foreign cursor (with username) render that appears on the screen</b>. You can type there as well and check vice-versa. You will notice edits are synced in real-time via Yjs and that Markdown syntax is parsed on-the-fly in a live Preview Panel.
- Play around with the Editor UI, <b>toggle the view modes, drag the "draggable" slider that lets you resize the Editor and Preview Panel</b>. Play around with the Toolbar icons.
- Click on the <b>Users List icon</b> and then target the other user in the room for the <b>Chat button, send them messages</b> and see how they are received and how they persist.
- On the Owner User client, return to the Dashboard and <b>kick the other User</b> from the room you were both in, go to the latter user's tab and notice the pop-up that appears.

## Some Limitations
### Email addresses are not verified:
- No email verification system is implemented (for simplicity, it's really not the point of this project and I didn't want to dwell any longer on miscellaneous features).
### Single-server design:
- The current implementation assumes all servers (Express, Socket.IO, y-websocket) run locally and are not load-balanced or clustered.
### Invite links are not rate-limited:
- Repeatedly generating invite links can fill the `invite_links` table without cleanup unless a background job is added.
### No full Markdown export styling:
- I have basic markdown export available via download, but full PDF-style or print styling has not been implemented here.
### I meant to replicate all of HackMD's editor functionalities but there were some I had to scrap:
- Namely the additional configurations when hovering your cursor over a Table structure in the Text Editor contenteditable. There is litterally no way I can do that by myself without introducing new frameworks that just aren't worth it.
### My method of saving and loading Editor Doc state could be better (this doubles as a future improvement):
- So, if you really look at my code, you'll notice that in Editor.jsx I'm querying the PostgreSQL backend for a pre-existing document state and what I'm retrieving is a JSON string representation of the Editor state from a table called "ydocs". That's strange. And that's because my original plan was to serialize the state of the ydocs document and store that in my backend. And while I originally did that successfully so, and was able to retrieve it at start-up and verify that the data was correct, I just couldn't initialize/bootstrap the Lexical Text Editor with its values and after two full days of trying to figure out what was wrong, I gave up and opted for this alternative instead (you can look at old commits and find my original set-up which was much more elaborate). At some point, I might dive back in and try to figure this out.

## Future Improvements and Things to Add
### I definitely should look to implement Version Control
- This is by far the most glaring ommission from my project. I got way too hung up on miscellaneous features such as the Chat and Notification system when I definitely should have focused on more integral and technically impressive features like implementing Version Control. I let the scope of this project get far too wide and overcomplicated way too much.
### Thinking about tweaking the rendering logic
- Considering replacing my JavaScript Markdown parser and instead using a modular <b>Rust</b>-based Markdown parser, compiled to <b>WebAssembly (WASM)</b> and integrated to my web app. This is pretty much just to expand my list of technologies. I would probably do this first and then aim to implement version control.
### I could probaly style things a little better
- This was by far my lowest priority.
