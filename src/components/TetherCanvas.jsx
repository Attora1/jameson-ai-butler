import React, { useRef, useEffect, useState } from 'react';
import '../styles/modes-css/tether.css';

export default function TetherCanvas({ onComplete }) {
  const canvasRef = useRef(null);
  const orbsRef = useRef([]);
  const [isComplete, setIsComplete] = useState(false);
  const [orbsCollected, setOrbsCollected] = useState(0);
  const targetOrbs = 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    orbsRef.current = [];
    for (let i = 0; i < 20; i++) {
      orbsRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 5 + Math.random() * 5,
        color: ['#F2E1B8', '#F8D9C0', '#D6C6DC'][Math.floor(Math.random() * 3)],
        collected: false,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbsRef.current.forEach((orb) => {
        if (!orb.collected) {
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
          ctx.fillStyle = orb.color;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let orb of orbsRef.current) {
      if (!orb.collected && Math.hypot(orb.x - x, orb.y - y) < orb.r + 10) {
        orb.collected = true;
        setOrbsCollected((prev) => prev + 1);
        break;
      }
    }

    if (orbsCollected + 1 >= targetOrbs) {
      setIsComplete(true);
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="tether-canvas-wrapper">
      <canvas ref={canvasRef} className="tether-canvas" onClick={handleClick}></canvas>
      {isComplete && (
        <div className="tether-modal show">
          <div className="tether-modal-content">
            <p>✨ You’ve Tethered. Take a breath here together. ✨</p>
            <button onClick={onComplete}>Return to Partner Mode</button>
          </div>
        </div>
      )}
    </div>
  );
}
