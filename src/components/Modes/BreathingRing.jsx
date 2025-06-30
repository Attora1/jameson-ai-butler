import React, { useState, useEffect, useContext } from 'react';
import '../../styles/modes-css/LowSpoon.css';
import petalImage from '../../assets/petal-flower.png';
import { SpoonContext } from '../../context/SpoonContext.jsx';

export default function BreathingRing({ running }) {
  const [phase, setPhase] = useState('exhale');
  const { spoonCount, setSpoonCount } = useContext(SpoonContext);

  useEffect(() => {
    if (!running) return;
    let isFirst = true;
    let delay = 8000;

    const switchPhase = () => {
      setPhase(prev => (prev === 'inhale' ? 'exhale' : 'inhale'));
      isFirst = false;
    };

    const initial = setTimeout(switchPhase, isFirst ? 50 : delay);
    const interval = setInterval(switchPhase, delay);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [running]);

  const handleFlowerClick = () => {
    if (running) return;
    const updatedSpoons = spoonCount >= 12 ? 0 : spoonCount + 1;
    setSpoonCount(updatedSpoons);
    console.log(`🌸 Flower clicked. Spoons updated to: ${updatedSpoons}`);
    // Gemini fetch removed here to prevent 429; handled with debounce in LowSpoon instead
  };

  return (
    <div className={`breathing-ring-wrapper ${phase}`}>
      <img
        src={petalImage}
        alt="Breathing flower"
        className={`breathing-petal-image animate-spin-drag ${phase}`}
        onClick={handleFlowerClick}
        style={{ cursor: running ? 'default' : 'pointer' }}
        title={running ? '' : 'Tap to adjust your spoons'}
      />
    </div>
  );
}
