// Frontend API utilities (for handling API requests sent from the frontend -- basically my Postman tests through JS):

const API_BASE = "http://localhost:5000/api"; // Backend express server.

// 1. USER-RELATED UTILITIES:
// 1.1. Register:
export const register = async (userData) => {
    const result = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });
    return await result.json();
};

// 1.2. Login:
export const login = async (credentials) => {
    const result = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
    return await result.json();
};

// 1.3. Get Current User.
export const getCurrentUser = async (token) => {
    const result = await fetch(`${API_BASE}/auth/me`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
    });
    return await result.json();
};

// 2. MULTI-USER SESSION MANAGEMENT:
// 2.1. Create new Collaborative Editor Session.
export const createNewEdRoom = async (edRoomName, token) => {
    const result = await fetch(`${API_BASE}/auth/create-room`, {
        method: "POST",
        headers: { 
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,   // Need this to map user-to-room (creation).
        },
        body: JSON.stringify({ edRoomName }),
    });
    return await result.json();
};

// 2.2. Retrieve Editor Rooms associated with Logged-In User (to load into Dashboard):
export const getAllRooms = async(token) => {
    const result = await fetch(`${API_BASE}/auth/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return await result.json();
};

// 2.3. Check to see if a Logged-In User has access to a particular Editor Room:
export const checkRoomAccess = async(roomId, token) => {
    const result = await fetch(`${API_BASE}/auth/rooms/${roomId}/access`, {
       headers: {
        Authorization: `Bearer ${token}`,
       },
    });
    if(!result.ok) throw new Error("Editor Room access check failed.");
    return result.json();   // Returns { access: true/false }
};

// 2.4. For generating invite links:
export const generateInvLink = async(roomId, token, expiresInMinutes = 60) => {

    console.log("DEBUG: Function generateInvLink is entered at the very least...");

    const result = await fetch(`${API_BASE}/auth/rooms/${roomId}/invite`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expiresInMinutes })
    });
    return result.json(); // Returns { inviteURL: {the_url} }
};




// 2.5. For using invite links:
export const joinRoomViaInv = async(token, inviteId) => {

    console.log("DEBUG: I'm in side the joinRoomViaInv function...");

    const result = await fetch(`${API_BASE}/auth/invite/${inviteId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
    return result.json(); 
};
