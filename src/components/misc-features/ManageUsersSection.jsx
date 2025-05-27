/* This will be inserted into the Dashboard page -- it's the "Manage Users" component that appears and lets the
user transfer ownership to others in the Editor Room or remove certain users. */
import React, { useState, useEffect} from 'react';
import { createPortal } from 'react-dom';
import { kickRoomUser, transferRoomOwn } from "../utility/api.js";

import UsersListSection from './UsersListSection.jsx';
import ManageUsersListSection from './ManageUsersListSection.jsx';


const ManageUsersSection = ({ roomId, roomName, roomMembers, currentUserId, onClose, onTransfer }) => {




    // Function for kicking a User.
    /* DEBUG:+TO-DO:
    - Kicking a User should send a notification.
    - Kicking a User -- while said User is active in the Editor Room -- will prompt a pop-up to appear on their screen letting them know.
    - Kicking a User should force the <ManageUsersListSection> to re-render the members present in real-time. (Likely involves UseEffect)
    */
    const handleKick = async(targetUserId, roomId) => {
        const token = localStorage.getItem("token");
        if(!token) return;

        try {
            //const data = await kickUser(roomId, targetUserId);
            // AFTER the function runs, I need to send a notification out from here.
            // ALSO -- Check to see if said user is currently in that room! (Which I think I can do with Socket.IO!)
            const data = await kickRoomUser(roomId, targetUserId, token);
            console.log("DEBUG: The value of data.success => [", data.success, "]");
            // INSERT SOCKET.IO EMIT THING!!! <-- DEBUG:+TO-DO COME BACK HERE LATER!!!
        } catch(err) {
            console.error("DEBUG: Error in attempting to kick User ID:(", targetUserId, ") from Room ID:(", roomId, ") => ", err);
        }
    };


    // Function for transferring ownership:
    /* DEBUG:+TO-DO:
    - Transferring ownership should send a notification (either "X user has become New Owner" or "YOU have become New Owner").
    */
    const handleOwnTransfer = async(roomId, targetUserId, currentUserId) => {
        const token = localStorage.getItem("token");
        if(!token) return;

        try {
            const data = await transferRoomOwn(roomId, targetUserId, currentUserId, token);

            console.log("DEBUG: The value of data.success => [", data.success, "]");
            // INSERT SOCKET.IO EMIT THING!!! <--DEBUG:+TO-DO COME BACK HERE LATER!!!
        } catch(err) {
            console.error("DEBUG: Error in attempting to transfer ownership of Room ID:(", roomId, ") from User ID:(", currentUserId, ") to User ID:(", targetUserId, ")");
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