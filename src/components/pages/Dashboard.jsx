// Dashboard for the Editing Sessions goes here (+ other customization like "Join Room") -- home page if logged in.
//<h1>DASHBOARD GOES HERE!!!</h1>

import React from "react";
import { useNavigate } from "react-router-dom";

/* 

DON'T FORGET: Solve this stupid problem: 
"Uncaught SyntaxError: The requested module '/src/components/pages/Register.jsx?t=1747099488268' does not provide an export named 'default' (at App.jsx:5:8)"
^ HAS SOMETHING TO DO WITH CACHING -- TOO TIRED TO FIGURE IT OUT TONIGHT.

*/



function Dashboard({ logout }) {

    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return(
        <div>
            <h1>DASHBOARD GOES HERE!!!</h1>

            <button onClick={handleLogout} >LOG OUT</button>


            {/* Want a button that goes here for creating a new room... */}
            
            
            <div style={{borderStyle:"solid", borderColor:"red", display:"flex", flexDirection:"column",width:"300px",height:"150px"}}>
                <h4>DEBUG: CREATE ROOM BUTTON</h4>    





                {/* This form will connect t othe authController.js or whatever and invoke the Create Table command (more or less): */}
                <form onSubmit={ async (e) => {
                    

                }}>

                    <div style={{width:"100%"}}>
                        Give room a name (optional).
                        <input type="text" style={{width:"100%"}}></input>
                    </div>
                    <button>CLICK TO CREATE ROOM</button>
                </form>



            </div>

        </div>
    );
}

export default Dashboard;