// DEFINITELY COME BACK AND RE-MODULARIZE MY CODE -- COMBINE THIS WITH UsersListEntry.jsx LATER.
// I AM TRYING TO BLAST THROUGH COMPLETING THE FUNCTIONALTIY OF THIS STUPID PROJECT!

import React from "react";

const ManageUsersListEntry = ({user, currentUserId }) => {
    const userId = user.userId;

    return(
        <li key={userId}>
            
            {/*{userId !== currentUserId && ()}*/}
            
            <span>{user.username}</span>
            
        </li>
    );
};

export default ManageUsersListEntry;