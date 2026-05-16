// Battle sound effects using Web Audio API
// Includes type-specific attack sounds, critical hit, super effective, and background music

type PokemonType =
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy"
  | "normal";

interface SoundConfig {
  frequency: number;
  type: OscillatorType;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  modulation?: { frequency: number; depth: number };
  harmonics?: number[];
}

// Type-specific attack sounds
const TYPE_ATTACK_SOUNDS: Record<PokemonType, SoundConfig> = {
  fire: {
    frequency: 200,
    type: "sawtooth",
    attack: 0.01,
    decay: 0.15,
    sustain: 0.2,
    release: 0.3,
    filterFreq: 2500,
    filterType: "lowpass",
    modulation: { frequency: 20, depth: 80 },
  },
  water: {
    frequency: 300,
    type: "sine",
    attack: 0.05,
    decay: 0.2,
    sustain: 0.3,
    release: 0.4,
    filterFreq: 1200,
    filterType: "lowpass",
    modulation: { frequency: 8, depth: 50 },
  },
  electric: {
    frequency: 600,
    type: "square",
    attack: 0.001,
    decay: 0.05,
    sustain: 0.1,
    release: 0.15,
    filterFreq: 5000,
    filterType: "highpass",
    modulation: { frequency: 80, depth: 200 },
  },
  grass: {
    frequency: 400,
    type: "triangle",
    attack: 0.08,
    decay: 0.15,
    sustain: 0.4,
    release: 0.3,
    filterFreq: 1500,
    filterType: "lowpass",
  },
  ice: {
    frequency: 1000,
    type: "sine",
    attack: 0.02,
    decay: 0.25,
    sustain: 0.15,
    release: 0.5,
    filterFreq: 4000,
    filterType: "highpass",
    harmonics: [1, 1.5, 2, 2.5],
  },
  fighting: {
    frequency: 120,
    type: "sawtooth",
    attack: 0.001,
    decay: 0.08,
    sustain: 0.05,
    release: 0.1,
    filterFreq: 600,
    filterType: "lowpass",
  },
  poison: {
    frequency: 150,
    type: "sawtooth",
    attack: 0.1,
    decay: 0.3,
    sustain: 0.4,
    release: 0.5,
    filterFreq: 500,
    filterType: "lowpass",
    modulation: { frequency: 4, depth: 30 },
  },
  ground: {
    frequency: 60,
    type: "triangle",
    attack: 0.01,
    decay: 0.3,
    sustain: 0.15,
    release: 0.4,
    filterFreq: 300,
    filterType: "lowpass",
  },
  flying: {
    frequency: 500,
    type: "sine",
    attack: 0.1,
    decay: 0.15,
    sustain: 0.35,
    release: 0.4,
    filterFreq: 2000,
    filterType: "bandpass",
    modulation: { frequency: 12, depth: 60 },
  },
  psychic: {
    frequency: 600,
    type: "sine",
    attack: 0.15,
    decay: 0.3,
    sustain: 0.5,
    release: 0.6,
    filterFreq: 3000,
    filterType: "bandpass",
    harmonics: [1, 1.25, 1.5, 2],
    modulation: { frequency: 6, depth: 40 },
  },
  bug: {
    frequency: 400,
    type: "square",
    attack: 0.01,
    decay: 0.03,
    sustain: 0.08,
    release: 0.1,
    filterFreq: 3500,
    filterType: "highpass",
    modulation: { frequency: 40, depth: 100 },
  },
  rock: {
    frequency: 80,
    type: "sawtooth",
    attack: 0.001,
    decay: 0.15,
    sustain: 0.08,
    release: 0.2,
    filterFreq: 400,
    filterType: "lowpass",
  },
  ghost: {
    frequency: 200,
    type: "sine",
    attack: 0.25,
    decay: 0.4,
    sustain: 0.5,
    release: 1,
    filterFreq: 600,
    filterType: "lowpass",
    modulation: { frequency: 3, depth: 50 },
    harmonics: [1, 1.5, 2, 3],
  },
  dragon: {
    frequency: 100,
    type: "sawtooth",
    attack: 0.05,
    decay: 0.2,
    sustain: 0.35,
    release: 0.4,
    filterFreq: 1200,
    filterType: "lowpass",
    modulation: { frequency: 8, depth: 60 },
  },
  dark: {
    frequency: 80,
    type: "sawtooth",
    attack: 0.15,
    decay: 0.35,
    sustain: 0.25,
    release: 0.5,
    filterFreq: 250,
    filterType: "lowpass",
  },
  steel: {
    frequency: 800,
    type: "square",
    attack: 0.001,
    decay: 0.08,
    sustain: 0.15,
    release: 0.3,
    filterFreq: 5000,
    filterType: "highpass",
    harmonics: [1, 2, 3, 4, 5],
  },
  fairy: {
    frequency: 700,
    type: "sine",
    attack: 0.05,
    decay: 0.15,
    sustain: 0.45,
    release: 0.35,
    filterFreq: 3500,
    filterType: "highpass",
    harmonics: [1, 1.25, 1.5],
    modulation: { frequency: 15, depth: 30 },
  },
  normal: {
    frequency: 250,
    type: "triangle",
    attack: 0.02,
    decay: 0.1,
    sustain: 0.2,
    release: 0.2,
    filterFreq: 800,
    filterType: "lowpass",
  },
};

