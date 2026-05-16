import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter, GAMES } from "@/original/contexts/GameFilterContext";
import {
  useGymById,
  useGymRoster,
  usePokemon,
  useMoves,
  useItems,
  useNPCsFromStore,
} from "@/original/hooks/useDataStore";
import { Layout } from "@/original/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Button } from "@/original/components/ui/button";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { GymCounterRecommendations } from "@/original/components/gym/GymCounterRecommendations";
import { AICounterTeamBuilder } from "@/original/components/gym/AICounterTeamBuilder";
import { AIBattleTips } from "@/original/components/gym/AIBattleTips";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import {
  getPokemonArtworkUrl,
  getNPCPlaceholderUrl,
  getTrainerSpriteUrl,
} from "@/original/lib/imageCache";
import { Award, ArrowLeft, Swords, Lightbulb, Users, User, BookOpen, Sparkles } from "lucide-react";

interface Gym {
  id: number;
  game_id: string;
  leader_name_en: string;
  leader_name_ar: string;
  city_en: string;
  city_ar: string;
  type: string;
  challenge_en?: string;
  challenge_ar?: string;
  tips_en?: string;
  tips_ar?: string;
  badge_order?: number;
  available_in?: string[];
}

interface GymRoster {
  id: number;
  gym_id: number;
  pokemon_id: number;
  level: number;
  moves?: string[];
  pokemon?: {
    id: number;
    name_en: string;
    name_ar: string;
    types: string[];
  };
}

interface Pokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  available_in?: string[];
}

interface Move {
  id: number;
  name_en: string;
  name_ar: string;
  type: string;
  power: number | null;
  category: string;
}

interface Item {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
  effect_en?: string;
  effect_ar?: string;
}

interface NPCData {
  id: number;
  name_en: string;
  name_ar: string;
  category: string;
  specialty_type: string | null;
  badge_order: number | null;
  image_url: string | null;
  story_en: string | null;
  story_ar: string | null;
  location_en: string;
  location_ar: string;
}

