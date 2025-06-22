import React, { useContext, useState, useEffect } from 'react';
import { SpoonContext } from './SpoonContext';

const MAX_SPOONS = 12;

export default function SpoonTracker() {
  const { spoonCount, setSpoonCount } = useContext(SpoonContext);
  const [lastCount, setLastCount] = useState(spoonCount);

  useEffect(() => {
    if (spoonCount !== lastCount) {
      let response;
      if (spoonCount === 12) {
        response = "Noting your reserves, Miss. Twelve spoons today—ambitious, but I admire the spirit.";
      } else if (spoonCount === 0) {
        response = "All spoons accounted for, Miss. Let’s take it very slow today.";
      } else {
        response = `Got it, Miss. You have ${spoonCount} spoon${spoonCount > 1 ? 's' : ''} to use today.`;
      }

      // Replace this with ElevenLabs speak() or chat feed if desired
      console.log('[Jameson]', response);

      setLastCount(spoonCount);
    }
  }, [spoonCount, lastCount]);

  const handleClick = (count) => {
    setSpoonCount(count);
  };

  return (
    <div
      className="spoon-tracker"
      role="region"
      aria-label="Spoon Tracker"
    >
      {[...Array(MAX_SPOONS)].map((_, i) => {
        const spoonNumber = i + 1;
        const filled = spoonNumber <= spoonCount;
        return (
          <svg
            key={spoonNumber}
            onClick={() => handleClick(spoonNumber)}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={filled ? 'var(--gold-deep)' : 'none'}
            stroke="var(--gold-deep)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="spoon-icon"
            role="button"
            aria-pressed={filled}
            aria-label={`Set spoon count to ${spoonNumber}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClick(spoonNumber);
              }
            }}
          >
            <path d="M12 2a2 2 0 0 0-2 2v8a4 4 0 0 0 4 4h4a2 2 0 0 0 0-4h-3V4a2 2 0 0 0-2-2z" />
          </svg>
        );
      })}
    </div>
  );
}
