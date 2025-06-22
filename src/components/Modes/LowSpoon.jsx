import React, { useContext } from 'react';
import SpoonTracker from './SpoonTracker.jsx';
import { SpoonContext } from './SpoonContext.js';

export default function LowSpoon() {
  const { spoonCount } = useContext(SpoonContext);
  const suggestions = getSpoonSuggestions(spoonCount);

  return (
    <div className="low-spoon-container">
      <h2>Low Spoon Mode 🌙</h2>
      <p className="low-spoon-subtitle">Take it slow, Miss. No rush here.</p>

      <SpoonTracker />

      <div className="suggestions">
        <h3>Gentle Suggestions</h3>
        <ul>
          {suggestions.map((sugg, i) => (
            <li key={i} className="suggestion-item">{sugg}</li>
          ))}
        </ul>
      </div>

      <div className="low-spoon-jameson-message">
        <p>
          Remember: It’s okay to pause and breathe. Jameson is here to help, no matter how many spoons you have.
        </p>
      </div>
    </div>
  );
}
function getSpoonSuggestions(spoonCount) {
  if (spoonCount >= 10) {
    return [
      "Take a short walk to stretch your legs.",
      "Enjoy a cup of tea or coffee.",
      "Listen to your favorite song.",
      "Do a quick mindfulness exercise.",
    ];
  } else if (spoonCount >= 5) {
    return [
      "Sit down and relax for a few minutes.",
      "Read a chapter of a book you love.",
      "Watch a short, uplifting video.",
      "Do some light stretching or yoga.",
    ];
  } else {
    return [
      "Take deep breaths and rest your eyes.",
      "Have a light snack to recharge.",
      "Listen to calming music or nature sounds.",
      "Write down your thoughts in a journal.",
    ];
  }
}