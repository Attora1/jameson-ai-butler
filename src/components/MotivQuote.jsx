import React, { useState, useEffect } from 'react';

const quotes = [
  "Focus on what matters, let the rest wait.",
  "Small steps every day lead to big progress.",
  "One thing at a time.",
  "Progress, not perfection.",
  "Stay present, stay productive.",
  "Every quest completed is a step closer to your goals.",
  "You are capable of amazing things.",
  "Stay focused, stay strong.",
  "Your attention is your most valuable resource.",
  "Focus on the task, not the outcome.",
  "Every moment of focus is a moment of growth.",
];

export default function MotivQuote({ customEncouragement, customWit }) {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Use custom encouragement if provided, otherwise pick a random quote
    if (customEncouragement) {
      setQuote(customEncouragement);
    } else {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setQuote(quotes[randomIndex]);
    }
  }, [customEncouragement]);

  return (
    <div className="motivational-quote" aria-live="polite" role="note">
      <em>"{quote}"</em>
      {customWit && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.9em', opacity: 0.8 }}>
          {customWit}
        </div>
      )}
    </div>
  );
}