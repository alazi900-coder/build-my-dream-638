// Type-specific sound generator using Web Audio API
// Each type has a unique sound signature

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
  modulation?: {
    frequency: number;
    depth: number;
  };
  harmonics?: number[];
}

const TYPE_SOUNDS: Record<PokemonType, SoundConfig> = {
  fire: {
    frequency: 200,
    type: "sawtooth",
    attack: 0.01,
    decay: 0.1,
    sustain: 0.3,
    release: 0.3,
    filterFreq: 2000,
    filterType: "lowpass",
    modulation: { frequency: 15, depth: 50 },
  },
  water: {
    frequency: 400,
    type: "sine",
    attack: 0.05,
    decay: 0.2,
    sustain: 0.4,
    release: 0.4,
    filterFreq: 1500,
    filterType: "lowpass",
    modulation: { frequency: 6, depth: 30 },
  },
  electric: {
    frequency: 800,
    type: "square",
    attack: 0.001,
    decay: 0.05,
    sustain: 0.2,
    release: 0.1,
    filterFreq: 4000,
    filterType: "highpass",
    modulation: { frequency: 50, depth: 100 },
  },
  grass: {
    frequency: 350,
    type: "triangle",
    attack: 0.1,
    decay: 0.15,
    sustain: 0.5,
    release: 0.3,
    filterFreq: 1200,
    filterType: "lowpass",
  },
  ice: {
    frequency: 1200,
    type: "sine",
    attack: 0.02,
    decay: 0.3,
    sustain: 0.2,
    release: 0.5,
    filterFreq: 3000,
    filterType: "highpass",
    harmonics: [1, 1.5, 2],
  },
  fighting: {
    frequency: 150,
    type: "sawtooth",
    attack: 0.001,
    decay: 0.1,
    sustain: 0.1,
    release: 0.1,
    filterFreq: 800,
    filterType: "lowpass",
  },
  poison: {
    frequency: 180,
    type: "sawtooth",
    attack: 0.05,
    decay: 0.2,
    sustain: 0.3,
    release: 0.4,
    filterFreq: 600,
    filterType: "lowpass",
    modulation: { frequency: 3, depth: 20 },
  },
  ground: {
    frequency: 80,
    type: "triangle",
    attack: 0.02,
    decay: 0.3,
    sustain: 0.2,
    release: 0.3,
    filterFreq: 400,
    filterType: "lowpass",
  },
  flying: {
    frequency: 600,
    type: "sine",
    attack: 0.1,
    decay: 0.2,
    sustain: 0.4,
    release: 0.5,
    filterFreq: 2000,
    filterType: "bandpass",
    modulation: { frequency: 8, depth: 40 },
  },
  psychic: {
    frequency: 700,
    type: "sine",
    attack: 0.1,
    decay: 0.3,
    sustain: 0.5,
    release: 0.6,
    filterFreq: 2500,
    filterType: "bandpass",
    harmonics: [1, 1.25, 1.5, 2],
  },
  bug: {
    frequency: 500,
    type: "square",
    attack: 0.01,
    decay: 0.05,
    sustain: 0.1,
    release: 0.1,
    filterFreq: 3000,
    filterType: "highpass",
    modulation: { frequency: 30, depth: 80 },
  },
  rock: {
    frequency: 100,
    type: "sawtooth",
    attack: 0.001,
    decay: 0.2,
    sustain: 0.1,
    release: 0.2,
    filterFreq: 500,
    filterType: "lowpass",
  },
  ghost: {
    frequency: 250,
    type: "sine",
    attack: 0.2,
    decay: 0.3,
    sustain: 0.4,
    release: 0.8,
    filterFreq: 800,
    filterType: "lowpass",
    modulation: { frequency: 2, depth: 30 },
    harmonics: [1, 1.5, 2, 3],
  },
  dragon: {
    frequency: 120,
    type: "sawtooth",
    attack: 0.05,
    decay: 0.2,
    sustain: 0.4,
    release: 0.4,
    filterFreq: 1000,
    filterType: "lowpass",
    modulation: { frequency: 5, depth: 40 },
  },
  dark: {
    frequency: 100,
    type: "sawtooth",
    attack: 0.1,
    decay: 0.3,
    sustain: 0.3,
    release: 0.5,
    filterFreq: 300,
    filterType: "lowpass",
  },
  steel: {
    frequency: 900,
    type: "square",
    attack: 0.001,
    decay: 0.1,
    sustain: 0.2,
    release: 0.3,
    filterFreq: 4000,
    filterType: "highpass",
    harmonics: [1, 2, 3, 4],
  },
  fairy: {
    frequency: 800,
    type: "sine",
    attack: 0.05,
    decay: 0.2,
    sustain: 0.5,
    release: 0.4,
    filterFreq: 3000,
    filterType: "highpass",
    harmonics: [1, 1.25, 1.5],
    modulation: { frequency: 10, depth: 20 },
  },
  normal: {
    frequency: 300,
    type: "triangle",
    attack: 0.02,
    decay: 0.1,
    sustain: 0.3,
    release: 0.2,
    filterFreq: 1000,
    filterType: "lowpass",
  },
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playTypeSound(type: string, volume: number = 0.3): void {
  const normalizedType = type.toLowerCase() as PokemonType;
  const config = TYPE_SOUNDS[normalizedType] || TYPE_SOUNDS.normal;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const duration = config.attack + config.decay + config.sustain + config.release;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = volume;

    // Filter
    const filter = ctx.createBiquadFilter();
    filter.type = config.filterType || "lowpass";
    filter.frequency.value = config.filterFreq || 1000;
    filter.connect(masterGain);

    // Create oscillators for harmonics
    const harmonics = config.harmonics || [1];

    harmonics.forEach((harmonic, index) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = config.type;
      osc.frequency.value = config.frequency * harmonic;

      // Add modulation if configured
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

      // ADSR envelope
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
    console.warn("Failed to play type sound:", error);
  }
}

// Hook for React components
import { useCallback, useState } from "react";

export function useTypeSound() {
  const [isMuted, setIsMuted] = useState(false);

  const playSound = useCallback(
    (type: string) => {
      if (!isMuted) {
        playTypeSound(type);
      }
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return { playSound, isMuted, toggleMute };
}
