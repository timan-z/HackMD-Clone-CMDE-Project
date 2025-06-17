import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser, getRoomUsers, saveRoomDoc, getRoomDoc } from "./utility/api.js"
// The four main webpages of the application (in order of appearance):
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./pages/Editor.jsx";
// For preventing unauthroized access to certain pages (security stuff):
import PrivateRoute from "./core-features/PrivateRoute.jsx";
import PrivateRouteMisc from "./core-features/PrivateRouteMisc.jsx";
import PrivateRouteEditor from "./core-features/PrivateRouteEditor.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [roomId, setRoomID] = useState(null);
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);

  // Function for handling logging-out (will be passed to routes):
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setToken(null);
    setUser(null);
  };

  // Function for handling joining a unique editor room (in the sense of passing its ID here so we can map it to the right Yjs document):
  const handleRoomJoin = (roomId) => {
    setRoomID(roomId);
  };

  // Function for sending Editor document data to the PostgreSQL server:
  const saveRoomData = async(roomId, docData) => {
    if(token) {
      try {
        await saveRoomDoc(roomId, docData, token);
      } catch(err) {
        console.error(`ERROR: Failed to save Editor document data for Room ID:(${roomId}) to the PostgreSQL backend.`);
      }
    }
  }

  // Function for retrieving Editor document data from the PostgreSQL server:
  const getRoomData = async(roomId) => {
    if(token) {
      try {
        const result = await getRoomDoc(roomId, token);
        return result;
      } catch(err) {
        console.error(`ERROR: Failed to retrieve Editor document data for Room ID:(${roomId}) from the PostgreSQL backend.`);
      }
    }
    return null;
  }

  // Function for handling user data extraction (it will be invoked whenever "token" data is set via useEffect...):
  const loadUser = async () => {
    if(token) {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
        localStorage.setItem("userData", JSON.stringify(userData));
        setUsername(userData.username);
        setUserId(userData.id);
      } catch(err) {
        console.error("ERROR: Failed to retrieve current user data => ", err);
      }
    }
  }
  useEffect(() => {
    const savedUser = localStorage.getItem("userData");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      loadUser();
    }
  }, [token]);
  
  // Function for handling retrieval of all Users associated with a particular Room:
  const loadRoomUsers = async(roomId) => {
    if(token) {
      try {
        const usersData = await getRoomUsers(roomId, token);
        return usersData;
      } catch(err) {
        console.error("ERROR: Failed to retrieve users associated with room ID:[", roomId, "] => ", err);
      }
    }
  }

  return (
    <Router>
      <Routes>
        {/* BELOW ARE THE PUBLIC ROUTES (PAGES) -- THOSE THAT DO NOT NEED AUTHROIZATION TO ACCESS: */}

        {/* Default home-page (will switch between /Login and /Dashboard depending on if the user is logged in or not): */}
        <Route path="/" element={<Navigate to="/Login" replace/>} />
        {/* 1. Login and Authenticate Page. (Homepage if **not** logged in): */}
        <Route path="/login" element={localStorage.getItem("token") ? <Navigate to="/dashboard" replace/> : <Login setUser={setUser} setToken={setToken} />} /> {/* Need setUser={...} etc so I can set the App.jsx state variables from within Login.jsx. */}
        {/* 2. Registration Page: */}
        <Route path="/register" element={<Register />} />

        {/* BELOW ARE THE PROTECTED ROUTES (PAGES) -- NEED AUTHORIZATION TO ACCESS THEM!: */}
        
        {/* 3. Editing Session Dashboard Page. (Homepage **if** logged in): */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard loadUser={loadUser} loadRoomUsers={loadRoomUsers} logout={handleLogout} sendRoomID={handleRoomJoin} userData={user} setUser={setUser} /></PrivateRoute>} />
        {/* 4. Editing Session. (Actual collaborative editor webpage, my Editor.jsx file): */}
        <Route path="/editor/:roomId" element={<PrivateRouteEditor token={token} roomId={roomId}><Editor loadUser={loadUser} loadRoomUsers={loadRoomUsers} userData={user} setUser={setUser} username={username} userId={userId} roomId={roomId} saveRoomData={saveRoomData} getRoomData={getRoomData} /></PrivateRouteEditor>} /> {/* <-- DEBUG: For now, when just developing, I can type whatever for the ":roomId" stuff, it's just a placeholder... */}

        {/* Below ensures any undefined URL routes just re-map to the Dashboard page or Login page (depending on logged-in status). */}
        <Route path="*" element={<PrivateRouteMisc><Login /></PrivateRouteMisc>} />
      </Routes>
    </Router>
  );
}

export default App
