import React, { useState, useRef, useEffect } from 'react';

const FOCUS_PLAYLIST_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export default function MusicToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(prev => !prev);

  return (
    <div className="music-toggle">
      <button onClick={togglePlay} aria-pressed={isPlaying} aria-label={isPlaying ? "Pause music" : "Play music"}>
        {isPlaying ? "⏸ Pause Music" : "▶️ Play Music"}
      </button>
      <audio ref={audioRef} loop src={FOCUS_PLAYLIST_URL} />
    </div>
  );
}
