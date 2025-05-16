// Dashboard for the Editing Sessions goes here (+ other customization like "Join Room") -- home page if logged in.
//<h1>DASHBOARD GOES HERE!!!</h1>

import React, {useRef} from "react";
import { useNavigate } from "react-router-dom";

import {v4 as uuidv4} from 'uuid'; // For creating new Editor Rooms.
/* NOTE:
- I should be safe using uuidv4(); to generate Room IDs because the probability of duplication is astronomically low
AND since it's my primary key in the database anyways, PostgreSQL will automatically reject duplicates for me. */




/* 

DON'T FORGET: Solve this stupid problem: 
"Uncaught SyntaxError: The requested module '/src/components/pages/Register.jsx?t=1747099488268' does not provide an export named 'default' (at App.jsx:5:8)"
^ HAS SOMETHING TO DO WITH CACHING -- TOO TIRED TO FIGURE IT OUT TONIGHT.

*/



function Dashboard({ logout }) {
    const newEdRoomNameRef = useRef(null);




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
                {/* DEBUG: For now, I am doing extremely minimal styling <here styleName={}></here> */}
                <form onSubmit={ async (e) => {
                    e.preventDefault();

                    console.log("1.DEBUG: The value of uuidv4() => [", uuidv4(), "]");
                    console.log("2.DEBUG: The value of uuidv4() => [", uuidv4(), "]");
                    console.log("3.DEBUG: The value of uuidv4() => [", uuidv4(), "]");
                    console.log("4.debug: The value of newEdRoomNameRef.current.value => [", newEdRoomNameRef.current.value, "]");
                    const edRoomName = newEdRoomNameRef.current.value;

                    const result = await createNewEdRoom({ edRoomName })
                    if(result.error) {
                        console.error("DEBUG: CREATE NEW EDITOR ROOM FAILED! => ", result.error);
                    } else {
                        console.log("DEBUG: CREATE NEW EDITOR ROOM SUCCESSFUL!");
                        alert("DEBUG: NEW ROOM CREATED -- CHECK IN POSTGRESQL TO MAKE SURE IT'S THERE!!!");
                    }

                }}>
                    <div style={{width:"100%"}}>
                        Give room a name (optional).
                        <input id="createEdRoomName" type="text" ref={newEdRoomNameRef} style={{width:"100%"}}></input>
                    </div>
                    <button>CLICK TO CREATE ROOM</button>
                </form>



            </div>


        </div>
    );
}

export default Dashboard;