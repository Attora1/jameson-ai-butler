import React from 'react';

export default function WakeUpInput({ input, setInput, onWakeUp }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.toLowerCase().trim() === 'wake up') {
      onWakeUp(e); 
    }
  };

  return (
    <form className="chat-input-container" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type 'wake up' to reactivate AELI..."
        className="chat-textarea"
      />
      <button type="submit">Wake Up</button>
    </form>
  );
}
