import React, { useRef, useEffect } from 'react';

export default function ChatInput({ input, setInput, onSubmit, disabled }) {
  const textareaRef = useRef(null);

  // Refocus reliably when re-enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [disabled, input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(e);
    // Do not refocus here; allow the `useEffect` on disabled to handle it.
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input-container" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Consult AELI..."
        disabled={disabled}
        rows={1}
        className="chat-textarea"
      />
      <button className="btn" type="submit" disabled={disabled}>
        {disabled ? "Processing..." : "Engage"}
      </button>
    </form>
  );
}
