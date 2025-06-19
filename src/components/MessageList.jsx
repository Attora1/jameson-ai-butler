import React from 'react';

export default function MessageList({ messages }) {
  return (
    <div className="messages">
      {messages.length === 0 && (
        <div className="bot-message">
          <p>Jameson: Operational. Awaiting instructions. ♦tea sip♦</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <div key={i} className={msg.isUser ? 'user-message' : 'bot-message'}>
          <p>{msg.text}</p>
        </div>
      ))}
    </div>
  );
}
// This component renders the list of messages in the chat.