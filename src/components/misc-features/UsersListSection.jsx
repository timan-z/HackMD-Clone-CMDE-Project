// #2 -- THIS IS THE USERS LIST SECTION ("ACTIVE USERS" HEADER + ALL THE ROWS BELOW IT).

// BREAKING DOWN "UsersListContainer" - UsersListSection.jsx
// So this will be the body of the Users List Container (the body for the "Active Users" and "Inactive Users" areas).

import React from "react";
import UsersListEntry from './UsersListEntry.jsx';

const UsersListSection = ({ title, users, currentUserId, onChat }) => {
    return(
        <>
            <div
                className="section-title"
                style={{
                    backgroundColor: '#003300',
                    padding: '8px',
                    marginBottom: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span>{title}</span>
            </div>
            <div>
                <ul>
                    {users.map(user=>{
                        return(
                            <UsersListEntry
                                key={user.userId}
                                user={user}
                                currentUserId={currentUserId}
                                onChat={()=>onChat(user.userId)} // <--DEBUG:+NOTE: Don't forget to come back here and add something proper.
                            />
                        );
                    })}
                </ul>
            </div>
        </>
    );
};

export default UsersListSection;