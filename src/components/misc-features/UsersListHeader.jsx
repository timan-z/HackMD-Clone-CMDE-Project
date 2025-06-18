// [UsersList #1] -- THIS IS THE DRAGGABLE HEADER THING.

// BREAKING DOWN "UsersListContainer" - UsersListHeader.jsx
// For the "draggable" bar part of the Users List pop-up that appears.
import React from "react";

const UsersListHeader = ({ dragHandleRef, onClose }) => {
    return(
        <div
            ref={dragHandleRef}
            className="drag-handle"
            style={{
                cursor: 'move',
                backgroundColor: '#003300',
                padding: '8px',
                marginBottom: '10px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <span>USERS LIST</span>
            <button
            className="close-btn"
            onClick={onClose}
            style={{
                background: 'none',
                border: 'none',
                color: '#00FF41',
                fontSize: '18px',
                cursor: 'pointer',
            }}
            >X</button>
        </div>
    )
};

export default UsersListHeader;
