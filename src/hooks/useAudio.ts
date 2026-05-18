import { useEffect, useRef, useCallback } from 'react';

// Common arcade sound effects
const SOUNDS = {
  navigate: '/sounds/navigate.wav',
  select: '/sounds/select.wav',
  back: '/sounds/back.wav',
  coin: '/sounds/coin.wav',
  start: '/sounds/start.wav',
  error: '/sounds/error.wav',
};

export function useAudio() {
  const audioContext = useRef<AudioContext | null>(null);
  const soundBuffers = useRef<Map<string, AudioBuffer>>(new Map());
  const bgmAudio = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Audio API and pre-load sounds
  useEffect(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContext.current = new AudioContextClass();
        
        // Pre-load common sounds silently (so they're ready)
        // If they don't exist in the project, they will just fail silently
        Object.entries(SOUNDS).forEach(([key, url]) => {
          fetch(url)
            .then(response => response.arrayBuffer())
            .then(buffer => audioContext.current?.decodeAudioData(buffer))
            .then(decoded => {
              if (decoded) soundBuffers.current.set(key, decoded);
            })
            .catch(() => {
              // Ignore missing audio files during development
            });
        });
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }

    // Setup BGM
    bgmAudio.current = new Audio("/sounds/bgm.mp3");
    bgmAudio.current.loop = true;
    bgmAudio.current.volume = 0.3; // Default volume 30%

    return () => {
      if (audioContext.current?.state !== 'closed') {
        audioContext.current?.close();
      }
      if (bgmAudio.current) {
        bgmAudio.current.pause();
        bgmAudio.current = null;
      }
    };
  }, []);

  const playSound = useCallback((soundKey: keyof typeof SOUNDS) => {
    if (!audioContext.current || audioContext.current.state === 'suspended') {
      audioContext.current?.resume().catch(() => {});
    }
    
    const buffer = soundBuffers.current.get(soundKey);
    if (buffer && audioContext.current) {
      const source = audioContext.current.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = audioContext.current.createGain();
      gainNode.gain.value = 0.8; // SFX volume
      
      source.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      source.start(0);
    }
  }, []);

  const playBGM = useCallback(() => {
    if (bgmAudio.current && bgmAudio.current.paused) {
      bgmAudio.current.play().catch(() => {
        // Autoplay may be blocked by browser until user interacts
      });
    }
  }, []);

  const stopBGM = useCallback(() => {
    if (bgmAudio.current && !bgmAudio.current.paused) {
      bgmAudio.current.pause();
    }
  }, []);

  const setBGMVolume = useCallback((volume: number) => {
    if (bgmAudio.current) {
      bgmAudio.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return {
    playSound,
    playBGM,
    stopBGM,
    setBGMVolume,
  };
}
