import React, { useEffect, useRef } from 'react';

export default function MessageList({ messages }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth', // smooth scroll, remove if you want instant
      });
    }
  }, [messages]);

  return (
    <div className="messages" ref={containerRef} style={{ overflowY: 'auto', maxHeight: '70vh' }}>
      {messages.length === 0 && (
        <div className="message-bubble ai">
          <p>Systems operational. Awaiting instructions. ♦tea sip♦</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`message-bubble ${msg.isUser ? 'user' : 'ai'}`}
        >
          <p>{msg.text.replace(/^\[Jameson\] |\[User\] /, '')}</p>
        </div>
      ))}
    </div>
  );
}
