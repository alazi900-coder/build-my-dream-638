import { useLanguage } from "@/original/contexts/LanguageContext";
import { Input } from "@/original/components/ui/input";
import { Label } from "@/original/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/original/components/ui/select";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { Badge } from "@/original/components/ui/badge";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import { User, MapPin, Users, Sparkles } from "lucide-react";

interface PokemonData {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
}

interface HeroConfig {
  heroName: string;
  mainPokemonId: string;
  companionPokemonId: string;
  startingRegion: string;
}

interface HeroCustomizerProps {
  config: HeroConfig;
  onChange: (config: HeroConfig) => void;
  pokemonList: PokemonData[];
}

// Regions with recommended flag for beginners
const regions = [
  { id: "kanto", nameEn: "Kanto", nameAr: "كانتو", recommended: true },
  { id: "galar", nameEn: "Galar", nameAr: "جالار", recommended: true },
  { id: "johto", nameEn: "Johto", nameAr: "جوتو", recommended: false },
  { id: "hoenn", nameEn: "Hoenn", nameAr: "هوين", recommended: false },
  { id: "sinnoh", nameEn: "Sinnoh", nameAr: "سينو", recommended: false },
  { id: "hisui", nameEn: "Hisui", nameAr: "هيسوي", recommended: false },
];

// Starter Pokemon IDs that are recommended for beginners
const STARTER_POKEMON_IDS = [1, 4, 7, 25, 133, 152, 155, 158]; // Bulbasaur, Charmander, Squirtle, Pikachu, Eevee, Chikorita, Cyndaquil, Totodile

export function HeroCustomizer({ config, onChange, pokemonList }: HeroCustomizerProps) {
  const { t, language } = useLanguage();

  const mainPokemon = pokemonList.find((p) => p.id.toString() === config.mainPokemonId);
  const companionPokemon = pokemonList.find((p) => p.id.toString() === config.companionPokemonId);

  const isStarterPokemon = (id: number) => STARTER_POKEMON_IDS.includes(id);

  return (
    <div className="space-y-5">
      {/* Hero Name */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {t("Hero Name", "اسم البطل")}
        </Label>
        <Input
          value={config.heroName}
          onChange={(e) => onChange({ ...config, heroName: e.target.value })}
          placeholder={t("Enter your name...", "أدخل اسمك...")}
          maxLength={20}
          className="focus-visible:ring-primary"
        />
      </div>

      {/* Main Pokemon */}
      <div className="space-y-2">
        <Label>{t("Main Partner", "الشريك الرئيسي")}</Label>
        <Select
          value={config.mainPokemonId}
          onValueChange={(value) => onChange({ ...config, mainPokemonId: value })}
        >
          <SelectTrigger className="focus-visible:ring-primary">
            <SelectValue placeholder={t("Select a Pokémon...", "اختر بوكيمون...")} />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {pokemonList.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>
                      #{p.id} - {language === "ar" ? p.name_ar : p.name_en}
                    </span>
                    {isStarterPokemon(p.id) && <Sparkles className="w-3 h-3 text-primary" />}
                  </div>
                </SelectItem>
              ))}
            </ScrollArea>
          </SelectContent>
        </Select>
        {mainPokemon && (
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <img
              src={getPokemonSprite(mainPokemon.id)}
              alt={mainPokemon.name_en}
              className="w-16 h-16"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold">
                  {language === "ar" ? mainPokemon.name_ar : mainPokemon.name_en}
                </p>
                {isStarterPokemon(mainPokemon.id) && (
                  <Badge variant="secondary" className="text-[10px]">
                    {t("story.recommendedForBeginners", "مناسب للمبتدئين")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{mainPokemon.types.join(" / ")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Companion Pokemon */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          {t("Companion (Optional)", "الرفيق (اختياري)")}
        </Label>
        <Select
          value={config.companionPokemonId}
          onValueChange={(value) => onChange({ ...config, companionPokemonId: value })}
        >
          <SelectTrigger className="focus-visible:ring-primary">
            <SelectValue placeholder={t("No companion", "بدون رفيق")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("No companion", "بدون رفيق")}</SelectItem>
            <ScrollArea className="h-[200px]">
              {pokemonList
                .filter((p) => p.id.toString() !== config.mainPokemonId)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    #{p.id} - {language === "ar" ? p.name_ar : p.name_en}
                  </SelectItem>
                ))}
            </ScrollArea>
          </SelectContent>
        </Select>
        {companionPokemon && config.companionPokemonId !== "none" && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <img
              src={getPokemonSprite(companionPokemon.id)}
              alt={companionPokemon.name_en}
              className="w-12 h-12"
            />
            <div>
              <p className="font-medium text-sm">
                {language === "ar" ? companionPokemon.name_ar : companionPokemon.name_en}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Starting Region */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t("Starting Region", "منطقة البداية")}
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {regions.map((region) => (
            <button
              key={region.id}
              type="button"
              onClick={() => onChange({ ...config, startingRegion: region.id })}
              className={`relative p-2.5 text-sm rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                config.startingRegion === region.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 border-border hover:bg-muted"
              }`}
            >
              {region.recommended && config.startingRegion !== region.id && (
                <Sparkles
                  className={`absolute top-1 ${language === "ar" ? "left-1" : "right-1"} w-3 h-3 text-primary`}
                />
              )}
              {language === "ar" ? region.nameAr : region.nameEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
