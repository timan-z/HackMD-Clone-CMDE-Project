// BREAKING DOWN "UsersListContainer" - UsersListEntry.jsx
// For rendering a single User Item (Row) in the UsersListContainer (- <Username> [Chat Msg Icon])

import React from "react";

// DEBUG: isActive should just be a boolean value from checking if it's in the Active Users List array...

const UsersListEntry = ({ user, isActive, currentUserId, onChatClick }) => {

    const userId = user.userId;
    
    return(
        <li key={userId}>
            <span>{user.username}</span>
            {userId !== currentUserId && (
                <button onClick={() => onChatClick(user)}>CHAT</button>
            )}
        </li>
    )
};

export default UsersListEntry;
