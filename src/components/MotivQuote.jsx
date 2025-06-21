import React, { useState, useEffect } from 'react';

const quotes = [
  "Focus on what matters, let the rest wait.",
  "Small steps every day lead to big progress.",
  "Do one thing at a time, and do it well.",
  "Your future self will thank you for this focus.",
  "Progress, not perfection.",
  "Concentration is the key to unlocking your potential."
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
