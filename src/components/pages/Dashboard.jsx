// Dashboard for the Editing Sessions goes here (+ other customization like "Join Room") -- home page if logged in.
//<h1>DASHBOARD GOES HERE!!!</h1>

import React, {useEffect, useState, useRef} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { createNewEdRoom, getAllRooms, checkRoomAccess, generateInvLink, joinRoomViaInv } from "../utility/api.js";

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
    const joinEdRoomLink = useRef(null);
    const newEdRoomNameRef = useRef(null);
    const [invLink, setInvLink] = useState("");
    const [rooms, setRooms] = useState([]);
    
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        const fetchRooms = async() => {
            const token = localStorage.getItem("token");
            if(!token) return;

            try {
                const data = await getAllRooms(token);
                setRooms(data);
            } catch (err) {
                console.error("DEBUG: was not able to fetch rooms oh no!: ", err);
            }
        };

        fetchRooms();
    }, []);

    // To join a new room from the area I'll be loading them:
    const handleJoin = async(roomId) => {    
        sendRoomID(roomId);        
        navigate(`/editor/${roomId}`);
    }

    // Function for handling generate link invites:
    const generateInvite = async(roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;
        try {
            const data = await generateInvLink(roomId, token);
            setInvLink(data.inviteURL);
            // FOR NOW...
        } catch (err) {
            console.error("DEBUG: Error in attempting to generate invite links...");
        }
    };

    return(
        <div>
            <h1>DASHBOARD GOES HERE!!!</h1>

            <button onClick={handleLogout} >LOG OUT</button>

            <div style={{display:"flex", gap:"25px"}}>

                {/* Want a button that goes here for CREATING a new room... */}
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

                {/* Want a button here and a form with it for JOINING a new room... */}
                <div style={{borderStyle:"solid", borderColor:"blue", display:"flex", flexDirection:"column",width:"300px",height:"150px"}}>
                    Here's where I'll have the stuff for JOINING a new room.

                    {/* The form for calling the right functions for joining a new room: */}
                    <form onSubmit={ async(e) => {
                        e.preventDefault();
                        const token = localStorage.getItem("token");
                        const edRoomLink = joinEdRoomLink.current.value;


                        console.log("DEBUG: join join join join join join -- 1");


                        const data = await joinRoomViaInv(token, edRoomLink);


                        console.log("DEBUG: join join join join join join -- 2");


                        console.log("DEBUG: The value of data => [", data, "]");

                        if(data.success) {
                            // refresh page? (May not be needed).
                            navigate("/dashboard");
                        } else {
                            alert("Seems to be an expired link.");
                        }
                    }}>
                        <button>JOIN NEW ROOM</button>
                        <input id="join-room-link" ref={joinEdRoomLink} type="text"/>
                    </form>

                </div>

            </div>










            {/* EVERYTHING BELOW IS WHERE THE "ROOM LOADING" STATIC CODE IS -- REMEMBER THAT FOR LATER WHEN REORGANIZING!!! */}
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
                            
                            {/* JOIN ROOM BUTTON: */}
                            <button onClick={()=> handleJoin(room.room_id)} >
                                JOIN ROOM
                            </button>

                            {/* GENERATE INVITE LINK BUTTON: */}
                            <div style={{display:"flex", flexDirection:"row", alignItems:"center"}}>
                                <button onClick={()=> generateInvite(room.room_id)}>GET INVITE</button>
                                {/* DEBUG: I want some text that goes "Your Inv Link:"[ Rect where text is dynamically allocated ] */}
                                Your Invite Link: <p style={{ borderStyle:"solid", height:"20px", width:"500px" }}>{invLink}</p>
                                {/* NOTE:+DEBUG: ^ this is what I have **FOR NOW** Think it'd be better to have a pop-up afterwards... */}
                                <button onClick={()=> navigator.clipboard.writeText(invLink) }>COPY LINK</button>
                                {/* NOTE:+DEBUG: For now, let's just make this <button> copy the state variable value to the clipboard.
                                When I polish the site a little more... I can have like the same thing, but when you close the pop-up,
                                then the state variable will reset back to "" empty.*/}
                            </div>

                            {/* Want a button here that lets you LEAVE the room. */}
                            

                            {/* Want a button here that lets you DELETE the room. */}

                            {/* DEBUG:+NOTE: Maybe you only get the "leave" button if you're non-owner. Only get "delete" if you're the owner. */}

                        </div>
                    )
                })}
            </div>
            {/* EVERYTHING ABOVE IS WHERE THE "ROOM LOADING" STATIC CODE IS -- REMEMBER THAT FOR LATER WHEN REORGANIZING!!! */}

        </div>
    );
}

export default Dashboard;