let audioContext: AudioContext | null = null;
let battleMusicOscillators: OscillatorNode[] = [];
let battleMusicGain: GainNode | null = null;
let isMusicPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Play type-specific attack sound
export function playAttackSound(type: string, volume: number = 0.25): void {
  const normalizedType = type.toLowerCase() as PokemonType;
  const config = TYPE_ATTACK_SOUNDS[normalizedType] || TYPE_ATTACK_SOUNDS.normal;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = config.attack + config.decay + config.sustain + config.release;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = volume;

    const filter = ctx.createBiquadFilter();
    filter.type = config.filterType || "lowpass";
    filter.frequency.value = config.filterFreq || 1000;
    filter.connect(masterGain);

    const harmonics = config.harmonics || [1];

    harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = config.type;
      osc.frequency.value = config.frequency * harmonic;

      if (config.modulation) {
        const modOsc = ctx.createOscillator();
        const modGain = ctx.createGain();
        modOsc.frequency.value = config.modulation.frequency;
        modGain.gain.value = config.modulation.depth;
        modOsc.connect(modGain);
        modGain.connect(osc.frequency);
        modOsc.start(now);
        modOsc.stop(now + duration);
      }

      const peakGain = volume / harmonics.length / (index + 1);
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(peakGain, now + config.attack);
      oscGain.gain.linearRampToValueAtTime(peakGain * 0.7, now + config.attack + config.decay);
      oscGain.gain.setValueAtTime(
        peakGain * 0.7,
        now + config.attack + config.decay + config.sustain,
      );
      oscGain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(now);
      osc.stop(now + duration);
    });
  } catch (error) {
    console.warn("Failed to play attack sound:", error);
  }
}

// Critical hit sound - sharp impact
export function playCriticalHitSound(volume: number = 0.35): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = volume;

    // High-pitched impact
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Low thump
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(150, now);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    gain2.gain.setValueAtTime(volume * 1.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 0.15);

    // Noise burst
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 2000;
    noiseGain.gain.setValueAtTime(volume * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(now);
  } catch (error) {
    console.warn("Failed to play critical hit sound:", error);
  }
}

// Super effective sound - powerful resonance
export function playSuperEffectiveSound(volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = volume;

    // Rising chord
    const frequencies = [400, 500, 600, 800];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 0.8, now + i * 0.03);
      osc.frequency.linearRampToValueAtTime(freq, now + i * 0.03 + 0.1);
      gain.gain.setValueAtTime(0, now + i * 0.03);
      gain.gain.linearRampToValueAtTime(volume / frequencies.length, now + i * 0.03 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + i * 0.03);
      osc.stop(now + 0.5);
    });

    // Shimmer effect
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "sine";
    shimmer.frequency.value = 1200;
    const shimmerMod = ctx.createOscillator();
    shimmerMod.frequency.value = 25;
    const shimmerModGain = ctx.createGain();
    shimmerModGain.gain.value = 100;
    shimmerMod.connect(shimmerModGain);
    shimmerModGain.connect(shimmer.frequency);
    shimmerGain.gain.setValueAtTime(0, now + 0.1);
    shimmerGain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.15);
    shimmerGain.gain.linearRampToValueAtTime(0, now + 0.5);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmerMod.start(now);
    shimmer.start(now + 0.1);
    shimmerMod.stop(now + 0.5);
    shimmer.stop(now + 0.5);
  } catch (error) {
    console.warn("Failed to play super effective sound:", error);
  }
}

// Not very effective sound - muted thud
export function playNotEffectiveSound(volume: number = 0.2): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    filter.type = "lowpass";
    filter.frequency.value = 300;

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (error) {
    console.warn("Failed to play not effective sound:", error);
  }
}

