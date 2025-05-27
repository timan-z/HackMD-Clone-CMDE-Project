// This will be the area of the ManageUsersSection where its Users List appears:
// DEBUG: I can definitely improve the modularity of this project (w/ UsersListSection.jsx) -- come back and do that after I'm done the main func!

import React from "react";
import ManageUsersListEntry from "./ManageUsersListEntry";

const ManageUsersListSection = ({ roomId, roomName, users, currentUserId, onKick, onTransfer }) => {
    return(
        <>
            <ul>
                {users.map(user=> {
                    return(
                        <ManageUsersListEntry
                            key={user.userId}
                            user={user}
                            currentUserId={currentUserId}
                            onKick={onKick}
                            roomId={roomId}
                            roomName={roomName}
                            onTransfer={onTransfer}
                        />
                    );
                })}
            </ul>
        </>
    )
};

export default ManageUsersListSection;