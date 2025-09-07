import {useEffect, useState, useRef} from "react";
import { useNavigate } from "react-router-dom";
import { createNewEdRoom, getAllRooms, generateInvLink, joinRoomViaInv, leaveRoom, deleteRoom } from "../utility/api.js";
import { io } from "socket.io-client";
import { btnStyleDB } from "../utility/utilityFuncs.js";
import ManageUsersSection from "../misc-features/ManageUsersSection.jsx";

// NOTE: socket_base string manipulation below has to do with Railway (where I'm hosting backend stuff) and how paths are specified over there.
let socket_base = import.meta.env.VITE_SOCKET_BASE;
if(socket_base.endsWith('/')) {
    socket_base = socket_base.slice(0, -1);
}
//console.log("DEBUG: Value of socket_base => ", socket_base);
const socket = io(socket_base, { withCredentials: true});

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

            window.location.reload();
        } catch (err) {
            console.error(`ERROR: Error in attempting to leave the Editor Room ID:(${roomId}) because: ${err}`);
        }
    }

    const handleDelete = async(roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;

        try {
            await deleteRoom(roomId, token);
            window.location.reload();
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
        <div style={{
            height:'100%',
            width:'100%',
            overflowX: 'hidden',
            boxSizing: 'border-box',
            padding: '20px',
            backgroundColor: '#000',
            color: '#00FF41',
            fontFamily: 'monospace',
        }} >
            <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>DASHBOARD</h1>

            <button 
            onClick={handleLogout}
            style={{
                backgroundColor: '#0D0208',
                color: '#00FF41',
                border: '2px solid #00FF41',
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                boxShadow: '0 0 6px #00FF41',
                marginBottom: '20px',
            }}>LOG OUT</button>
            
            {/* <div> for the area with the Create New Room & Join New Room "cards": */}
            <div style={{display:"flex", gap:"25px", marginBottom: '30px'}}>
                {/* Button for CREATING a New Room <div>: */}
                <div style={{
                    backgroundColor: '#0D0208',
                    border: '2px solid red',
                    borderRadius: '25px',
                    width: '300px',
                    height: '275px',
                    padding:'10px',
                    boxShadow: '0 0 10px red',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <h4 style={{color:"red"}}>CREATE NEW ROOM</h4>    

                    {/* Twin Peaks gif lol. [1] */}
                    <div>
                        <img style={{ maxWidth:"200px", width:"100%", borderRadius:"25px", boxShadow: '0 0 10px red' }} src="../../gifs/join-room-fwwm.gif"></img>
                    </div>

                    <form onSubmit={ async (e) => {
                        e.preventDefault();
                        const edRoomName = newEdRoomNameRef.current.value;
                        const token = localStorage.getItem("token");
                        try {
                            await createNewEdRoom(edRoomName, token);
                            window.location.reload();
                        } catch(err) {
                            console.error(`ERROR: There was an error when attempting to create a new room => ${err}}`);
                        }
                    }}>
                        <div style={{color:"red", width:"100%"}}>
                            <input id="createEdRoomName" type="text" ref={newEdRoomNameRef} placeholder="Room Name (Optional):"
                            style={{
                                width:"97%",
                                backgroundColor:"#000",
                                border: '1px solid red',
                                borderRadius: '4px',
                                color:'red',
                                padding: '4px',
                                marginTop: '5px',}}/>
                        </div>
                        
                        <button style={{
                            marginTop: '8px',
                            padding: '6px',
                            width: '100%',
                            backgroundColor: '#000',
                            color: 'red',
                            border: '1px solid red',
                            borderRadius: '4px',
                            boxShadow: '0 0 4px red',
                            cursor: 'pointer'
                        }}>
                            Create Room
                        </button>
                    </form>
                </div>

                {/* Button for JOINING a New Room <div>: */}
                <div style={{
                    backgroundColor: '#0D0208',
                    border: '2px solid white',
                    borderRadius: '25px',
                    width: '300px',
                    height: '275px',
                    padding:'10px',
                    boxShadow: '0 0 10px white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <h4 style={{color:"white"}}>JOIN NEW ROOM (WITH INVITE LINK)</h4>

                    {/* Twin Peaks gif lol. [2] */}
                    <div>
                        <img style={{ maxWidth:"275px", width:"100%", borderRadius:"25px", boxShadow: '0 0 10px white' }} src="../../gifs/create-room-fwwm.gif"></img>
                    </div>

                    {/* The form for calling the right functions for joining a new room: */}
                    <form onSubmit={ async(e) => {
                        e.preventDefault();
                        const token = localStorage.getItem("token");
                        const edRoomLink = joinEdRoomLink.current.value;

                        try {
                            const data = await joinRoomViaInv(token, edRoomLink);
                            if(data.success) {
                                window.location.reload();
                            } else {
                                alert("Seems to be an expired link or you might already be in the room.");
                            }
                        } catch (err) {
                            console.error(`ERROR: Failed to join Editor Room via invite. The reason: ${err}`);
                        }
                    }}>
                        <input
                            id="join-room-link"
                            ref={joinEdRoomLink}
                            type="text"
                            placeholder="Paste invite link here"
                            style={{
                                width: '100%',
                                backgroundColor: '#000',
                                color: 'white',
                                border: '1px solid white',
                                borderRadius: '4px',
                                padding: '4px',
                                marginBottom: '6px',
                                marginTop: '5px'
                            }}
                        />
                        <button style={{
                            padding: '6px',
                            width: '100%',
                            backgroundColor: '#000',
                            color: 'white',
                            border: '1px solid white',
                            borderRadius: '4px',
                            boxShadow: '0 0 4px white',
                            cursor: 'pointer'
                        }}>
                            Join Room
                        </button>
                    </form>
                </div>
            </div>

            <h4 style={{fontSize: '1.5rem', marginBottom: '10px'}}>YOUR EDITOR ROOMS:</h4>
            {/* <div> for loading the List of Rooms (that the user has access to): */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {rooms.map((room) => {
                    return(
                        <div key={room.user_room_id} style={{
                            border: '1px solid #00FF41',
                            borderRadius: '8px',
                            backgroundColor: '#0D0208',
                            padding: '10px',
                            boxShadow: '0 0 6px #00FF41',
                        }}>
                            <div style={{ marginBottom: '8px' }}>
                                <p><b>{room.room_name}</b></p>
                                <p><b>ID:</b> {room.room_id} </p>
                                <p><b>Role:</b> {room.role}</p>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {/* Join Room Button: */}
                                <button onClick={()=> handleJoin(room.room_id)} style={btnStyleDB}>JOIN</button>
                                <button onClick={() => generateInvite(room.room_id)} style={btnStyleDB}>GET INVITE</button>
                                <button onClick={() => navigator.clipboard.writeText(invLinks[room.room_id] || "")} style={btnStyleDB}>COPY LINK</button>

                                {/* Want a button here that lets you LEAVE the room (which you can NOT do if you're the owner/"king"). */}
                                {room.role === 'member' && (
                                    <>
                                        <button onClick={()=>handleLeave(room.room_id)} style={btnStyleDB}>LEAVE ROOM</button>
                                    </>
                                )}

                                {/* Buttons for deleting the Room and managing its users (kicking them/transferring ownership) -- for the "Owner" only: */}
                                {room.role === 'king' && (
                                    <>
                                        <button style={btnStyleDB} onClick={()=>handleDelete(room.room_id)}>DELETE ROOM</button>
                                        <button style={btnStyleDB} onClick={()=>handleManageUsers(room.room_id)}>MANAGE USERS</button>
                                    </>
                                )}
                            </div>

                            {/* Invite Display */}
                            {invLinks[room.room_id] && (
                                <div style={{
                                    marginTop: '10px',
                                    backgroundColor: '#000',
                                    padding: '5px',
                                    border: '1px dashed #00FF41',
                                    borderRadius: '4px',
                                    overflowWrap: 'break-word'
                                }}>
                                    {invLinks[room.room_id]}
                                </div>
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
