import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { useGyms, useNPCsFromStore } from "@/original/hooks/useDataStore";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { Gym, NPC } from "@/original/types/pokemon";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { SearchBar } from "@/original/components/ui/search-bar";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { EmptyState } from "@/original/components/ui/empty-state";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/original/components/ui/tabs";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { getNPCPlaceholderUrl } from "@/original/lib/imageCache";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowIcon,
  User,
  Users as TeamIcon,
} from "lucide-react";
import { GAMES } from "@/original/contexts/GameFilterContext";

const GYMS_PER_PAGE = 12;

// NPC interface for type safety
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

export default function GymsPage() {
  const { t, language, tr } = useLanguage();
  const { isAvailableInGame, selectedGame, getGameInfo } = useGameFilter();
  const { data: gyms, loading, error } = useGyms();
  const { data: npcs } = useNPCsFromStore();
  const { data: gymRosters } = useOfflineData<{
    id: number;
    gym_id: number;
    pokemon_id: number;
    level: number;
    moves: any[];
  }>({ table: "gym_roster" });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeGame, setActiveGame] = useState<string>("all");

  // Filter NPCs to gym leaders only
  const gymLeaderNPCs = useMemo(() => {
    return npcs.filter((npc) => npc.category === "gym_leader");
  }, [npcs]);

  // Get team size for a gym
  const getTeamSize = (gymId: number) => {
    return gymRosters.filter((r) => r.gym_id === gymId).length;
  };

  // Find NPC leader for a gym - match by location/city to avoid duplicates across games
  const findLeaderNPC = (gym: Gym & { game_id?: string }) => {
    // First try to match by city/location (most accurate for cross-game matching)
    const byLocation = gymLeaderNPCs.find(
      (npc) =>
        npc.location_en?.toLowerCase().includes(gym.city_en.toLowerCase()) ||
        gym.city_en.toLowerCase().includes(npc.location_en?.toLowerCase() || ""),
    );
    if (byLocation) return byLocation;

    // Fallback: match by specialty_type + badge_order, prefer matching location
    const byTypeAndBadge = gymLeaderNPCs.filter(
      (npc) =>
        npc.specialty_type?.toLowerCase() === gym.type.toLowerCase() &&
        npc.badge_order === gym.badge_order,
    );

    if (byTypeAndBadge.length === 1) return byTypeAndBadge[0];

    // Multiple matches - try to find one with similar location
    return (
      byTypeAndBadge.find((npc) =>
        npc.location_en?.toLowerCase().includes(gym.city_en.split(" ")[0].toLowerCase()),
      ) || byTypeAndBadge[0]
    );
  };

  const gameInfo = getGameInfo(selectedGame);

  // Get unique games from gyms
  const availableGames = useMemo(() => {
    const gameIds = new Set(gyms.map((g) => g.game_id).filter(Boolean));
    return GAMES.filter((g) => g.id === "all" || gameIds.has(g.id));
  }, [gyms]);

  const filteredGyms = useMemo(() => {
    return gyms.filter((gym) => {
      const matchesSearch =
        search === "" ||
        gym.city_en.toLowerCase().includes(search.toLowerCase()) ||
        gym.city_ar.includes(search) ||
        gym.leader_name_en.toLowerCase().includes(search.toLowerCase()) ||
        gym.leader_name_ar.includes(search);

      const matchesGame =
        activeGame === "all" ||
        gym.game_id === activeGame ||
        (gym.available_in && gym.available_in.includes(activeGame));
      return matchesSearch && matchesGame;
    });
  }, [gyms, search, activeGame]);

  const sortedGyms = useMemo(() => {
    return [...filteredGyms].sort((a, b) => (a.badge_order || 0) - (b.badge_order || 0));
  }, [filteredGyms]);

  // Reset page when search or game changes
  useMemo(() => {
    setCurrentPage(1);
  }, [search, activeGame]);

  // Pagination
  const totalPages = Math.ceil(sortedGyms.length / GYMS_PER_PAGE);
  const paginatedGyms = useMemo(() => {
    const startIndex = (currentPage - 1) * GYMS_PER_PAGE;
    return sortedGyms.slice(startIndex, startIndex + GYMS_PER_PAGE);
  }, [sortedGyms, currentPage]);

  if (error) {
    return (
      <Layout>
        <EmptyState type="error" message={error} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <PageHeader
          title={tr("page.gyms.title")}
          description={tr("page.gyms.subtitle").replace("{count}", String(sortedGyms.length))}
          icon={Award}
        />

        {/* Game Tabs */}
        {availableGames.length > 2 && (
          <Tabs value={activeGame} onValueChange={setActiveGame} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {availableGames.map((game) => (
                <TabsTrigger key={game.id} value={game.id} className="flex-1 min-w-[80px] text-xs">
                  {language === "ar" ? game.labelAr : game.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={{ en: "Search gyms or leaders...", ar: "بحث عن صالات أو قادة..." }}
        />

        {/* Gyms Grid */}
        {loading ? (
          <LoadingSkeleton count={8} type="card" />
        ) : sortedGyms.length === 0 ? (
          <EmptyState
            type={gyms.length === 0 ? "empty" : "no-results"}
            message={gyms.length === 0 ? tr("page.gyms.noData") : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedGyms.map((gym) => {
                const leaderNPC = findLeaderNPC(gym);
                const gameLabel = GAMES.find((g) => g.id === gym.game_id);

                return (
                  <Link
                    key={gym.id}
                    to={`/gyms/${gym.id}`}
                    className="block overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary hover:shadow-md transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="relative">
                      {/* Header with gradient based on type */}
                      <div className="h-20 bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden">
                        {/* Badge number */}
                        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-amber-500/90 flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold text-amber-950">
                            {gym.badge_order || "?"}
                          </span>
                        </div>

                        {/* Game badge */}
                        {gameLabel && (
                          <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">
                            {language === "ar" ? gameLabel.labelAr : gameLabel.labelEn}
                          </Badge>
                        )}

                        {/* Leader image */}
                        <div className="absolute -bottom-8 right-3">
                          <OfflineImage
                            src={leaderNPC?.image_url || getNPCPlaceholderUrl()}
                            alt={
                              language === "ar"
                                ? leaderNPC?.name_ar || gym.leader_name_ar
                                : leaderNPC?.name_en || gym.leader_name_en
                            }
                            className="w-20 h-20 object-cover rounded-full border-4 border-card shadow-lg"
                            placeholderType="npc"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 pt-10">
                        {/* City Name */}
                        <h3 className="font-bold text-base text-foreground leading-tight">
                          {language === "ar"
                            ? gym.city_ar || tr("gym.cityBeingAdded")
                            : gym.city_en}
                        </h3>

                        {/* Leader Name */}
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {language === "ar"
                            ? gym.leader_name_ar || tr("gym.leaderBeingAdded")
                            : gym.leader_name_en}
                        </p>

                        {/* Leader Story Snippet */}
                        {leaderNPC && (leaderNPC.story_en || leaderNPC.story_ar) && (
                          <p className="text-xs text-muted-foreground/80 mt-1.5 line-clamp-2 leading-relaxed">
                            {language === "ar"
                              ? (leaderNPC.story_ar || leaderNPC.story_en)?.slice(0, 80) + "..."
                              : (leaderNPC.story_en || leaderNPC.story_ar)?.slice(0, 80) + "..."}
                          </p>
                        )}

                        {/* Type Badge and Team Size */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TypeBadge type={gym.type} size="md" />
                            {/* Team Size */}
                            {getTeamSize(gym.id) > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-1">
                                <TeamIcon className="w-3 h-3" />
                                {getTeamSize(gym.id)}
                              </Badge>
                            )}
                          </div>

                          {/* View Details hint */}
                          <div className="flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            {tr("action.details")}
                            <ArrowIcon className="w-3 h-3 ml-1" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Page Info */}
            {totalPages > 1 && (
              <p className="text-center text-sm text-muted-foreground">
                {tr("pagination.page")} {currentPage} {tr("pagination.of")} {totalPages}
              </p>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
