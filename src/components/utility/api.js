// Frontend API utilities (for handling API requests sent from the frontend -- basically my Postman tests through JS):

const API_BASE = "http://localhost:5000/api"; // Backend express server.

// 1. Register:
export const register = async (userData) => {
    const result = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
    });
    return await result.json();
};

// 2. Login:
export const login = async (credentials) => {
    const result = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
    return await result.json();
};

// 3. Get Current User.
export const getCurrentUser = async (token) => {
    const result = await fetch(`${API_BASE}/auth/me`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
    });
    return await result.json();
};
