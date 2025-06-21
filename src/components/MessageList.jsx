import React from 'react';

export default function MessageList({ messages }) {
  return (
    <div className="messages">
      {messages.length === 0 && (
        <div className="message-bubble ai">
          <p>Jameson: Operational. Awaiting instructions. ♦tea sip♦</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`message-bubble ${msg.isUser ? 'user' : 'ai'}`}
        >
          <p>{msg.text}</p>
        </div>
      ))}
    </div>
  );
}
