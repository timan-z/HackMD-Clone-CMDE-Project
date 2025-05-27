// Dashboard for the Editing Sessions goes here (+ other customization like "Join Room") -- home page if logged in.
//<h1>DASHBOARD GOES HERE!!!</h1>

import React, {useEffect, useState, useRef} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { createNewEdRoom, getAllRooms, checkRoomAccess, generateInvLink, joinRoomViaInv, leaveRoom, deleteRoom } from "../utility/api.js";

import {v4 as uuidv4} from 'uuid'; // For creating new Editor Rooms.
import { set } from "lodash";
import { io } from "socket.io-client";
import ManageUsersSection from "../misc-features/ManageUsersSection.jsx";
const socket = io("http://localhost:4000");

function Dashboard({ userData, logout, sendRoomID, loadUser, loadRoomUsers, setUser }) {
    const joinEdRoomLink = useRef(null);
    const newEdRoomNameRef = useRef(null);
    const [invLink, setInvLink] = useState("");
    const [rooms, setRooms] = useState([]);

    const [showManageUsers, setShowManageUsers] = useState(false);
    const [roomMembers, setRoomMembers] = useState([]); // Related to showManageUsers state var (gets the members of the Room you click "Manage Users" on).
    
    



    const navigate = useNavigate();
    
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // 1. useEffect that'll run on mount and double-check that userData is valid:
    // NOTE: (Adding this well after writing most of the code for the page -- don't need to do the same with roomId since it's obtained directly elsewhere). 
    useEffect(() => {
        if(!userData) {
            const storedUser = localStorage.getItem("userData");
            if(storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } else {
                loadUser();
            }
        }
    }, []);


    // 2. useEffect that'll run on mount for loading in the Editor Rooms this User has access to:
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
        // Notify the Socket.IO server of this new join:
        socket.emit("notification", {
            type:"join",
            roomId: roomId,
            userId: userData.id,
            username: userData.username,
            message: `${userData.username} has joined the room!`,
            timestamp: Date.now(),
        });
        
        navigate(`/editor/${roomId}`);
    }

    // To leave a room:
    const handleLeave = async(roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;
        try {
            const data = await leaveRoom(roomId, token);
            // Notify the Socket.IO server of this leave:
            socket.emit("notification", {
                type:"leave",
                roomId: roomId,
                userId: userData.id,
                username: userData.username,
                message: `${userData.username} has left the room!`,
                timestamp: Date.now(),
            });

            navigate('/dashboard');
        } catch (err) {
            console.error("DEBUG: Error in attempting to leave the Editor Room ID: ", roomId);
        }
    }

    // To delete a room:
    const handleDelete = async(roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;

        try {
            const data = await deleteRoom(roomId, token);
            if(data.success) {
                console.log("DEBUG: ROOM SUCCESSFULLY DELETED! => ", data);
            } else {
                console.log("DEBUG: ROOM NOT DELETED! => ", data);
            }
            navigate('/dashboard');
        } catch (err) {
            console.error("DEBUG: Error in attempting to delete the Editor Room ID: ", roomId);
        }
    }
    // NOTE:+DEBUG: Don't forget -- when a room is deleted, I get rid of all server records related to it...

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

    // Function for retrieving the members associated with a Editor Room:
    const callLoadUserRooms = async(roomId) => {
        const usersData = await loadRoomUsers(roomId);

        const tweakedArr = usersData.map(user => ({
            userId: user.user_id,
            username: user.username,
        }));
        setRoomMembers(tweakedArr);
    };

    // Function for handling the "Manage Users" button:
    const handleManageUsers = (roomId) => {
        setShowManageUsers(prev => !prev);

        /* It takes a full re-render cycle for the state variable value to actually change so if the "Show Managers" section is to 
        now appear -- the value of "showManageUsers" will actually be false for the remainder of this function execution... */
        if(!showManageUsers) {
            callLoadUserRooms(roomId);  // ...and that's the condition that must be met for callLoadUserRooms().
        }
    };

    /* State variable "roomMembers" is filled for every time the "Manage Users" button is interacted with for a particular room.
    Since its value is tied to a specific interaction, its value will be regularly cleared by this UseEffect hook: */
    useEffect(() => {
        let manageUsersCheck = document.getElementById("manage-users-sect");
        if(!showManageUsers && manageUsersCheck === null) {
            setRoomMembers([]);
        }
    }, [showManageUsers]);







    
    const debugFunction = () => {

        console.log("The value of userData => [", userData, "]");

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

                        try {
                            const data = await joinRoomViaInv(token, edRoomLink);
                            console.log("DEBUG: The value of data => [", data, "]");
                            if(data.success) {
                                // refresh page? (May not be needed).
                                navigate("/dashboard");
                            } else {
                                alert("Seems to be an expired link or you might already be in the room.");
                            }
                        } catch (err) {
                            console.error("Failed to join Editor Room via invite -- probably invalid link or something.");
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
                            <button onClick={()=>handleLeave(room.room_id)}>
                                LEAVE ROOM
                            </button>

                            {/* Want a button here that lets you DELETE the room. */}
                            <button onClick={()=>handleDelete(room.room_id)}>
                                DELETE ROOM
                            </button>






                            {/* Want a button here that lets you manage users: */}
                            <button onClick={()=>handleManageUsers(room.room_id)}>
                                MANAGE USERS
                            </button>

                            {/* Code to have the Manage Users component appear: */}
                            {showManageUsers && (
                                <ManageUsersSection currentUserId={userData.id} roomName={room.room_name} roomMembers={roomMembers} onClose={()=>setShowManageUsers(prev => !prev)} />
                            )}







                            {/* DEBUG: */}
                            <button onClick={()=> debugFunction()}>
                                DEBUG!
                            </button>

                            {/* DEBUG:+NOTE: Maybe you only get the "leave" button if you're non-owner. Only get "delete" if you're the owner. */}
                            {/* ^ I can have them still be there but grayed out when I attempt to click them! with hover text that says "You the owner!" */}

                        </div>
                    )
                })}
            </div>
            {/* EVERYTHING ABOVE IS WHERE THE "ROOM LOADING" STATIC CODE IS -- REMEMBER THAT FOR LATER WHEN REORGANIZING!!! */}

        </div>
    );
}

export default Dashboard;
