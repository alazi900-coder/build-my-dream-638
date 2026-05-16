import { useState } from "react";
import { usePokemonCry } from "@/original/hooks/usePokemonCry";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { Slider } from "@/original/components/ui/slider";
import { Badge } from "@/original/components/ui/badge";
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Loader2,
  Download,
  CheckCircle2,
  Music2,
} from "lucide-react";
import { cn } from "@/original/lib/utils";
import { CryStyle } from "@/original/lib/audioCache";

interface CryPlayerProps {
  pokemonId: number;
  pokemonName?: string;
  className?: string;
  compact?: boolean;
}

export function CryPlayer({ pokemonId, pokemonName, className, compact = false }: CryPlayerProps) {
  const { language } = useLanguage();
  const [volume, setVolume] = useState(0.5);
  const [style, setStyle] = useState<CryStyle>("latest");
  const [isCaching, setIsCaching] = useState(false);

  const { play, stop, isPlaying, isLoading, isCached, error, cacheForOffline } = usePokemonCry({
    pokemonId,
    style,
    volume,
  });

  const handleCacheClick = async () => {
    setIsCaching(true);
    await cacheForOffline();
    setIsCaching(false);
  };

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={isPlaying ? stop : play}
        disabled={isLoading}
        className={cn("gap-2", className)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Square className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
        {language === "ar" ? "صوت" : "Cry"}
        {isCached && <CheckCircle2 className="w-3 h-3 text-green-500" />}
      </Button>
    );
  }

  return (
    <div className={cn("p-4 rounded-xl bg-muted/50 border border-border space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Music2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">
              {language === "ar" ? "صوت البوكيمون" : "Pokémon Cry"}
            </h3>
            {pokemonName && <p className="text-xs text-muted-foreground">{pokemonName}</p>}
          </div>
        </div>

        {/* Cache status */}
        {isCached ? (
          <Badge variant="outline" className="text-green-600 border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {language === "ar" ? "محفوظ" : "Saved"}
          </Badge>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCacheClick}
            disabled={isCaching}
            className="text-xs gap-1"
          >
            {isCaching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {language === "ar" ? "حفظ" : "Save"}
          </Button>
        )}
      </div>

      {/* Style Toggle */}
      <div className="flex gap-2">
        <Button
          variant={style === "latest" ? "default" : "outline"}
          size="sm"
          onClick={() => setStyle("latest")}
          className="flex-1 text-xs"
        >
          {language === "ar" ? "حديث" : "Modern"}
        </Button>
        <Button
          variant={style === "legacy" ? "default" : "outline"}
          size="sm"
          onClick={() => setStyle("legacy")}
          className="flex-1 text-xs"
        >
          {language === "ar" ? "كلاسيكي" : "Classic"}
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <VolumeX className="w-4 h-4 text-muted-foreground" />
        <Slider
          value={[volume * 100]}
          onValueChange={(values) => setVolume(values[0] / 100)}
          max={100}
          step={5}
          className="flex-1"
        />
        <Volume2 className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Play Button */}
      <Button
        onClick={isPlaying ? stop : play}
        disabled={isLoading}
        className="w-full gap-2"
        variant={isPlaying ? "destructive" : "default"}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
          </>
        ) : isPlaying ? (
          <>
            <Square className="w-5 h-5" />
            {language === "ar" ? "إيقاف" : "Stop"}
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            {language === "ar" ? "تشغيل الصوت" : "Play Cry"}
          </>
        )}
      </Button>

      {/* Error display */}
      {error && (
        <p className="text-xs text-destructive text-center">
          {language === "ar" ? "فشل تشغيل الصوت" : error}
        </p>
      )}
    </div>
  );
}
