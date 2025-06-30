// src/hooks/useAELIVoice.js

import { useEffect, useRef } from 'react';

export default function useAELIVoice(text, settings) {
    const audioRef = useRef(null);

    useEffect(() => {
        console.log("✅ useAELIVoice triggered with text:", text);
        console.log("✅ Voice Enabled:", settings?.voiceEnabled);
        console.log("✅ Mode:", settings?.mode);

        if (!text || typeof text !== 'string') return;
        if (!settings?.voiceEnabled) return;

        // Pronunciation correction for "AELI"
        const processedText = text.replace(/AELI/gi, "ay-lee");

        const speak = async () => {
            try {
                const response = await fetch(
                    'https://api.elevenlabs.io/v1/text-to-speech/onwK4e9ZLuTAKqWW03F9/stream',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY
                        },
                        body: JSON.stringify({
                            text: processedText,
                            voice_settings: {
                                stability: 0.2,         // less robotic
                                similarity_boost: 0.8,  // more natural
                                style: 0.2,             // softer intonation
                                speed: 1.1              // slightly faster
                            }
                        })
                    }
                );

                if (!response.ok) {
                    console.error('ElevenLabs TTS failed:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Error details:', errorText);
                    return;
                }

                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);

                // 🚫 Stop previous playback before playing the new one
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                }

                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                audio.play();
            } catch (error) {
                console.error('Error using ElevenLabs TTS:', error);
            }
        };

        speak();

        return () => {
            // Cleanup to prevent echo on unmount or re-trigger
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, [text, settings?.voiceEnabled]);
}
