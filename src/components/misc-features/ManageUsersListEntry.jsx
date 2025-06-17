// DEFINITELY COME BACK AND RE-MODULARIZE MY CODE -- COMBINE THIS WITH UsersListEntry.jsx LATER.
// I AM TRYING TO BLAST THROUGH COMPLETING THE FUNCTIONALTIY OF THIS STUPID PROJECT!

import React from "react";
import { btnStyleEd } from "../utility/utilityFuncs.js";

const ManageUsersListEntry = ({roomId, roomName, user, currentUserId, onKick, onTransfer }) => {
    const userId = user.userId;

    return(
        <li key={userId}>
            <span>{user.username}</span>
            
            {/* "Kick User" and "Transfer Ownership" buttons for all non-current (owner) users: */}
            {userId !== currentUserId && (
                <div>
                    <button style={btnStyleEd} onClick={()=>onKick(user.username, user.userId, roomId)}>KICK USER</button>
                    <button style={btnStyleEd} onClick={()=>onTransfer(roomId, user.userId, currentUserId, user.username)} >TRANSFER OWNERSHIP</button>
                </div>
            )}
        </li>
    );
};

export default ManageUsersListEntry;
