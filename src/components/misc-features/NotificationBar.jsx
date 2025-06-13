// MY VERY PRIMITIVE NOTIFICATION BAR (Basically the same setup as UsersListContainer.jsx) :
import { useState, useRef, useEffect } from "react";
import { createPortal } from 'react-dom';
import NotificationBarHeader from "./NotificationBarHeader";

const NotificationBar = ({ notifsOpen, onClose, socket }) => {
    const notifBarRef = useRef(null);
    const dragHandleRef = useRef(null);
    const offset = useRef({ x: 0, y: 0 });
    const [notifications, setNotifications] = useState(() => {
        const stored = localStorage.getItem("notifications");
        return stored ? JSON.parse(stored) : [];
    });

    // Function for clearing the contents of state variable "notifications":
    const clearNotifs = () => {
        setNotifications([]);
        // TO-DO: Need to make it so that clearing notifications **also** wipes the localStorage history:
        localStorage.removeItem("notifications");
    };

    // Function for handling receiving notifications is in this useEffect.
    useEffect(() => {
        if (!socket) return;

        const oneHour = 1000 * 3600;   // 3600 seconds is 1 hour.
        const handleNotif = (notif) => {

            // So if the Notifications component isn't open, set the background colour of the icon to Red (to imply new notifications):
            if(!notifsOpen) {
                let notifsBtn = document.getElementById('notifs-button');
                if(notifsBtn) notifsBtn.style.backgroundColor = 'red';
            }

            setNotifications((prev) => [...prev, notif]);
        };

        socket.on("notification", handleNotif);
        return () => socket.off("notification", handleNotif);
    }, [socket]);

    // useEffect for the dragging functionality:
    useEffect(() => {
        const container = notifBarRef.current;
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

    const notifBar = (

        <div id="notification-bar"
        ref={notifBarRef}
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
            padding:'10px',
            zIndex: 99997,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* "Draggable" header: */}
            <div ref={dragHandleRef}
            style={{
                flexShrink:0,
                userSelect: 'none',
            }}>
                {/*<NotificationBarHeader dragHandleRef={dragHandleRef} onClose={onClose} clearNotifs={clearNotifs} />*/}
                <NotificationBarHeader onClose={onClose} clearNotifs={clearNotifs} />
            </div>

            {/* Where Notification Items are dynamically loaded: */}
            <div id="notifications-area" style={{flexGrow:1, overflowY:'auto'}}>
                {notifications.map((n, idx) => (
                    <div key={idx} className="notif-bullet">
                        {n.message}<br/><br/>
                        {n.timestamp}
                        <hr/>
                    </div>
                ))}
            </div>
        </div>
  
    );

    return createPortal(notifBar, document.body); // append notifBar to document.body of the webpage.
};

export default NotificationBar;
