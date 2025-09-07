// This will be the area of the ManageUsersSection where its Users List appears:

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