// Victory fanfare
export function playVictorySound(volume: number = 0.25): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = volume;

    // Victory melody notes (C major arpeggio)
    const notes = [
      { freq: 523, start: 0, dur: 0.15 },
      { freq: 659, start: 0.12, dur: 0.15 },
      { freq: 784, start: 0.24, dur: 0.15 },
      { freq: 1047, start: 0.36, dur: 0.4 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(volume, now + start + 0.02);
      gain.gain.setValueAtTime(volume, now + start + dur - 0.05);
      gain.gain.linearRampToValueAtTime(0, now + start + dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (error) {
    console.warn("Failed to play victory sound:", error);
  }
}

// Defeat sound
export function playDefeatSound(volume: number = 0.2): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = volume;

    // Descending sad notes
    const notes = [
      { freq: 392, start: 0, dur: 0.25 },
      { freq: 349, start: 0.2, dur: 0.25 },
      { freq: 294, start: 0.4, dur: 0.4 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(volume * 0.6, now + start + 0.03);
      gain.gain.setValueAtTime(volume * 0.6, now + start + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + start + dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (error) {
    console.warn("Failed to play defeat sound:", error);
  }
}

// Start battle background music
export function startBattleMusic(volume: number = 0.08): void {
  if (isMusicPlaying) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    battleMusicGain = ctx.createGain();
    battleMusicGain.connect(ctx.destination);
    battleMusicGain.gain.value = volume;

    // Bass line pattern
    const bassNotes = [110, 110, 130.81, 130.81, 146.83, 146.83, 130.81, 130.81];
    const beatDuration = 0.25;

    const playBassPattern = () => {
      if (!isMusicPlaying) return;

      const ctx = getAudioContext();
      const now = ctx.currentTime;

      bassNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * beatDuration);
        gain.gain.linearRampToValueAtTime(volume * 0.6, now + i * beatDuration + 0.02);
        gain.gain.setValueAtTime(volume * 0.6, now + i * beatDuration + beatDuration * 0.8);
        gain.gain.linearRampToValueAtTime(0, now + i * beatDuration + beatDuration);
        osc.connect(gain);
        if (battleMusicGain) gain.connect(battleMusicGain);
        osc.start(now + i * beatDuration);
        osc.stop(now + (i + 1) * beatDuration);
        battleMusicOscillators.push(osc);
      });

      // Schedule next pattern
      setTimeout(playBassPattern, bassNotes.length * beatDuration * 1000);
    };

    // Drums pattern
    const playDrumPattern = () => {
      if (!isMusicPlaying) return;

      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Kick drum
      [0, 2, 4, 6].forEach((beat) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, now + beat * beatDuration);
        osc.frequency.exponentialRampToValueAtTime(40, now + beat * beatDuration + 0.1);
        gain.gain.setValueAtTime(volume * 0.8, now + beat * beatDuration);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beat * beatDuration + 0.15);
        osc.connect(gain);
        if (battleMusicGain) gain.connect(battleMusicGain);
        osc.start(now + beat * beatDuration);
        osc.stop(now + beat * beatDuration + 0.2);
        battleMusicOscillators.push(osc);
      });

      // Hi-hat (noise burst)
      [1, 3, 5, 7].forEach((beat) => {
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 8000;
        gain.gain.setValueAtTime(volume * 0.3, now + beat * beatDuration);
        gain.gain.exponentialRampToValueAtTime(0.001, now + beat * beatDuration + 0.05);
        noise.connect(filter);
        filter.connect(gain);
        if (battleMusicGain) gain.connect(battleMusicGain);
        noise.start(now + beat * beatDuration);
      });

      setTimeout(playDrumPattern, 8 * beatDuration * 1000);
    };

    isMusicPlaying = true;
    playBassPattern();
    playDrumPattern();
  } catch (error) {
    console.warn("Failed to start battle music:", error);
  }
}

// Stop battle music
export function stopBattleMusic(): void {
  isMusicPlaying = false;
  battleMusicOscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch (e) {
      // Already stopped
    }
  });
  battleMusicOscillators = [];
  battleMusicGain = null;
}

// Hook for React components
import { useState, useCallback, useEffect } from "react";

export function useBattleSounds() {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem("battle-sounds-muted");
    return saved === "true";
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem("battle-music-enabled");
    return saved !== "false"; // Default to true
  });

  const playAttack = useCallback(
    (type: string) => {
      if (!isMuted) playAttackSound(type);
    },
    [isMuted],
  );

  const playCritical = useCallback(() => {
    if (!isMuted) playCriticalHitSound();
  }, [isMuted]);

  const playSuperEffective = useCallback(() => {
    if (!isMuted) playSuperEffectiveSound();
  }, [isMuted]);

  const playNotEffective = useCallback(() => {
    if (!isMuted) playNotEffectiveSound();
  }, [isMuted]);

  const playVictory = useCallback(() => {
    if (!isMuted) playVictorySound();
  }, [isMuted]);

  const playDefeat = useCallback(() => {
    if (!isMuted) playDefeatSound();
  }, [isMuted]);

  const startMusic = useCallback(() => {
    if (!isMuted && musicEnabled) startBattleMusic();
  }, [isMuted, musicEnabled]);

  const stopMusic = useCallback(() => {
    stopBattleMusic();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem("battle-sounds-muted", String(newValue));
      if (newValue) stopBattleMusic();
      return newValue;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem("battle-music-enabled", String(newValue));
      if (!newValue) stopBattleMusic();
      return newValue;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBattleMusic();
    };
  }, []);

  return {
    playAttack,
    playCritical,
    playSuperEffective,
    playNotEffective,
    playVictory,
    playDefeat,
    startMusic,
    stopMusic,
    isMuted,
    musicEnabled,
    toggleMute,
    toggleMusic,
  };
}
