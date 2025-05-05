import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// The three main webpages of the application (in order of appearance):
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./pages/Editor.jsx";

// NOTE-TO-SELF: This "App" function serves as our root.
function App() {
  return (
    <Router>
      <Routes>
        {/* Default home-page (DEBUG:+NOTE: will switch between /Login and /Dashboard depending on if the user is logged in or not). */}
        <Route path="/" element={<Navigate to="/Login" replace/>} />

        {/* 1. Login and Authenticate Page. (Homepage if **not** logged in): */}
        <Route path="/login" element={<Login />} />
        
        {/* 2. Editing Session Dashboard Page. (Homepage **if** logged in): */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 3. Editing Session. (Actual collaborative editor webpage, my Editor.jsx file): */}
        <Route path="/editor/:roomId" element={<Editor />}/> {/* <-- DEBUG: For now, when just developing, I can type whatever for the ":roomId" stuff, it's just a placeholder... */}

      </Routes>
    </Router>
  );
}

export default App
