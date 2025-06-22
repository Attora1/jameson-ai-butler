import React, { useRef, useEffect } from 'react';

export default function ChatInput({ input, setInput, onSubmit, disabled }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto'; // reset first
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // then expand
    }
  }, [input]);

  return (
    <form className="chat-input-container" onSubmit={onSubmit}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Consult Jameson..."
        disabled={disabled}
        rows={1}
        className="chat-textarea"
      />
      <button type="submit" disabled={disabled}>
        {disabled ? "Processing..." : "Engage"}
      </button>
    </form>
  );
}
