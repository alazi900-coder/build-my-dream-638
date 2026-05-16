import { useState, useCallback, useRef } from "react";
import {
  playPokemonCry,
  isAudioCached,
  cacheAudio,
  getPokemonCryUrl,
  CryStyle,
} from "@/original/lib/audioCache";

interface UsePokemonCryOptions {
  pokemonId: number;
  style?: CryStyle;
  volume?: number;
}

interface UsePokemonCryReturn {
  play: () => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  isCached: boolean;
  error: string | null;
  cacheForOffline: () => Promise<boolean>;
}

export function usePokemonCry({
  pokemonId,
  style = "latest",
  volume = 0.5,
}: UsePokemonCryOptions): UsePokemonCryReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if cached on mount
  useState(() => {
    const checkCache = async () => {
      const url = getPokemonCryUrl(pokemonId, style);
      const cached = await isAudioCached(url);
      setIsCached(cached);
    };
    checkCache();
  });

  const play = useCallback(async () => {
    if (isPlaying || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = await playPokemonCry(pokemonId, style, volume);

      if (audio) {
        audioRef.current = audio;
        setIsPlaying(true);

        audio.onended = () => {
          setIsPlaying(false);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setError("Failed to play audio");
          setIsPlaying(false);
          audioRef.current = null;
        };
      } else {
        setError("Audio not available");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to play");
    } finally {
      setIsLoading(false);
    }
  }, [pokemonId, style, volume, isPlaying, isLoading]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const cacheForOffline = useCallback(async (): Promise<boolean> => {
    const url = getPokemonCryUrl(pokemonId, style);
    const success = await cacheAudio(url);
    setIsCached(success);
    return success;
  }, [pokemonId, style]);

  return {
    play,
    stop,
    isPlaying,
    isLoading,
    isCached,
    error,
    cacheForOffline,
  };
}
