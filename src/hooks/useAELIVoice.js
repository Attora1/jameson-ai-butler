import { useEffect, useRef } from 'react';

function hashString(str) {
  let hash = 0, i, chr;
  if (!str) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

export default function useAELIVoice(text, settings, poweredDown = false) {
  const audioRef = useRef(null);
  const lastHashRef = useRef(null);

  useEffect(() => {
    if (poweredDown) {
      console.log("🔇 AELI is powered down. Skipping voice.");
      return;
    }
    
    if (!text || typeof text !== 'string') return;
    if (!settings?.voiceEnabled) return;

    const cleaned = text.trim();
    const hash = hashString(cleaned);

    // 🚫 Block if same as last hash
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    console.log("🔊 Speaking:", cleaned);

    const processedText = cleaned.replace(/AELI/gi, "ay-lee");

    const speak = async () => {
      try {
        const response = await fetch('/.netlify/functions/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: processedText,
            voiceID: 'onwK4e9ZLuTAKqWW03F9'
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('TTS Error:', errorText);
          return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
      } catch (error) {
        console.error('ElevenLabs TTS failed:', error);
      }
    };

    speak();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [text, settings?.voiceEnabled, poweredDown]);
}


// Standalone `say` function
let audioRef = null;
let lastHash = null;

export async function say(text, settings, poweredDown = false) {
  if (poweredDown) {
    console.log("🔇 AELI is powered down. Skipping voice.");
    return;
  }
  
  if (!text || typeof text !== 'string') return;
  if (!settings?.voiceEnabled) return;

  const cleaned = text.trim();
  const hash = hashString(cleaned);

  // 🚫 Block if same as last hash
  if (hash === lastHash) return;
  lastHash = hash;

  console.log("🔊 Speaking:", cleaned);

  const processedText = cleaned.replace(/AELI/gi, "ay-lee");

  try {
    const response = await fetch('/.netlify/functions/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: processedText,
        voiceID: 'onwK4e9ZLuTAKqWW03F9'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS Error:', errorText);
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    if (audioRef) {
      audioRef.pause();
      audioRef.src = "";
    }

    const audio = new Audio(audioUrl);
    audioRef = audio;
    audio.play();
  } catch (error) {
    console.error('ElevenLabs TTS failed:', error);
  }
}