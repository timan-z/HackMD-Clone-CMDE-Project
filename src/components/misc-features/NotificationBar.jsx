// MY VERY PRIMITIVE NOTIFICATION BAR:
import { useState, useEffect } from "react";

const NotificationBar = ({ socket }) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!socket) return;

        const twentyFourHours = 1000 * 86400;   // 86400 seconds in 24hrs...
        const handleNotif = (notif) => {
            setNotifications((prev) => [...prev, notif]);
            setTimeout(() => {
                setNotifications((prev) => prev.filter(n => n !== notif));
            }, twentyFourHours); // Lasts for a day.
        };

        socket.on("notification", handleNotif);
        return () => socket.off("notification", handleNotif);
    }, [socket]);

    return(
        <div id="notification-bar" style={{ height:"100px", width:"100px", position: 'fixed', top: 10, right: 10, zIndex: 99999 }}>
            {notifications.map((n, idx) => (
                <div key={idx} className="notif-bullet">
                NOTIFICATION: {n.message}
                </div>
            ))}
        </div>
    );
};

export default NotificationBar;