export default function GymDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { getGameInfo } = useGameFilter();
  const gymId = parseInt(id || "0");

  // Use offline-first data store hooks
  const { gym, loading: gymLoading } = useGymById(gymId);
  const { roster: rawRoster } = useGymRoster(gymId);
  const { data: pokemonData } = usePokemon();
  const { data: movesData } = useMoves();
  const { data: itemsData } = useItems();
  const { data: npcsData } = useNPCsFromStore();

  // Map raw roster with pokemon data
  const roster = useMemo(() => {
    return rawRoster.map((r) => {
      const pokemon = pokemonData.find((p) => p.id === r.pokemon_id);
      return {
        ...r,
        pokemon: pokemon
          ? {
              id: pokemon.id,
              name_en: pokemon.name_en,
              name_ar: pokemon.name_ar,
              types: pokemon.types,
            }
          : undefined,
        moves: Array.isArray(r.moves) ? r.moves : [],
      } as GymRoster;
    });
  }, [rawRoster, pokemonData]);

  // Find leader NPC by matching gym data
  const leaderNPC = useMemo(() => {
    if (!gym) return null;

    const gymLeaders = npcsData.filter((n) => n.category === "gym_leader");

    // First try to match by city/location (most accurate for cross-game)
    const byLocation = gymLeaders.find(
      (npc) =>
        npc.location_en?.toLowerCase().includes(gym.city_en.toLowerCase()) ||
        gym.city_en.toLowerCase().includes(npc.location_en?.toLowerCase() || ""),
    );
    if (byLocation) return byLocation as NPCData;

    // Fallback: match by specialty_type + badge_order
    const byTypeAndBadge = gymLeaders.filter(
      (npc) =>
        npc.specialty_type?.toLowerCase() === gym.type.toLowerCase() &&
        npc.badge_order === gym.badge_order,
    );

    if (byTypeAndBadge.length === 1) return byTypeAndBadge[0] as NPCData;

    // Multiple matches - try to find one with similar location
    return (byTypeAndBadge.find((npc) =>
      npc.location_en?.toLowerCase().includes(gym.city_en.split(" ")[0].toLowerCase()),
    ) || byTypeAndBadge[0]) as NPCData | null;
  }, [gym, npcsData]);

  // Transform data to expected formats
  const allPokemon = useMemo(
    () =>
      pokemonData.map((p) => ({
        ...p,
        types: Array.isArray(p.types) ? p.types : [],
        available_in: Array.isArray(p.available_in) ? p.available_in : [],
      })) as Pokemon[],
    [pokemonData],
  );

  const allMoves = useMemo(
    () => movesData.sort((a, b) => (b.power || 0) - (a.power || 0)) as Move[],
    [movesData],
  );

  const allItems = itemsData as Item[];

  if (gymLoading) {
    return (
      <Layout>
        <div className="p-4">
          <LoadingSkeleton count={4} type="card" />
        </div>
      </Layout>
    );
  }

  if (!gym) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p className="text-muted-foreground">{t("Gym not found", "الصالة غير موجودة")}</p>
          <Button variant="link" onClick={() => navigate("/gyms")}>
            {t("Back to Gyms", "العودة للصالات")}
          </Button>
        </div>
      </Layout>
    );
  }

  const gameInfo = getGameInfo(gym.game_id as any);
  const gameLabel = GAMES.find((g) => g.id === gym.game_id);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/gyms")} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("Back", "رجوع")}
        </Button>

        {/* Gym Header with Leader Image */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Leader Image */}
              <div className="flex-shrink-0">
                <OfflineImage
                  src={leaderNPC?.image_url || getTrainerSpriteUrl(gym.leader_name_en)}
                  alt={
                    language === "ar"
                      ? leaderNPC?.name_ar || gym.leader_name_ar
                      : leaderNPC?.name_en || gym.leader_name_en
                  }
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-full border-4 border-card shadow-lg bg-muted/30"
                  placeholderType="npc"
                  trainerName={gym.leader_name_en}
                  fallbackSrc={getTrainerSpriteUrl(gym.leader_name_en)}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">
                    {language === "ar" ? gym.city_ar || "المدينة قيد الإضافة" : gym.city_en}
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/20 text-amber-600 border-amber-500/30"
                  >
                    <Award className="w-3 h-3 mr-1" />
                    {language === "ar" ? `الشارة ${gym.badge_order}` : `Badge #${gym.badge_order}`}
                  </Badge>
                  {gameLabel && (
                    <Badge variant="secondary">
                      {language === "ar" ? gameLabel.labelAr : gameLabel.labelEn}
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground mt-1">
                  {language === "ar" ? "القائد:" : "Leader:"}{" "}
                  <span className="text-foreground font-medium">
                    {language === "ar"
                      ? gym.leader_name_ar || "القائد قيد الإضافة"
                      : gym.leader_name_en}
                  </span>
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <TypeBadge type={gym.type} size="md" />
                  <span className="text-sm text-muted-foreground">
                    {language === "ar" ? "متخصص" : "Specialist"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Leader Story */}
        {leaderNPC && (leaderNPC.story_en || leaderNPC.story_ar) && (
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {language === "ar" ? "قصة القائد" : "Leader Story"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {language === "ar"
                  ? leaderNPC.story_ar || leaderNPC.story_en
                  : leaderNPC.story_en || leaderNPC.story_ar}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Challenge & Tips */}
        <div className="grid md:grid-cols-2 gap-4">
          {(language === "ar" ? gym.challenge_ar : gym.challenge_en) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  {language === "ar" ? "التحدي" : "Challenge"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">
                  {language === "ar" ? gym.challenge_ar || "التحدي قيد الإضافة" : gym.challenge_en}
                </p>
              </CardContent>
            </Card>
          )}

          {(language === "ar" ? gym.tips_ar : gym.tips_en) && (
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-500">
                  <Lightbulb className="w-4 h-4" />
                  {language === "ar" ? "نصائح" : "Tips"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">
                  {language === "ar" ? gym.tips_ar || "النصائح قيد الإضافة" : gym.tips_en}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Gym Roster */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              {language === "ar" ? "فريق القائد" : "Leader's Team"}
              {roster.length > 0 && (
                <Badge variant="outline">
                  {roster.length} {language === "ar" ? "بوكيمون" : "Pokémon"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roster.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {roster.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg bg-muted/50 border border-border text-center hover:border-primary/50 transition-colors"
                  >
                    <OfflineImage
                      src={getPokemonArtworkUrl(r.pokemon_id)}
                      alt={r.pokemon?.name_en || "Unknown"}
                      className="w-16 h-16 mx-auto object-contain"
                      placeholderType="pokemon"
                    />
                    <p className="font-medium text-sm mt-1">
                      {language === "ar"
                        ? r.pokemon?.name_ar || "الاسم قيد الإضافة"
                        : r.pokemon?.name_en}
                    </p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Lv. {r.level}
                    </Badge>
                    {r.pokemon?.types && (
                      <div className="flex justify-center gap-1 mt-2 flex-wrap">
                        {(r.pokemon.types as string[]).map((type: string) => (
                          <TypeBadge key={type} type={type} size="sm" />
                        ))}
                      </div>
                    )}
                    {r.moves && r.moves.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {r.moves.slice(0, 2).join(", ")}
                        {r.moves.length > 2 && "..."}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {language === "ar" ? "لا توجد بيانات فريق متاحة" : "No roster data available"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Battle Tips */}
        <AIBattleTips
          gym={{
            leaderName:
              language === "ar" ? gym.leader_name_ar || gym.leader_name_en : gym.leader_name_en,
            cityName: language === "ar" ? gym.city_ar || gym.city_en : gym.city_en,
            gymType: gym.type,
            roster: roster.map((r) => ({
              name:
                language === "ar"
                  ? r.pokemon?.name_ar || r.pokemon?.name_en || "Unknown"
                  : r.pokemon?.name_en || "Unknown",
              level: r.level,
              types: (r.pokemon?.types || []) as string[],
            })),
          }}
        />

        {/* AI Counter Team Builder */}
        <AICounterTeamBuilder
          gymLeader={
            language === "ar" ? gym.leader_name_ar || gym.leader_name_en : gym.leader_name_en
          }
          gymType={gym.type}
          gymRoster={roster.map((r) => ({
            name:
              language === "ar"
                ? r.pokemon?.name_ar || r.pokemon?.name_en || "Unknown"
                : r.pokemon?.name_en || "Unknown",
            level: r.level,
            types: (r.pokemon?.types || []) as string[],
          }))}
          availablePokemon={allPokemon}
        />

        {/* Counter Recommendations */}
        <div className="pt-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {language === "ar" ? "الاستعداد للمعركة" : "Battle Preparation"}
          </h2>
          <GymCounterRecommendations
            gymType={gym.type}
            allPokemon={allPokemon}
            allMoves={allMoves}
            allItems={allItems}
          />
        </div>
      </div>
    </Layout>
  );
}
