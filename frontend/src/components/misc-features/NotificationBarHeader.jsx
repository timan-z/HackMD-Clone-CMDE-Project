
import React from "react";

const NotificationBarHeader = ({ dragHandleRef, onClose, clearNotifs }) => {
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
            <span>NOTIFICATIONS</span>

            <button onClick={clearNotifs}
            style={{
                backgroundColor: '#001100',
                color: '#00FF41',
                border: '1px solid #00FF41',
                padding: '2px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'monospace',
            }}>
                Clear Notifs
            </button>

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

export default NotificationBarHeader;
