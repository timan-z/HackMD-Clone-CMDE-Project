# The Main Files of Interest (Core Components)

## TABLE OF CONTENTS
### Frontend:
- [Editor.jsx](#editorjsx)
- [Toolbar.jsx](#toolbarjsx-integral-part-of-editorjsx )
- [Dashboard.jsx](#dashboardjsx)
- [Register.jsx](#registerjsx)
- [Login.jsx](#loginjsx)
- [App.jsx](#appjsx)
### Backend:
- [socketIOServer.js](#socketioserverjs)
- [expressServer.js](#expressserverjs)
### Overall:
- [Frontend Highlights](#frontend-highlights)
- [Backend Highlights](#backend-highlights)

[Returning to the main README.md file](./README.md)

## Editor.jsx
This is the file where the <b>Real-Time Collaborative Text Editor</b>, using <b>Lexical</b> (by Meta) as the Editor base and <b>Yjs</b> for shared document state CRDT (Conflict-free replicated data type) sync, is defined.

### Tech Stack (Frontend)
- <b>Editor Base</b>: Lexical (by Meta)
- <b>CRDT Sync</b>: Yjs + WebSocketProvider
- <b>Sockets</b>: Socket.IO (for chat, presence, and notifications)
- <b>Routing</b>: React Router (`useNavigate`)
- <b>File Handling</b>: FileReader API (uploads and "Blob download")

### System Architecture (High-Level)
```
[User] → [Editor UI (Lexical)] ↔ [Yjs Doc (Shared CRDT)]
                               ↕
                        [WebSocket Provider]
                               ↕
           [Custom WebSocket Server w/ Socket.IO]
                               ↕
             [PostgreSQL Backend for persistence]
```
- <b>Lexical</b> handles user input and output.
- <b>Yjs</b> synchronizes the editor state across users in the same room.
- <b>Socket.IO</b> is layered inbetween to track presence, send notifications and messages, kick users or transfer ownership, and communicate with the <b>PostgreSQL</b> backend.
- <b>Editor</b> queries the backend for a pre-existing document state on page load (pre-Lexical and Yjs sync) and, if found, sets the pre-existing editor state. On unload, it saves the document state to the backend.

### Features:
#### 1. <b>Multiple Editor Views</b> (mimic'ing HackMD)
- Supports toggling between <b>[1]</b> <b>Editor-only</b> mode, <b>[2]</b> <b>Preview-only</b> mode, and <b>[3]</b> <b>Split-view</b> mode (Editor _and_ Markdown Preview; this is the default state).
- While in Split View, there is additionally a "draggable" line that lets you dynamically resize both the Text Editor and Preview Panel (much like HackMD allows you to do).

#### 2. Markdown Support
- Live Markdown rendering in the Preview Panel (featured on the right-hand side of the screen during Split View).
- Implements Custom Markdown Parser (`parseMarkdown` logic). 

#### 3. File Upload/Download
- Option to <b>upload</b> existing `.md` files directly into the Editor (with overwrite warnings in place) and to <b>download</b> them as well.

#### 4. Real-Time Presence (w/ Socket.IO)
- Each client session connected to the Editor is tied to a Socket.IO client which communicates with the Socket.IO server for real-time interaction purposes. This set-up tracks and displays connected users via socket events (e.g., `user-joined` and `user-left` which are displayed in the (Active and Inactive) <b>Users List</b> component).

- During Real-Time Collaborative Editing, foreign clients will have custom marker nodes denoting their index position within the Text Editor, implemented with my custom `<RemoteCursorOverlay>` component embedded in Editor.jsx. (_Yes, Yjs provides its own, but I prefer mine_).

#### 5. Live Chat and Notifications per Editor Room (w/ Socket.IO)
- UI toggles for opening floating real-time <b>Chat</b> and <b>Notification</b> panels. 
- <b>Messages</b> and <b>Notifications</b> are rendered using in-app sockets and local state (for Messages, communicating with the Socket.IO server and then PostgreSQL backend; for Notifications, local state).

#### 6. Yjs Document Persistence (w/ Socket.IO & PostgreSQL)
- On initial page load (the first user to join the current Editor Room, tracked by Socket.IO), before Lexical can initialize and Yjs can sync, there will be a query sent to the PostgreSQL backend to see if there is an pre-existing document state tied to this Editor Room. If so, its content is extracted and, once Lexical and Yjs initialize and sync on start-up, a `ready-for-load` event is sent to the Socket.IO server which in-turn triggers a function loading the pre-existing state.

- Emits `save-doc` event with Yjs update on unload (persistent document state) — basically, when the last user connected to the current Editor Room disconnects (notified via Socket.IO), a save-doc event will trigger on the backend.
- Alternatively, there is a manual `Save Doc` button within the Editor page.

#### 7. Kicking & Ownership Transfer
- Logic for handling when a User is removed from an Editor Room by the owner in real-time (once kicked, a pop-up appears notifying them and they are redirected to `/dashboard`, as a Notification is broadcast Room-wide).
- Likewise, the same logic applies for Ownership Transfer (but without getting booted in real time).

## Toolbar.jsx (integral part of Editor.jsx)
This is the file that defines a fully functional and custom Toolbar that will interact with the actual <b>Lexical</b> `<contenteditable>`. It supports rich formatting (bold, italic, headers, lists, quotes), image uploads via <b>Cloudinary</b>, undo/redo, and auto-repositioning of the cursor using low-level Lexical APIs. Designed to mimic HackMD formatting behavior while preserving compatibility with real-time CRDT-based collaboration (<b>Yjs</b>).

### Tech Stack (Frontend)
- <b>Image Upload</b>: `cloudinary-core`, Cloudinary Upload Widget
- <b>Markdown Logic</b>: Custom logic aiming to mimic HackMD

### Key Features:
#### 1. <b>Markdown Shortcut Buttons</b>
- Bold `**`, Italic `*`, Strikethrough `~~`, Code Block `` ``` ``, and Link ([text]()).
#### 2. <b>Header (#) Formatting</b>
- Adds/removes leading # symbols depending on current line state
- Cycles header depth (like GitHub/HackMD) and trims if exceeding <b>######</b>
#### 3. <b>List & Quote Insertions</b>
- Quote `> `, Unordered List `* `, Numbered List `1. `, CheckList `- [ ] `
- Multi-line selection support and removes list syntax if already present.
#### 4. <b>Horizontal Line Insertion</b>
- Inserts a `---` Markdown Line + Manual Line break in the Lexical Editor.
#### 5. Undo & Redo Buttons
- Straightforward, done by wrapping Lexical's `UNDO_COMMAND` and `REDO_COMMAND`
#### 6. Cloudinary Image Upload Integration
- Uses `cloudinary-core` to:
1. Open the Cloudinary upload widget.
2. Insert the client's uploaded image as `![Image](url)` into the Lexical Editor.
3. Add a line break after insertion.
- Cloudinary API Keys are pulled from `import.meta.env` (the file will obviously not be present in this repo).
- Cloudinary uses `LexicalComposerContext` to access the editor with range-safe selection APIs.

#### 7. Cursor-Safe insertions
- A ton of work was put into manipulating the Lexical node-tree  structure to make sure that all of these Markdown Formatting insertions would maintain cursor integrity post-insertion (be repositioned correctly).
- This was largely accomplished with Lexical APIs (e.g., `$getSelection`, `$setSelection`, and `$createRangeSelection`, etc).

## Dashboard.jsx
This is the file that defines the main user interface (_the Dashboard_) for managing collaborative editing rooms (tied to the current client user). It supports room creation, joining via invite links, ownership-based permissions (leave/delete/manage), and real-time notifications via Socket.IO. I also added Twin Peaks gifs to the page for fun.

## Tech Stack (Frontend)
- <b>API Interface</b>: Custom wrapper functions from file `api.js`

### System Architecture (High-Level)
```
[Dashboard.jsx] ─────────────┐
 │                           │
 │      User Actions         ▼
 ├── createNewEdRoom() ─→ [Express API] → [PostgreSQL]
 ├── generateInvLink() ─→ [Invite Link Service]
 ├── joinRoomViaInv() ─→ [Backend Auth Check]
 ├── leaveRoom() ─→ [Socket.IO Server] (emits notification)
 └── deleteRoom() ─→ [Express API] (with auth token)
```
- Room events are emitted with Socket.IO
- Auth tokens are stored in localStorage
- Simple `react-router-dom` `useNavigate()` is used to navigate to actual Rooms.

### Key Features:
#### 1. Editor Room Management
- View all editor rooms the user has access to and their role (member/owner).
- Create new rooms (with an optional name field, otherwise identified by a UUID-based ID).
- Join rooms via invite link.
#### 2. Invite Link Generation
- Generate a unique shareable invite link for each room (with the option to copy that link to the client clipboard).
- Join rooms using those generated links.
#### 3. Role-Based Access Control.
- Room Owners can delete rooms and manage users (with an imported external component `<ManageUserSection>` which acts as a pop-up panel) where they can kick them or transfer ownership.
- Room Members are able to leave the Room at will.
#### 4. Modular API Calls
- API calls imported from the file `api.js` assist in much of the core functionality of this page e.g., `createNewEdRoom()` is what will communicate with the PostgreSQL backend and insert this new room into the database.

## Register.jsx
This is my Register.jsx component, which is a pretty rudimentary client-side-validated user registration form for the Markdown Editor site that I've created. The actual validation is just a simple email REGEX to ensure the email input is of proper form and conditions are met for the username and password. (No reCAPTCHA and so on. Duplicate emails and usernames are handled automatically with the backend server). There is animated field-level validation and reactive styling (if you left a field empty or failed to meet conditions). Designed to connect with the backend PostgreSQL API while maintaining clear transitions using React Router.

### Tech Stack (Frontend)
- <b>UX Animation</b>: `fadeInOut` CSS animation.

### System Architecture (High-Level)
```
  [User Input] → [Register.jsx]
               ↓
       [register() API call]
               ↓
         [Express Backend]
               ↓
       [PostgreSQL Users Table]
```
- Local validation occurs in-browser before submission
- On success, redirects to login view (<b>Login.jsx</b>)

### Key Features:
#### 1. User Registration Form
- Fields: `Email`, `Password`, `Username`
- On valid submission, sends a registration request to the backend API.
#### 2. Field Validation with Animated Tooltips
- Email format validation using `checkValidEmail()` (an external imported utility function that just tests the input against an email REGEX).
- Password and username must both be at least 8 characters in length.
- When a field is invalid, there will be an animated floating red error message that appears above the field (set to timeout after 2.5 seconds).

## Login.jsx
This is my Login.jsx component, which is pretty self-explanatory. It is a Login component that supports both username/email with password authentication, includes animated input-level error feedback (like Register.jsx), and uses localStorage to persist login sessions. Much like Register.jsx, there isn't too much complexity to error-checking the field inputs.

### Tech Stack (Frontend)
- <b>Persistence</b>: `localStorage` for token handling.

### System Architecture (High-Level):
```
[Login.jsx]
   ↓
[login(email/username, password)] → [Express API]
   ↓
[token] ← stored in localStorage
   ↓
[getCurrentUser(token)] → [DB] → [setUser()]
   ↓
   → navigate('/dashboard')
```
- Ensures user must be logged in before being able to access any Editor Rooms or the Dashboard page.

### The key features are more or less the same as with Register.jsx

## App.jsx
This is the control center of my full-stack collaborative editor app. This is where all the routing, session state, auth protection, and "glue logic" connecting all of the pages together is found. (Auth state, token persistence, Room ID linking, and shared API access methods are all here).

### Tech Stack (Frontend)
- <b>Authentication</b>: JWT via `localStorage`, with backend validation
- <b>Custom Routing Guards</b>: `PrivateRoute`, `PrivateRouteEditor`, `PrivateRouteMisc`
- <b>Document Persistence</b>: Document state storage functions (`saveRoomDoc`, `getRoomDoc`)
- <b>User State</b>: Centralized user data sharing across routes

### System Architecture (High-Level)
```
<App.jsx>
   ├── Handles routing & session control
   ├── Fetches and stores user auth
   ├── Passes props down to:
   │     ├── <Login> → sets user/token
   │     ├── <Register> → self-contained
   │     ├── <Dashboard> → room management
   │     └── <Editor> → doc sync + socket presence
   └── Uses PrivateRoutes for auth gating
```
## socketIOServer.js
This SocketIOServer.js file is a custom WebSocket server built on Express and Socket.IO. It powers all real-time collaboration features of the app, including multi-user room tracking, live presence updates, cursor synchronization, private messaging, and CRDT-based Yjs document persistence. It uses `lodash.throttle `to optimize frequent updates and triggers server-side autosaves when the last user leaves a room. (Also integral to kicking users in real-time).

## Tech Stack (Backend)
- <b>Framework</b>: `express`, `http`
- <b>WebSockets</b>: `socket.io`
- <b>CRDT Support</b>: `yjs`
- <b>Throttling</b>: `lodash.throttle`
- <b>CORS Config</b>

## System Architecture (High-Level)
```
Frontend App
   ↕ Socket.IO (Port 4000)
[SocketIOServer.js]
   ├─ Tracks room membership (per roomId)
   ├─ Broadcasts active user lists
   ├─ Receives/send cursor positions (throttled)
   ├─ Handles private messages + notifications
   ├─ Detects disconnections and room exits
   ├─ Triggers doc persistence to DB via saveRoomData()
```
- The Socket.IO server acts as the real-time collaboration broker for the entire system — everything from presence (and thus cursor rendering etc) to messaging to doc autosave routes through it.

## Key Features
#### 1. Real-Time Room Management (via Socket.IO)
- Users join editor sessions via `join-room(roomId, userId, username)`
- Server tracks which users are in which rooms via `connectedUsers`
- Emits active user list updates on join/leave
#### 2. Yjs Document Persistence Trigger
- Tracks which room had its document edited
- On last user leaving a room, emits `saveRoomData()` to persist doc to PostgreSQL
#### 3. Initial Document Load Gatekeeping
- First user to join a room triggers `load-existing` (based on `firstUserJoined` map)
- Prevents duplicate doc loading logic
#### 4. Real-Time Notifications
Handles three distinct types:
1. `leave-room` -> Notifies users of member departure.
2. `kick-user` -> Notifies users of kicked user.
3. `transfer-ownership` -> Notifies all room members of ownership change.
#### 5. Live Cursor Broadcasting
- Clients send cursor position via `send-cursor-pos()`
- Server stores `clientCursors` and `throttles` broadcasts using Lodash’s `throttle()` (cursor broadcasting is directly tied to the foreign cursor rendering, and so `throttle` is here to prevent UI overload)
- <b>Result</b>: Efficient rendering of foreign cursors in `RemoteCursorOverlay.jsx` (my custom foreign cursor markers)
#### 6. Private Messaging + Notifications
- Clients send `private-message` events
- Server routes them by `userId` to correct socket and emits chat + notification
#### 7. Clean Disconnection Handling
- `discLeaveHandler()` shared by both `disconnect` and `leave-room`
- On last user out:
1. Saves doc
2. Clears maps (`connectedUsers`, `firstUserJoined`, `latestEdDocs`, etc.)
3. Emits final room-wide "user left" notification

## expressServer.js
This expressServer.js file is the backend server for the application, built with Express and PostgreSQL. It manages authentication routes, securely connects to the database, and provides RESTful API endpoints for the frontend to authenticate users and manage session state. The server uses modular routing and environment variable configuration, and performs a database health check at startup.

## Tech Stack (Backend)
- <b>Framework</b>: `express`
- <b>Environment Vars</b>: `dotenv`
- <b>Database</b>: `pg` (PostgreSQL)
- <b>Cors</b>: `cors`
- <b>JSON Parsing</b>: `express.json()`
- <b>Routing</b>: Modularized via `./routes/auth.js`

## System Architecture (High-Level)
```
[Client (React)]
   ↓ HTTP Requests
[expressServer.js] ———> PostgreSQL
   ├─ /api/auth → authRoutes.js
   ├─ Parses JSON bodies
   ├─ Responds with auth/user data
   └─ Confirms DB connection on boot
```
This file exposes secure endpoints (e.g. login, register, getUser), interfaces with PostgreSQL using connection pooling, and acts as the persistent layer for session-based data.

## Key Features
#### 1. Express Server Initialization
- Uses `express()` to set up the main API server.
- Parses incoming JSON requests with `express.json()`
#### 2. CORS Configuration
- Allows frontend (_my localhost url_) to communicate with the backend.
- `credentials:true` ensures support for cookies and auth headers (if needed)
#### 3. Environment Configuration
- Loads `.env` file using dotenv for `PORT`, `DATABASE_URL`, etc.
#### 4. PostgreSQL Database Connection
- Uses `pg.Pool` for managing PostgreSQL connections
- Performs a test query `SELECT NOW()` on startup to verify connectivity
#### 5. API Routing
- Sets up `/api/auth` route to handle authentication and user-related operations
- Routes are modularized in `./routes/auth.js`
#### 6. Health Check Endpoint
- `GET /` returns "Backend is running." (useful for quick health checks or frontend fetch test).
#### 7. Server Bootstrapping
- Listens on `PORT` (default `5000` is what I set) and logs successful startup

## Frontend Highlights
### Lexical Editor Integration
- Using the Lexical framework, my editor is customized for CRDT collaboration and augmented with plugins for Markdown support and toolbar controls. It interfaces tightly with Yjs and custom Socket.IO layers.
### Real-Time Cursors & Messaging:
- Remote user cursors are rendered live using a throttled `send-cursor-pos` mechanism and layered with Socket.IO broadcast logic (this information is received and used by `<RemoteCursorOverlay>` within the Editor).
- Chat functionality is user-specific and persistent, appearing in a collapsible interface within the Editor view.
### Pre-bootstrap Document State:
- Before Lexical mounts, the app queries the backend for previously saved document state. If found, it is loaded into memory and the editor state is set once Yjs and Lexical sync together.
### Transient Notifications:
- Live Socket.IO notifications inform the user of joins, leaves, kicks, and DMs, using animated visual indicators rather than primitive alerts.
### UI State Management Without Redux:
- Localized state (e.g. modal toggles, notification bars, users list, room roles) is efficiently managed using scoped `useState`/`useRef` logic and lifted states where necessary.
- `hasJoinedRef` prevents React 18 Strict Mode from causing double-mount issues during editor initialization.

## Backend Highlights
### Socket.IO Server Logic
- Manages user presence, cross-room communication, and live updates of active users, remote cursors, and private messages.
- Uses `map` objects to manage:
1. First user detection (for loading docs)
2. Latest Editor document states
3. Active socket-room-user mappings
### Document State Serialization + PostgreSQL:
- Upon disconnect (and room emptying), the backend serializes the CRDT state and persists it to the ydocs table.
- On reconnect, this state is loaded on the frontend once Yjs and Lexical sync together.
### Invite Link & Role System:
- Backend generates expiring `UUID` invite links linked to `invite_links` table.
- `user_rooms` table joins users and rooms while enforcing role-based logic (e.g., `king` vs. `member` privileges).
### Resilient Express API Routing:
- Robust error handling across routes (`/api/auth`, `/api/rooms`, `/api/ydocs`) with JWT validation middleware.
### PostgreSQL Schema Design:
- Includes normalized relational tables for users, rooms, document content (ydocs), invite links, and private messages.
- Cascading deletes and foreign key constraints help enforce relational integrity.
