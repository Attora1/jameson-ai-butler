import React, { useEffect, useRef } from 'react';
import useAELIVoice from '../../hooks/useAELIVoice.js';

export default function MessageList({ messages, settings, hidden }) {
  const containerRef = useRef(null);

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const aeliText = lastMessage && !lastMessage.isUser && lastMessage.text ? lastMessage.text.replace(/^(\\[AELI\\] |\\[User\\] )/, '') : '';

  useAELIVoice(aeliText, settings);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
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
          className={`message-bubble ${msg?.isUser ? 'user' : 'ai'}`}
        >
          <p>{msg?.text ? msg.text.replace(/^(\\[AELI\\] |\\[User\\] )/, '') : '[Message unavailable]'}</p>
        </div>
      ))}
    </div>
  );
}
