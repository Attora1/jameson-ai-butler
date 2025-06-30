import React, { useState, useRef, useEffect } from 'react';

// Changed to a different royalty-free music track
const FOCUS_PLAYLIST_URL = "./public/sounds/AELI Meditation.mp3";

export default function MusicToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Audio playback failed:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(prev => !prev);

  return (
    <div className="music-toggle">
      <button onClick={togglePlay} aria-pressed={isPlaying} aria-label={isPlaying ? "Pause music" : "Play music"}>
        {isPlaying ? "⏸ Pause Music" : "▶️ Play Focus Music"}
      </button>
      <audio ref={audioRef} loop src={FOCUS_PLAYLIST_URL} />
    </div>
  );
}