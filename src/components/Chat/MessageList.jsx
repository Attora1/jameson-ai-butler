import React, { useEffect, useRef, useMemo } from 'react';
import useAELIVoice from '../../hooks/useAELIVoice.js';

export default function MessageList({ messages, settings, poweredDown, remainingTime }) {
  const containerRef = useRef(null);

  // Memoize last Aeli message
  const lastAeliMessage = useMemo(() => {
    const reversed = [...messages].reverse();
    return reversed.find((msg) => !msg.isUser && msg.text);
  }, [messages]);

  const aeliText = lastAeliMessage?.text?.replace(/^\[AELI\] |\[User\] /, '');

  useAELIVoice(aeliText, settings, poweredDown);

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
      {remainingTime !== null && remainingTime > 0 && (
        <div className="message-bubble ai">
          <p>Timer: {Math.floor(remainingTime / 1000)} seconds remaining</p>
        </div>
      )}
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
          <p>{msg?.text ? msg.text.replace(/^\[AELI\] |\[User\] /, '') : '[Message unavailable]'}</p>
        </div>
      ))}
    </div>
  );
}
