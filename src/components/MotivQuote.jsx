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

export default function MotivQuote() {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Pick a random quote on mount
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
  }, []);

  return (
    <div className="motivational-quote" aria-live="polite" role="note">
      <em>"{quote}"</em>
    </div>
  );
}
