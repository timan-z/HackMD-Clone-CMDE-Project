// UPDATE: Better to break my original usersListBar.js (or translated UsersListBar.jsx) file into multiple modular pieces:
// DEBUG: Don't forget to add back "shadowing" the Users Icon button at the top-right corner of the Editor.jsx page later on...
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // NOTE: Since I'm no longer injecting HTML into the DOM, createPortal will mimic my original appending to document.body

// MODULARITY:
import UsersListHeader from './UsersListHeader.jsx';
import UsersListEntry from './UsersListEntry.jsx';

const UsersListContainer = ({ userData, activeUsersList, usersList, onClose }) => {
    const containerRef = useRef(null);
    const dragHandleRef = useRef(null);
    const offset = useRef({ x: 0, y: 0 });

    // Building the list of inactive users (by just getting the subset of usersList and activeUsersList or whatever):
    const inactiveUsersList = usersList.filter(
        user => !activeUsersList.some(active => active.userId === user.userId)
    );

    console.log("DEBUG: The value of usersList => [", usersList, "]");
    console.log("DEBUG: The value of activeUsersList => [", activeUsersList, "]");
    console.log("DEBUG: The value of inactiveUsersList => [", inactiveUsersList, "]");

    useEffect(() => {
        const container = containerRef.current;
        const dragHandle = dragHandleRef.current;
        if (!container || !dragHandle) return;

        let isDragging = false;

        // dragging functions:
        // 1.
        const onMouseDown = (e) => {
            isDragging = true;
            offset.current = {
                x: e.clientX - container.getBoundingClientRect().left,
                y: e.clientY - container.getBoundingClientRect().top,
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        // 2.
        const onMouseMove = (e) => {
            if (!isDragging) return;

            // Setting Boundaries for dragging:
            const newLeft = e.clientX - offset.current.x;
            const newTop = e.clientY - offset.current.y;
            // Clamp within viewport boundaries:
            const maxLeft = window.innerWidth - container.offsetWidth;
            const maxTop = window.innerHeight - container.offsetHeight;
            container.style.left = `${Math.min(Math.max(0, newLeft), maxLeft)}px`;
            container.style.top = `${Math.min(Math.max(0, newTop), maxTop)}px`;
        };

        // 3.
        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        dragHandle.addEventListener('mousedown', onMouseDown);
        return () => {
            dragHandle.removeEventListener('mousedown', onMouseDown);
        };
    }, []);

    const container = (
        // Making it a little nicer:
        <div 
        ref={containerRef}
        id="users-list-container"
        className="users-list"
        style={{
            position: 'fixed',
            top: '100px',
            right: '5px',
            width: '300px',
            height: '400px',
            backgroundColor: '#0D0208',
            color: '#00FF41',
            fontFamily: 'monospace',
            border: '2px solid #00FF41',
            borderRadius: '8px',
            boxShadow: '0 0 10px #00FF41',
            padding: '10px',
            zIndex: 99999,
        }}>
            {/* THE USERS LIST HEADER (THE THING THAT YOU'LL BE DRAGGING TO MOVE THE USERS LIST CONTAINER COMPONENT AROUND): */}
            <UsersListHeader dragHandleRef={dragHandleRef} onClose={onClose}/>

            {/* ACTIVE USERS: */}
            <div>
                <ul>
                    {activeUsersList.map(user => (
                        <UsersListEntry
                            key={user.userId}
                            user={user}
                            isActive={true}
                            currentUserId={userData.id}
                            onChatClick={(targetUser) => console.log("COME BACK HERE AND ADD THE CHAT FEATURE FOR: ", targetUser)}
                        />
                    ))}
                </ul>
            </div>

            {/* INACTIVE USERS: */}
            <div
                className="drag-handle"
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
                <span>Inactive Users</span>
            </div>
            <div>
                <ul>
                    {inactiveUsersList.map(user => (
                        <UsersListEntry
                            key={user.userId}
                            user={user}
                            isActive={false}
                            currentUserId={userData.id}
                            onChatClick={(targetUser) => console.log("COME BACK HERE AND ADD THE CHAT FEATURE FOR: ", targetUser)}
                        />
                    ))}
                </ul>
            </div>

        </div>
    );

    return createPortal(container, document.body);  // This basically mimics my "document.body.appendChild(usersListContainer);" code from my og usersListBar.js or (UsersListBar.jsx)
};

export default UsersListContainer;
