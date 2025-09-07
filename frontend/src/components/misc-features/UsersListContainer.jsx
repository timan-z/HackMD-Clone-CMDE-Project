// [UsersList #0] -- THIS IS THE CONTAINER FOR THE WHOLE THING.
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom'; // NOTE: Since I'm no longer injecting HTML into the DOM, createPortal will mimic my original appending to document.body
import UsersListHeader from './UsersListHeader.jsx';
import UsersListSection from './UsersListSection.jsx';
import ChatBox from './ChatBox.jsx';

const UsersListContainer = ({ userData, activeUsersList, usersList, onClose, socket, token, roomId }) => {
    const containerRef = useRef(null);
    const dragHandleRef = useRef(null);
    const offset = useRef({ x: 0, y: 0 });
    const [chatTargetId, setChatTargetId] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState({});

    // Building the list of inactive users (by just getting the subset of usersList and activeUsersList or whatever):
    const inactiveUsersList = usersList.filter(
        user => !activeUsersList.some(active => active.userId === user.userId)
    );

    // Function for toggling chat with user state variables:
    const toggleChatWithUser = (targetUserId) => {
        if(chatTargetId === targetUserId) {
            setChatTargetId(null);  // Close Chat (and return to Users List or w/e).
        } else {
            setChatTargetId(targetUserId);
            setUnreadMessages(prev => {
                const updated={...prev};
                delete updated[targetUserId];
                return updated;
            });
        }
    };

    // useEffect to handle incoming messages notifications:
    useEffect(() => {
        const handlePrivateMessage = ({ from, to, text }) => {
            // If the message received isn't in an already active chat, a symbol (!) will indicate a new message was sent.
            if(chatTargetId !== from) {
                setUnreadMessages(prev => ({...prev, [from]: true}));
            }
        };
        socket.on('private-message', handlePrivateMessage);
        return() => {
            socket.off('private-message', handlePrivateMessage);
        };
    }, [chatTargetId, socket]);

    // useEffect for the dragging functionality:
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
            zIndex: 99997,
        }}>
            {/* THE USERS LIST HEADER (THE THING THAT YOU'LL BE DRAGGING TO MOVE THE USERS LIST CONTAINER COMPONENT AROUND): */}
            <UsersListHeader dragHandleRef={dragHandleRef} onClose={onClose}/>

            {chatTargetId ? (
                /* MESSAGING SYSTEM: */
                <ChatBox
                    currentUserId={userData.id}
                    targetUserId={chatTargetId}
                    onClose={()=> setChatTargetId(null)}
                    socket={socket}
                    token={token}
                    roomId={roomId}
                />
            ):(
                /* USERS LIST SYSTEM: */
                <>
                    {/* ACTIVE USERS: */}
                    <UsersListSection
                        title="Active Users"
                        users={activeUsersList}
                        currentUserId={userData.id}
                        onChat={toggleChatWithUser}
                        unreadMessages={unreadMessages}
                    />

                    {/* INACTIVE USERS: */}
                    <UsersListSection
                        title="Inactive Users"
                        users={inactiveUsersList}
                        currentUserId={userData.id}
                        onChat={toggleChatWithUser}
                        unreadMessages={unreadMessages}
                    />
                </>
            )}
        </div>
    );

    return createPortal(container, document.body);  // This basically mimics my "document.body.appendChild(usersListContainer);" code from my og usersListBar.js or (UsersListBar.jsx)
};

export default UsersListContainer;
