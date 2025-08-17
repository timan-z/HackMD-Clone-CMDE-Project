/* This will be inserted into the Dashboard page -- it's the "Manage Users" component that appears and lets the
user transfer ownership to others in the Editor Room or remove certain users. */
import React, { useState, useEffect} from 'react';
import { createPortal } from 'react-dom';
import { kickRoomUser, transferRoomOwn } from "../utility/api.js";
import UsersListSection from './UsersListSection.jsx';
import ManageUsersListSection from './ManageUsersListSection.jsx';
import { io } from "socket.io-client";
//const socket = io("http://localhost:4000");
const socket = io(import.meta.env.VITE_SOCKET_BASE, { withCredentials: true}); // <-- DEBUG: Will need to change this when I host on backend (testing now for server.js addition).

const ManageUsersSection = ({ roomId, roomName, roomMembers, currentUserId, onClose, onTransfer }) => {

    // Function for kicking a User.
    const handleKick = async(targetUsername, targetUserId, roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;

        try {
            await kickRoomUser(roomId, targetUserId, token);

            socket.emit("notification", {
                type: "kick-user",
                roomId: roomId,
                userId: targetUserId,
                username: targetUsername,
                message:`${targetUsername} ID:${targetUserId} was kicked from the room.`,
                timestamp: Date.now(),
            })
        } catch(err) {
            console.error("DEBUG: Error in attempting to kick User ID:(", targetUserId, ") from Room ID:(", roomId, ") => ", err);
        }
    };

    // Function for transferring ownership:
    const handleOwnTransfer = async(roomId, targetUserId, currentUserId, targetUsername) => {
        const token = localStorage.getItem("token");
        if(!token) return;

        try {
            await transferRoomOwn(roomId, targetUserId, currentUserId, token);

            socket.emit("notification", {
                type:"transfer-ownership",
                roomId: roomId,
                targetUserId: targetUserId,
                currentUserId: currentUserId,
                targetUsername: targetUsername,
                message: `User ${targetUsername} ID:${targetUserId} was promoted to Owner of Editor Room [${roomId}]`,
                timestamp: Date.now(),
            })
        } catch(err) {
            console.error("ERROR: Error in attempting to transfer ownership of Room ID:(", roomId, ") from User ID:(", currentUserId, ") to User ID:(", targetUserId, ")");
        }
    };
    
    const ManageUsers = (
        <div id="manage-users-sect" style={{
            position: 'fixed',
            top:'20%',
            right:'27.5%',
            height:'55%',
            width:'40%',
            backgroundColor: '#0D0208',
            color: '#00FF41',
            fontFamily: 'monospace',
            border: '2px solid #00FF41',
            borderRadius: '8px',
            boxShadow: '0 0 10px #00FF41',
            padding: '10px',
            zIndex: 99999,        
        }}>
            {/* Arbitrary Headers (defined here and not elsewhere since its position will be fixed): */}
            <div>
                <span>ROOM [{roomName}] USERS LIST</span>
                <button
                onClick={onClose}
                style={{
                background: 'none',
                border: 'none',
                color: '#00FF41',
                fontSize: '18px',
                cursor: 'pointer',
                }}>
                    X
                </button>
            </div>

            {/* Loading a list of the Users associated with this Room: */}
            <ManageUsersListSection roomId={roomId} roomName={roomName} users={roomMembers} currentUserId={currentUserId} onKick={handleKick} onTransfer={handleOwnTransfer} />
        </div>
    );

    return createPortal(ManageUsers, document.body); // Mimics "document.body.appendChild(ManageUsers);"
};

export default ManageUsersSection;