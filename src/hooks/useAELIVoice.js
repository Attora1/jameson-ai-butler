// src/hooks/useAELIVoice.js

import { useEffect } from 'react';

export default function useAELIVoice(text, settings) {
    useEffect(() => {
        console.log("✅ useAELIVoice triggered with text:", text);
        console.log("✅ Voice Enabled:", settings?.voiceEnabled);
        console.log("✅ Mode:", settings?.mode);

        if (!text || typeof text !== 'string') return;
        if (!settings?.voiceEnabled) return;

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
                            text: text,
                            voice_settings: {
                                stability: 0.3,
                                similarity_boost: 0.75
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
                const audio = new Audio(audioUrl);
                audio.play();
            } catch (error) {
                console.error('Error using ElevenLabs TTS:', error);
            }
        };

        speak();
    }, [text, settings?.voiceEnabled]);
}
