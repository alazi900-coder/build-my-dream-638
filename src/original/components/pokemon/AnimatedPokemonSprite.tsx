import { useState, useEffect } from "react";
import { cn } from "@/original/lib/utils";
import {
  getPokemonAnimatedSpriteUrl,
  getPokemonShowdownSpriteUrl,
  getPokemonSpriteUrl,
  getCachedImage,
  isCached,
} from "@/original/lib/imageCache";

interface AnimatedPokemonSpriteProps {
  pokemonId: number;
  pokemonName: string;
  className?: string;
  showOnHover?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  fallbackToStatic?: boolean;
}

/**
 * Animated Pokemon sprite component with fallback support and offline cache
 * Uses PokeAPI animated GIFs (Gen 1-5) or Showdown sprites (all gens)
 */
export function AnimatedPokemonSprite({
  pokemonId,
  pokemonName,
  className,
  showOnHover = false,
  size = "md",
  fallbackToStatic = true,
}: AnimatedPokemonSpriteProps) {
  const [displaySrc, setDisplaySrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [fallbackLevel, setFallbackLevel] = useState(0);

  // Size classes
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
    "2xl": "w-64 h-64",
  };

  // Get all possible URLs in order of preference
  const getImageUrls = () => {
    const urls: string[] = [];

    // For Gen 1-5 (ID 1-649), prefer PokeAPI animated sprites
    if (pokemonId <= 649) {
      urls.push(getPokemonAnimatedSpriteUrl(pokemonId));
    }

    // Showdown sprites for all Pokemon
    urls.push(getPokemonShowdownSpriteUrl(pokemonName));

    // Static sprite as final fallback
    if (fallbackToStatic) {
      urls.push(getPokemonSpriteUrl(pokemonId));
    }

    return urls;
  };

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);
      setFallbackLevel(0);

      const urls = getImageUrls();

      // Try to find a cached version first
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const cached = await isCached(url);

        if (cached) {
          const cachedUrl = await getCachedImage(url);
          if (cachedUrl && !cancelled) {
            setDisplaySrc(cachedUrl);
            setFallbackLevel(i);
            setIsLoading(false);
            return;
          }
        }
      }

      // No cached version, use the first URL and let browser fetch
      if (!cancelled && urls.length > 0) {
        setDisplaySrc(urls[0]);
        setFallbackLevel(0);
      }
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [pokemonId, pokemonName]);

  const handleError = async () => {
    const urls = getImageUrls();
    const nextLevel = fallbackLevel + 1;

    if (nextLevel < urls.length) {
      // Try next fallback URL
      const nextUrl = urls[nextLevel];

      // Check if it's cached
      const cachedUrl = await getCachedImage(nextUrl);
      if (cachedUrl) {
        setDisplaySrc(cachedUrl);
      } else {
        setDisplaySrc(nextUrl);
      }
      setFallbackLevel(nextLevel);
    } else {
      // All fallbacks exhausted
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // If showOnHover, only show animated when hovered
  const shouldShow = showOnHover ? isHovered : true;

  if (hasError && !fallbackToStatic) {
    return null;
  }

  return (
    <div
      className={cn("relative flex items-center justify-center", sizeClasses[size], className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {shouldShow && displaySrc && (
        <img
          src={displaySrc}
          alt={`${pokemonName} animated`}
          className={cn(
            "w-full h-full object-contain transition-opacity duration-200",
            isLoading ? "opacity-0" : "opacity-100",
            "image-rendering-pixelated",
          )}
          style={{ imageRendering: "pixelated" }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
}
