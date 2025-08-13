import React, { useRef, useEffect, useState, useMemo } from 'react';
import '../../styles/modes-css/tether.css';
import { HeartShape, SpiralShape, FlowerShape } from '../../utils/tetherShapes.jsx';

export default function TetherCanvas({ onComplete }) {
  const canvasRef = useRef(null);
  const chimeAudio = useRef(null);
  const tetherAudio = useRef(null);
  const [playerMode, setPlayerMode] = useState('single');
  const [isComplete, setIsComplete] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [orbsCollected, setOrbsCollected] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [shapeIndex, setShapeIndex] = useState(() => {
    const saved = localStorage.getItem('tetherShapeIndex');
    return saved ? parseInt(saved) : 0;
  });

  const shapes = [<HeartShape />, <FlowerShape />, <SpiralShape />];

  const levelSettings = useMemo(() => [
    { orbs: 8, speed: 1, moving: false },
    { orbs: 12, speed: 1.3, moving: true },
    { orbs: 16, speed: 1.6, moving: true }
  ], []);

  const player1 = useRef({ x: 100, y: 100, size: 6, trail: [], glow: false });
  const player2 = useRef({ x: 300, y: 100, size: 6, trail: [], glow: false });
  const keysPressed = useRef({});

  useEffect(() => {
    tetherAudio.current = new Audio('/sounds/tether-breeze.mp3');
    tetherAudio.current.loop = true;
    tetherAudio.current.volume = 0.4;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth * 0.8; // 80% of window width
      canvas.height = window.innerHeight * 0.6; // 60% of window height
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const { orbs: orbCount, speed, moving } = levelSettings[shapeIndex];
    const orbs = Array.from({ length: orbCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 8,
      color: ['#f7cf88', '#f7cac9', '#dcbbf2'][Math.floor(Math.random() * 3)],
      collected: false,
      speed: moving ? speed * (0.5 + Math.random()) : 0
    }));

    const checkOrbCollision = (player) => {
      for (let orb of orbs) {
        if (!orb.collected && Math.hypot(orb.x - player.x, orb.y - player.y) < orb.r + player.size) {
          orb.collected = true;
          player.glow = true;
          setTimeout(() => { player.glow = false; }, 500);
          setOrbsCollected(prev => {
            const updated = prev + 1;
            if (updated >= orbs.length && !isComplete) startFusion();
            return updated;
          });
        }
      }
    };

    const spiralInward = (player, progress, offset = 0) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const angle = progress * 12 + offset;
      const radius = (1 - progress) * 120;
      player.x = centerX + radius * Math.cos(angle);
      player.y = centerY + radius * Math.sin(angle);
      player.size = 6 + 3 * progress;
      player.glow = true;
    };

    let fusionStartTime = null;

    const draw = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach(orb => {
        if (!orb.collected) {
          if (moving) {
            orb.y += orb.speed;
            if (orb.y > canvas.height) orb.y = -orb.r;
          }
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
          ctx.fillStyle = orb.color;
          ctx.shadowBlur = 15;
          ctx.shadowColor = orb.color;
          ctx.fill();
        }
      });

      const drawPlayer = (player) => {
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 35) player.trail.shift();
        player.trail.forEach((point, i) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, player.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(217, 167, 158, ${i / player.trail.length})`;
          ctx.shadowBlur = player.glow ? 30 : 6;
          ctx.shadowColor = player.glow ? '#fff4e6' : '#D9A79E';
          ctx.fill();
        });
      };

      if (isFusing) {
        if (!fusionStartTime) fusionStartTime = time;
        const progress = Math.min((time - fusionStartTime) / 3000, 1);
        spiralInward(player1.current, progress, 0);
        if (playerMode === 'dual') spiralInward(player2.current, progress, Math.PI);
        if (progress === 1) {
          player1.current.glow = false;
          player2.current.glow = false;
          setIsFusing(false);
          setIsComplete(true);
          const nextIndex = (shapeIndex + 1) % shapes.length;
          setShapeIndex(nextIndex);
          localStorage.setItem('tetherShapeIndex', nextIndex);
        }
      } else {
        const speed = 3;
        if (keysPressed.current['ArrowUp']) player1.current.y -= speed;
        if (keysPressed.current['ArrowDown']) player1.current.y += speed;
        if (keysPressed.current['ArrowLeft']) player1.current.x -= speed;
        if (keysPressed.current['ArrowRight']) player1.current.x += speed;
        checkOrbCollision(player1.current);

        if (playerMode === 'dual') {
          if (keysPressed.current['w']) player2.current.y -= speed;
          if (keysPressed.current['s']) player2.current.y += speed;
          if (keysPressed.current['a']) player2.current.x -= speed;
          if (keysPressed.current['d']) player2.current.x += speed;
          checkOrbCollision(player2.current);
        }
      }

      drawPlayer(player1.current);
      if (playerMode === 'dual') drawPlayer(player2.current);

      animationFrameId = requestAnimationFrame(draw);
    };
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [playerMode, isFusing, shapeIndex, levelSettings, isComplete, shapes.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault(); // Prevent default scroll behavior
      }
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startFusion = () => {
    setIsFusing(true);
    tetherAudio.current?.pause();
    chimeAudio.current = new Audio('/sounds/chime.mp3');
    chimeAudio.current.play().catch(() => {});
  };

  const handleStart = (mode) => {
    setPlayerMode(mode);
    setShowIntro(false);
    setIsComplete(false);
    setOrbsCollected(0);
    player1.current.trail = [];
    player2.current.trail = [];
    tetherAudio.current?.play().catch(() => {});
  };

  const handleReflectionSave = () => {
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 1500);
    setShowReflection(false);
    tetherAudio.current?.play().catch(() => {});
  };

  const handleReflectionCancel = () => {
    setShowReflection(false);
    tetherAudio.current?.play().catch(() => {});
  };

  const handleReturn = () => {
    tetherAudio.current?.pause();
    onComplete?.();
  };

  return (
    <div className="tether-canvas-wrapper">
      <canvas ref={canvasRef} className="tether-canvas" />
      <button onClick={handleReturn} className="close-button">✖</button>

      {showIntro && (
        <div className="tether-modal show fade-slide">
          <div className="tether-modal-content">
            <h3>✨ Tether Together ✨</h3>
            <p>Guide your lines to collect glowing orbs together.</p>
            <p>Player 1 | Arrow Keys</p> <p>Player 2 | WASD</p>
            <div className="tether-modal-buttons centered">
              <button onClick={() => handleStart('single')}>Single Player</button>
              <button onClick={() => handleStart('dual')}>Two Players</button>
            </div>
            <div className="tether-modal-buttons centered">
              <button onClick={handleReturn}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {isComplete && !showReflection && (
        <div className="tether-modal show fade-slide">
          <div className="tether-modal-content">
            <p>✨ You've Tethered! Take a breath here together. ✨</p>
            <div className="tether-shape-display">{shapes[shapeIndex]}</div>
            <div className="tether-modal-buttons centered">
              <button onClick={handleReturn}>Partner Support</button>
              <button onClick={() => setShowReflection(true)}>Reflect</button>
            </div>
          </div>
        </div>
      )}

      {showReflection && (
        <div className="tether-modal show fade-slide">
          <div className="tether-modal-content">
            <h3>Reflection</h3>
            <p>What did you notice during this moment together?</p>
            <textarea
              className="reflection-textarea"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Write a short reflection..."
            />
            <div className="tether-modal-buttons centered">
              <button onClick={handleReflectionSave}>Save Reflection</button>
              <button onClick={handleReflectionCancel}>Don't Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
