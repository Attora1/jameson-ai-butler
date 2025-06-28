import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export const useAELIVoice = () => {
  const [state, setState] = useState({
    isSpeaking: false,
    loading: false,
    error: null
  });
  
  const audioRef = useRef(null);
  const abortController = useRef(new AbortController());
  const [audioContext, setAudioContext] = useState(null);

  const VOICE_OPTIONS = {
    DANIEL: 'onwK4e9ZLuTAKqWW03F9',
    GEORGE: '21m00Tcm4TlvDq8ikWAM',
  };

  // Initialize audio context on user interaction
  useEffect(() => {
    const initOnClick = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(ctx);
        document.removeEventListener('click', initOnClick);
      }
    };
    
    document.addEventListener('click', initOnClick);
    return () => document.removeEventListener('click', initOnClick);
  }, [audioContext]);

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  };

  const speak = async (text, voiceId = VOICE_OPTIONS.GEORGE) => {
    cleanupAudio();
    abortController.current.abort();
    abortController.current = new AbortController();

    setState({ isSpeaking: false, loading: true, error: null });

    try {
      // Get audio blob from server
      const response = await axios.post(
        process.env.VITE_VOICE_ENDPOINT, 
        {
          text: text.slice(0, 2000),
          voiceID: voiceId
        },
        {
          responseType: 'blob',
          signal: abortController.current.signal,
          timeout: 15000
        }
      );

      // Verify audio content
      if (!data.type.startsWith('audio/')) {
        throw new Error('Invalid audio response format');
      }

      // Create audio element
      const audio = new Audio(URL.createObjectURL(data));
      audioRef.current = audio;

      // Playback handlers
      audio.onended = () => {
        cleanupAudio();
        setState(s => ({ ...s, isSpeaking: false }));
      };

      audio.onerror = () => {
        setState(s => ({
          ...s,
          error: 'Audio playback failed - try enabling browser permissions',
          isSpeaking: false
        }));
      };

      // Resume audio context if suspended
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Start playback
      await audio.play();
      setState({ isSpeaking: true, loading: false, error: null });

    } catch (error) {
      cleanupAudio();
      setState(s => ({
        isSpeaking: false,
        loading: false,
        error: axios.isCancel(error) 
          ? 'Request cancelled' 
          : error.message.includes('Network') 
            ? 'Network error - check connection'
            : 'Voice system unavailable'
      }));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortController.current.abort();
      cleanupAudio();
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  return {
    ...state,
    speak,
    cancel: () => {
      abortController.current.abort();
      cleanupAudio();
      setState(s => ({ ...s, isSpeaking: false, loading: false }));
    },
    VOICE_OPTIONS,
    hasAudioSupport: !!window.AudioContext || !!window.webkitAudioContext
  };
};