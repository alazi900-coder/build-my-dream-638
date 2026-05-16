import { useState, useEffect, useCallback } from "react";
import {
  getPokemonPlaceholderUrl,
  getItemPlaceholderUrl,
  getNPCPlaceholderUrl,
  getTrainerSpriteUrl,
  getTrainerFallbackUrls,
} from "@/original/lib/imageCache";
import { cn } from "@/original/lib/utils";

interface OfflineImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderType?: "pokemon" | "item" | "npc" | "default";
  fallbackSrc?: string;
  /** For NPC images: trainer name to try multiple sprite sources as fallback */
  trainerName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OfflineImage component with smart fallback chain for NPC images.
 * Tries multiple sources before falling back to placeholder.
 */
export function OfflineImage({
  src,
  alt,
  className,
  placeholderType = "default",
  fallbackSrc,
  trainerName,
  onLoad,
  onError,
}: OfflineImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [triedSources, setTriedSources] = useState<Set<string>>(new Set());

  // Build fallback chain for NPC images
  const getFallbackChain = useCallback((): string[] => {
    const chain: string[] = [];

    // 1. Original src if valid
    if (src && src.trim() !== "") {
      chain.push(src);
    }

    // 2. Explicit fallbackSrc
    if (fallbackSrc && fallbackSrc.trim() !== "") {
      chain.push(fallbackSrc);
    }

    // 3. For NPCs: try multiple trainer sprite sources
    if (placeholderType === "npc" && trainerName) {
      // Primary trainer sprite URL
      chain.push(getTrainerSpriteUrl(trainerName));
      // Additional fallback URLs
      chain.push(...getTrainerFallbackUrls(trainerName));
    }

    // Deduplicate
    return [...new Set(chain)];
  }, [src, fallbackSrc, placeholderType, trainerName]);

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src && src.trim() !== "" ? src : getFallbackChain()[0] || getPlaceholder());
    setIsLoading(true);
    setHasError(false);
    setFallbackIndex(0);
    setTriedSources(new Set());
  }, [src]);

  const getPlaceholder = () => {
    switch (placeholderType) {
      case "pokemon":
        return getPokemonPlaceholderUrl();
      case "item":
        return getItemPlaceholderUrl();
      case "npc":
        return getNPCPlaceholderUrl();
      default:
        return getPokemonPlaceholderUrl();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    const fallbackChain = getFallbackChain();
    const newTriedSources = new Set(triedSources);
    newTriedSources.add(currentSrc);
    setTriedSources(newTriedSources);

    // Find next untried source in chain
    let nextSrc: string | null = null;
    for (let i = 0; i < fallbackChain.length; i++) {
      if (!newTriedSources.has(fallbackChain[i])) {
        nextSrc = fallbackChain[i];
        setFallbackIndex(i);
        break;
      }
    }

    if (nextSrc) {
      setCurrentSrc(nextSrc);
      setIsLoading(true);
      return;
    }

    // All sources failed, use placeholder
    const placeholder = getPlaceholder();
    if (currentSrc !== placeholder) {
      setCurrentSrc(placeholder);
      setHasError(true);
      setIsLoading(false);
    }

    onError?.();
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={cn(
        "transition-opacity duration-200",
        isLoading && "opacity-50",
        hasError && "opacity-70 grayscale",
        className,
      )}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
    />
  );
}
