// DEFINITELY COME BACK AND RE-MODULARIZE MY CODE -- COMBINE THIS WITH UsersListEntry.jsx LATER.
// I AM TRYING TO BLAST THROUGH COMPLETING THE FUNCTIONALTIY OF THIS STUPID PROJECT!

import React from "react";

const ManageUsersListEntry = ({roomId, roomName, user, currentUserId, onKick }) => {
    const userId = user.userId;

    return(
        <li key={userId}>
            <span>{user.username}</span>
            
            {/* "Kick User" and "Transfer Ownership" buttons for all non-current (owner) users: */}
            {userId !== currentUserId && (
                <div>
                    <button onClick={()=>onKick(user.userId, roomId)}>KICK USER</button>
                    <button>TRANSFER OWNERSHIP</button>
                </div>
            )}
        </li>
    );
};

export default ManageUsersListEntry;