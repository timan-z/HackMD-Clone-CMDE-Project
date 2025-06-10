// FOR THE CHAT MESSAGE BOX AREA!!! -- ChatBox.jsx
import React, { useState, useEffect } from 'react';
//import { loadChatHistory, appendMessageToHistory } from '../utility/utilityFuncs.js';   // <-- DEBUG: Probably should remove!
import { getMessages, sendMessage } from '../utility/api.js';
//import { loadChatHistory } from '../utility/utilityFuncs';

const ChatBox = ({ currentUserId, targetUserId, onClose, socket, token, roomId }) => {
    const [messages, setMessages] = useState([]);   // LOCAL CHAT HISTORY. (SHOULD BE AN OBJECT WITH MESSAGES + WHO SENT THEM I THINK).
    const [newMessage, setNewMessage] = useState('');




    // On initial chat open, this useEffect will run and retrieve the chat log history:
    useEffect(() => {
        const loadChatHistory = async() => {
            const messages = await getMessages(roomId, token);
            const getUserMsgs = messages.filter(
                m => (m.from_user === currentUserId && m.to_user === targetUserId) ||
                (m.to_user === currentUserId && m.from_user === targetUserId)
            );
            setMessages(getUserMsgs.map(({ from_user, message }) => ({ from: from_user, text: message })));
        };

        if(targetUserId) loadChatHistory();
    }, [targetUserId, roomId, currentUserId, token]);




    // Socket listener for incoming messages:
    useEffect(() => {
        const handleReceiveMessage = ({ from, to, text}) => {
            if(from === targetUserId && to === currentUserId) {
                const message = { from, text, timestamp: Date.now() };
                setMessages(prev => [...prev, message]);
                //appendMessageToHistory(currentUserId, targetUserId, message);
            }
        };
        socket.on('private-message', handleReceiveMessage);

        return() => {
            socket.off('private-message', handleReceiveMessage);
        };
    }, [socket, targetUserId, currentUserId]);

    const sendMessageLocal = async() => {
        if(newMessage.trim()) {
            const message = {
                from: currentUserId,
                to: targetUserId,
                text: newMessage,
                timestamp: Date.now(),
            };
            
            // Emit message:
            socket.emit('private-message', message);
            // Save to the server:
            sendMessage(roomId, currentUserId, targetUserId, newMessage, token);
            // Add to local display:
            setMessages(prev => [...prev, message]);
            //appendMessageToHistory(currentUserId, targetUserId, message); // <-- not using this anymore.
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
                onKeyDown={(e) => e.key === 'Enter' && sendMessageLocal()}
                placeholder="Type a message..."
                style={{ width: '80%', marginRight: '8px' }}
            />
            <button onClick={sendMessageLocal}>Send</button>
        </div>
    );
    // hmmm.
};

export default ChatBox;
