// Dashboard for the Editing Sessions goes here (+ other customization like "Join Room") -- home page if logged in.
//<h1>DASHBOARD GOES HERE!!!</h1>

import React, {useEffect, useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import { createNewEdRoom } from "../utility/api.js";
import { getAllRooms } from "../utility/api.js";

import {v4 as uuidv4} from 'uuid'; // For creating new Editor Rooms.
import { set } from "lodash";
/* NOTE:
- I should be safe using uuidv4(); to generate Room IDs because the probability of duplication is astronomically low
AND since it's my primary key in the database anyways, PostgreSQL will automatically reject duplicates for me. 
*/




/* 

DON'T FORGET: Solve this stupid problem: 
"Uncaught SyntaxError: The requested module '/src/components/pages/Register.jsx?t=1747099488268' does not provide an export named 'default' (at App.jsx:5:8)"
^ HAS SOMETHING TO DO WITH CACHING -- TOO TIRED TO FIGURE IT OUT TONIGHT.

*/



function Dashboard({ logout, sendRoomID }) {

    const newEdRoomNameRef = useRef(null);
    const [rooms, setRooms] = useState([]);
    
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {

        console.log("ROOMS-DEBUG: UseEffect HOOK ENTERED!!!");

        const fetchRooms = async() => {

            console.log("ROOMS-DEBUG: fetchRooms IS ENTERED!!!");

            const token = localStorage.getItem("token");
            
            console.log("ROOMS-DEBUG: token RETURNS => [", token, "]");
            
            if(!token) return;

            try {

                console.log("Rooms-Debug: Trying getAllRooms!!!");


                const data = await getAllRooms(token);

                console.log("Rooms-Debug RAN and the value of data => [", data, "]");

                setRooms(data);
            } catch (err) {
                console.error("DEBUG: was not able to fetch rooms oh no!: ", err);
            }
        };

        fetchRooms();
    }, []);

    // To join a new room from the area I'll be loading them:
    const handleJoin = (roomID) => {    
        sendRoomID(roomID);


        // wrote a bunch of code for restricting Editor Room access making it only accessible if authroized.




        navigate(`/editor/${roomID}`);
    }

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
                    const edRoomName = newEdRoomNameRef.current.value;
                    const token = localStorage.getItem("token");
                    console.log("DEBUG: THE VALUE OF token => [", token, "]");
                    const data = await createNewEdRoom(edRoomName, token);
                    console.log("debug: dah value of data => [", data, "]");
                }}>
                    <div style={{width:"100%"}}>
                        Give room a name (optional).
                        <input id="createEdRoomName" type="text" ref={newEdRoomNameRef} style={{width:"100%"}}></input>
                    </div>
                    <button>CLICK TO CREATE ROOM</button>
                </form>
            </div>
            

            <h4>LOAD ROOMS HERE:</h4>


            <div style={{borderStyle:"solid", borderColor:"purple"}}>
                {rooms.map((room) => {

                    console.log("AHHHHHHHHHHHHHHHHHHH");
                    return(


                        <div key={room.user_room_id} style={{borderStyle:"solid"}}>
                            <div>
                                <p>{room.room_name}</p>
                                <p>ID: {room.room_id} </p>
                                <p>Role: {room.role}</p>
                            </div>
                            <button
                                onClick={()=> handleJoin(room.room_id)}
                            >
                                JOIN ROOM
                            </button>
                        </div>



                    )
                })}
            </div>
        </div>
    );
}

export default Dashboard;
