// FOR THE CHAT MESSAGE BOX AREA!!! -- ChatBox.jsx
import React, { useState, useEffect } from 'react';

const ChatBox = ({ currentUserId, targetUserId, onClose, socket }) => {
    const [messages, setMessages] = useState([]);   // LOCAL CHAT HISTORY. (SHOULD BE AN OBJECT WITH MESSAGES + WHO SENT THEM I THINK).
    const [newMessage, setNewMessage] = useState('');

    // Socket listener for incoming messages:
    useEffect(() => {
        const handleReceiveMessage = ({ from, to, text}) => {
            if(from === targetUserId && to === currentUserId) {
                setMessages(prev => [...prev, {from, text}]);
            }
        };
        socket.on('private-message', handleReceiveMessage);

        return() => {
            socket.off('private-message', handleReceiveMessage);
        };
    }, [socket, targetUserId, currentUserId]);

    const sendMessage = () => {
        if(newMessage.trim()) {
            const message = {
                from: currentUserId,
                to: targetUserId,
                text: newMessage,
            };
            
            // Emit message:
            socket.emit('private-message', message);
            // Add to local display:
            setMessages(prev => [...prev, {from: currentUserId, text: newMessage}]);
            setNewMessage('');
        }
    };

    // hmmm:
    return(
        <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4>Chat with {targetUserId}</h4>
                <button onClick={onClose}>Back</button>
            </div>

            <div style={{ height: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '8px', marginBottom: '8px' }}>
                {messages.map((msg, index) => (
                <div key={index} style={{ textAlign: msg.from === currentUserId ? 'right' : 'left' }}>
                    <span
                    style={{
                        display: 'inline-block',
                        padding: '6px 10px',
                        margin: '4px 0',
                        backgroundColor: msg.from === currentUserId ? '#cce5ff' : '#e2e2e2',
                        borderRadius: '12px',
                    }}
                    >
                    {msg.text}
                    </span>
                </div>
                ))}
            </div>

            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{ width: '80%', marginRight: '8px' }}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
    // hmmm.



};

export default ChatBox;