// [UsersList #3] -- THIS IS BASICALLY EVERY INDIVIDUAL ROW THAT'S WITHIN THE USERS LIST SECTION.

// BREAKING DOWN "UsersListContainer" - UsersListEntry.jsx
// For rendering a single User Item (Row) in the UsersListContainer (- <Username> [Chat Msg Icon]). Basically, this is for a single Row.

import React from "react";

// DEBUG: isActive should just be a boolean value from checking if it's in the Active Users List array...

const UsersListEntry = ({ user, currentUserId, onChat, hasUnread }) => {

    const userId = user.userId;
    
    return(
        <li key={userId}>
            <span>{user.username}</span>
            {userId !== currentUserId && (
                <button onClick={onChat}>
                    CHAT
                </button>
            )}
            {hasUnread && (
                <span>
                    !
                </span>
            )}
        </li>
    );
};

export default UsersListEntry;
