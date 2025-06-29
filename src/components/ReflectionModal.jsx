// ReflectionModal.jsx
import React, { useState } from 'react';
import '../styles/modes-css/tether.css';

export default function ReflectionModal({ onClose }) {
  const [reflection, setReflection] = useState('');

  const handleSubmit = () => {
    if (reflection.trim()) {
      localStorage.setItem('lastReflection', reflection.trim());
    }
    onClose();
  };

  return (
    <div className="tether-modal show">
      <div className="tether-modal-content">
        <p>✨ Take a moment to share how you’re feeling ✨</p>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write a short reflection here..."
          className="reflection-textarea"
        />
        <button onClick={handleSubmit}>Done</button>
      </div>
    </div>
  );
}
