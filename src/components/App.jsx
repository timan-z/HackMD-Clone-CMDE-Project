import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser, getRoomUsers } from "./utility/api.js" // Determines site home page (depending on if the user is logged in or not).
// The three main webpages of the application (in order of appearance):
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./pages/Editor.jsx";
import PrivateRoute from "./core-features/PrivateRoute.jsx"; // For preventing unauthorized access to certain pages...
import PrivateRouteMisc from "./core-features/PrivateRouteMisc.jsx"; // ^ More of the same but for more minor purposes.
import PrivateRouteEditor from "./core-features/PrivateRouteEditor.jsx";

// NOTE-TO-SELF: This "App" function serves as our root.
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));  // Token signifying current user will be stored in localStorage.
  const [roomId, setRoomID] = useState(null);


  // test:
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);


  // Function for handling logging-out (will be passed to routes):
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Function for handling joining a unique editor room (in the sense of passing its ID here so we can map it to the right Yjs document):
  const handleRoomJoin = (roomId) => {

    console.log("DEBUG: RAAAAAAAAAAAAAAAAAAAHHH!!!");
    console.log("Debug: The value of roomId => [", roomId, "]");

    setRoomID(roomId);
  };





  // Function for handling user data extraction (it will be invoked whenever "token" data is set via useEffect...):
  const loadUser = async () => {
    if(token) {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
        setUsername(userData.username);
        setUserId(userData.id);
      } catch(err) {
        console.error("ERROR: Failed to retrieve current user data => ", err);
      }
    }
  }
  useEffect(() => {
    loadUser();
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

        {/* Default home-page (DEBUG:+NOTE: will switch between /Login and /Dashboard depending on if the user is logged in or not). */}
        <Route path="/" element={<Navigate to="/Login" replace/>} />
        {/* 1. Login and Authenticate Page. (Homepage if **not** logged in): */}
        <Route path="/login" element={localStorage.getItem("token") ? <Navigate to="/dashboard" replace/> : <Login setUser={setUser} setToken={setToken} />} /> {/* Need setUser={...} etc so I can set the App.jsx state variables from within Login.jsx. */}
        {/* 2. Registration Page. */}
        <Route path="/register" element={<Register />} />

        {/* BELOW ARE THE PROTECTED ROUTES (PAGES) -- NEED AUTHORIZATION TO ACCESS THEM!: */}
        
        {/* 3. Editing Session Dashboard Page. (Homepage **if** logged in): */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard logout={handleLogout} sendRoomID={handleRoomJoin} /></PrivateRoute>} />

        {/* 4. Editing Session. (Actual collaborative editor webpage, my Editor.jsx file): */}
        <Route path="/editor/:roomId" element={<PrivateRouteEditor roomId={roomId}><Editor loadUser={loadUser} loadRoomUsers={loadRoomUsers} userData={user} userName={username} userId={userId} roomId={roomId} /></PrivateRouteEditor>} /> {/* <-- DEBUG: For now, when just developing, I can type whatever for the ":roomId" stuff, it's just a placeholder... */}

        {/* TO-DO: Want to make it so that if the user is logged in, 
        - any un-defined URL routes just re-map to the Dashboard page.
        If they are NOT logged in,
        - any un-defined URL routes just re-map to the Login page. */}
        <Route path="*" element={<PrivateRouteMisc><Login /></PrivateRouteMisc>} />

      </Routes>
    </Router>
  );
}

export default App
