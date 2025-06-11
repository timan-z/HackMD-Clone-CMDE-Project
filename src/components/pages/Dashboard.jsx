import {useEffect, useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import { createNewEdRoom, getAllRooms, generateInvLink, joinRoomViaInv, leaveRoom, deleteRoom } from "../utility/api.js";
import { io } from "socket.io-client";
import ManageUsersSection from "../misc-features/ManageUsersSection.jsx";
const socket = io("http://localhost:4000");

function Dashboard({ userData, logout, sendRoomID, loadUser, loadRoomUsers, setUser }) {
    const joinEdRoomLink = useRef(null);
    const newEdRoomNameRef = useRef(null);
    const [invLinks, setInvLinks] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [activeManageUsersRoomId, setActiveManageUsersRoomId] = useState(null);
    const [roomMembers, setRoomMembers] = useState([]);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleJoin = async(roomId) => {
        sendRoomID(roomId);
        // No need to emit any join notifications; I do this in my Editor.jsx file.
        navigate(`/editor/${roomId}`);
    }

    // To leave a room (as in resigning access) :
    const handleLeave = async(roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;
        try {
            await leaveRoom(roomId, token);

            // Send an emit to the Socket.IO server indicating resignation of access:
            socket.emit("notification", {
                type:"leave-room",
                roomId: roomId,
                userId: userData.id,
                username: userData.username,
                message: `${userData.username} ID:(${userData.id}) has LEFT this Editor Room!`,
                timestamp: Date.now(),
            });

            navigate('/dashboard');
        } catch (err) {
            console.error(`ERROR: Error in attempting to leave the Editor Room ID:(${roomId}) because: ${err}`);
        }
    }

    const handleDelete = async(roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;

        try {
            await deleteRoom(roomId, token);
            navigate('/dashboard');
        } catch (err) {
            console.error(`ERROR: Error in attempting to delete the Editor Room ID:(${roomId}) because: ${err}`);
        }
    }

    const generateInvite = async(roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;
        try {
            const data = await generateInvLink(roomId, token);
            setInvLinks(prev => ({...prev, [roomId]: data.inviteURL}));
        } catch (err) {
            console.error(`ERROR: Error in attempting to generate an invite link for Room ID:(${roomId}) because: ${err}`);
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
        if(activeManageUsersRoomId === roomId) {
            // Clicking the same room will toggle the panel to close:
            setActiveManageUsersRoomId(null);
            setRoomMembers([]); // Clean the room members array.
        } else {
            // Opening a new "Manage Users" panel:
            setActiveManageUsersRoomId(roomId);
            callLoadUserRooms(roomId);
        }
    };

    // 1. useEffect that'll run on mount and double-check that userData is valid:
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
                console.error(`ERROR: Was not able to fetch the Editor Rooms associated with the client user: ${err}`);
            }
        };
        fetchRooms();
    }, []);

    return(
        <div>
            <h1>DASHBOARD</h1>

            <button onClick={handleLogout} >LOG OUT</button>

            <div style={{display:"flex", gap:"25px"}}>

                {/* Want a button that goes here for CREATING a new room... */}
                <div style={{borderStyle:"solid", borderColor:"red", display:"flex", flexDirection:"column",width:"300px",height:"150px"}}>
                    <h4>DEBUG: CREATE ROOM BUTTON</h4>    

                    <form onSubmit={ async (e) => {
                        e.preventDefault();
                        const edRoomName = newEdRoomNameRef.current.value;
                        const token = localStorage.getItem("token");
                        await createNewEdRoom(edRoomName, token);
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
                                navigate("/dashboard");
                            } else {
                                alert("Seems to be an expired link or you might already be in the room.");
                            }
                        } catch (err) {
                            console.error(`ERROR: Failed to join Editor Room via invite. The reason: ${err}`);
                        }
                    }}>
                        <button>JOIN NEW ROOM</button>
                        <input id="join-room-link" ref={joinEdRoomLink} type="text"/>
                    </form>
                </div>
            </div>

            {/* EVERYTHING BELOW IS WHERE THE "ROOM LOADING" STATIC CODE IS -- REMEMBER THAT FOR LATER WHEN REORGANIZING!!! */}
            <h4>YOUR EDITOR ROOMS:</h4>
            <div style={{borderStyle:"solid", borderColor:"purple"}}>
                {rooms.map((room) => {
                    return(
                        <div key={room.user_room_id} style={{borderStyle:"solid"}}>
                            <div>
                                <p>{room.room_name}</p>
                                <p>ID: {room.room_id} </p>
                                <p>Role: {room.role}</p>
                            </div>
                            
                            {/* Join Room Button: */}
                            <button onClick={()=> handleJoin(room.room_id)} >
                                JOIN ROOM
                            </button>

                            {/* Generate Invite Link Button: */}
                            <div style={{display:"flex", flexDirection:"row", alignItems:"center"}}>
                                <button onClick={()=> generateInvite(room.room_id)}>GET INVITE</button>
                                Your Invite Link: <p style={{ borderStyle:"solid", height:"20px", width:"500px" }}>{invLinks[room.room_id]}</p>
                                <button onClick={()=> navigator.clipboard.writeText(invLinks[room.room_id] || "") }>COPY LINK</button>
                            </div>

                            {/* Want a button here that lets you LEAVE the room (which you can NOT do if you're the owner/"king"). */}
                            {room.role === 'member' && (
                                <>
                                    <button onClick={()=>handleLeave(room.room_id)}>
                                        LEAVE ROOM
                                    </button>
                                </>
                            )}

                            {/* Buttons for deleting the Room and managing its users (kicking them/transferring ownership) -- for the "Owner" only: */}
                            {room.role === 'king' && (
                                <>
                                    <button onClick={()=>handleDelete(room.room_id)}>DELETE ROOM</button>
                                    <button onClick={()=>handleManageUsers(room.room_id)}>MANAGE USERS</button>
                                </>
                            )}

                            {/* Code below is for adding a "shadowed" background when the Manage Users component appears (should come before): */}
                            {activeManageUsersRoomId !== null && (
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        zIndex: 99998, /* <ManageUsersSection> is 99999... */
                                    }}
                                    onClick={() => {
                                        // Clicking in the dark area should also just close the Manage Users component.
                                        setActiveManageUsersRoomId(null);
                                        setRoomMembers([]);
                                    }}
                                />
                            )}

                            {/* Code to have the Manage Users component appear: */}
                            {activeManageUsersRoomId === room.room_id && (
                                <ManageUsersSection 
                                currentUserId={userData.id} 
                                roomName={room.room_name} 
                                roomId={room.room_id} 
                                roomMembers={roomMembers} 
                                onClose={()=> {setActiveManageUsersRoomId(null); setRoomMembers([]); }}/>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default Dashboard;
