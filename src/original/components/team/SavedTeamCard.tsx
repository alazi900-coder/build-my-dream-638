import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Trash2, Play, Shield, Swords, Scale } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { LtrToken } from "@/original/components/ui/ltr-token";

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  stats?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
}

interface SavedTeam {
  id: string;
  name: string;
  game_id: string;
  pokemon_ids: number[];
  created_at: string;
  updated_at?: string;
}

interface Props {
  team: SavedTeam;
  allPokemon: Pokemon[];
  onLoad: () => void;
  onDelete: () => void;
}

type Playstyle = "offensive" | "defensive" | "balanced";

export function SavedTeamCard({ team, allPokemon, onLoad, onDelete }: Props) {
  const { language } = useLanguage();

  const teamPokemon = useMemo(() => {
    return team.pokemon_ids
      .map((id) => allPokemon.find((p) => p.id === id))
      .filter(Boolean) as Pokemon[];
  }, [team.pokemon_ids, allPokemon]);

  const playstyle: Playstyle = useMemo(() => {
    if (teamPokemon.length === 0) return "balanced";

    let totalAtk = 0;
    let totalDef = 0;
    let count = 0;

    teamPokemon.forEach((p) => {
      if (p.stats) {
        totalAtk += p.stats.atk + p.stats.spa + p.stats.spe;
        totalDef += p.stats.hp + p.stats.def + p.stats.spd;
        count++;
      }
    });

    if (count === 0) return "balanced";

    const avgAtk = totalAtk / count;
    const avgDef = totalDef / count;
    const ratio = avgAtk / avgDef;

    if (ratio > 1.15) return "offensive";
    if (ratio < 0.9) return "defensive";
    return "balanced";
  }, [teamPokemon]);

  const playstyleConfig = {
    offensive: {
      label: { ar: "هجومي", en: "Offensive" },
      icon: Swords,
      color: "bg-red-500/20 text-red-500",
    },
    defensive: {
      label: { ar: "دفاعي", en: "Defensive" },
      icon: Shield,
      color: "bg-blue-500/20 text-blue-500",
    },
    balanced: {
      label: { ar: "متوازن", en: "Balanced" },
      icon: Scale,
      color: "bg-green-500/20 text-green-500",
    },
  };

  const config = playstyleConfig[playstyle];
  const PlaystyleIcon = config.icon;

  const timeAgo = useMemo(() => {
    const dateStr = team.updated_at || team.created_at;
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: language === "ar" ? ar : enUS,
      });
    } catch {
      return "";
    }
  }, [team.created_at, team.updated_at, language]);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{team.name}</p>
          <Badge className={`text-[10px] ${config.color}`}>
            <PlaystyleIcon className="w-3 h-3 mr-1" />
            {config.label[language]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>
            <LtrToken>{team.pokemon_ids.length}</LtrToken>{" "}
            {language === "ar" ? "بوكيمون" : "Pokémon"}
          </span>
          <span>•</span>
          <span>{team.game_id}</span>
          {timeAgo && (
            <>
              <span>•</span>
              <span>{timeAgo}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="sm" onClick={onLoad} className="gap-1">
          <Play className="w-3 h-3" />
          {language === "ar" ? "تحميل" : "Load"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
