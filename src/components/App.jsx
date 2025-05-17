import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentUser } from "./utility/api.js" // Determines site home page (depending on if the user is logged in or not).
// The three main webpages of the application (in order of appearance):
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./pages/Editor.jsx";

// NOTE-TO-SELF: This "App" function serves as our root.
function App() {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));  // Token signifying current user will be stored in localStorage.


  // Function for handling logging-out (will be passed to routes):
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };


  useEffect(() => {
    const loadUser = async () => {

      if(token) {
        const userData = await getCurrentUser(token);
        setUser(userData);
      }
    };
    loadUser();

  }, [token]);

  
  return (
    <Router>
      <Routes>
        {/* Default home-page (DEBUG:+NOTE: will switch between /Login and /Dashboard depending on if the user is logged in or not). */}
        <Route path="/" element={<Navigate to="/Login" replace/>} />

        {/* 1. Login and Authenticate Page. (Homepage if **not** logged in): */}
        <Route path="/login" element={<Login setUser={setUser} setToken={setToken} />} /> {/* Need setUser={...} etc so I can set the App.jsx state variables from within Login.jsx. */}
        
        {/* 2. Registration Page. */}
        <Route path="/register" element={<Register />} />

        {/* 3. Editing Session Dashboard Page. (Homepage **if** logged in): */}
        <Route path="/dashboard" element={<Dashboard logout={handleLogout} />} />

        {/* 4. Editing Session. (Actual collaborative editor webpage, my Editor.jsx file): */}
        <Route path="/editor/:roomId" element={<Editor />}/> {/* <-- DEBUG: For now, when just developing, I can type whatever for the ":roomId" stuff, it's just a placeholder... */}

      </Routes>
    </Router>
  );
}

export default App
