import React from 'react';

export default function ChatInput({ input, setInput, onSubmit, disabled }) {
  return (
    <form className="chat-input-container" onSubmit={onSubmit}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Consult Jameson..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>
        {disabled ? "Processing..." : "Engage"}
      </button>
    </form>
  );
}
// This component handles the chat input form, allowing users to type messages and submit them.
