import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/original/components/layout/Layout";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Progress } from "@/original/components/ui/progress";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import {
  Compass,
  Star,
  BookOpen,
  Map,
  Zap,
  Package,
  ChevronRight,
  Trophy,
  Target,
  Flame,
  Eye,
} from "lucide-react";
import { PokedexIcon } from "@/original/components/icons/PokemonIcons";
import { cn } from "@/original/lib/utils";

// Import utilities
import { getFavoritePokemon, getViewedPokemon, getPokemonNotes } from "@/original/lib/pokemonUtils";
import {
  getFavoriteLocations,
  getVisitedLocations,
  getLocationNotes,
} from "@/original/lib/locationUtils";
import { getFavoriteMoves, getMoveNotes } from "@/original/lib/moveHeuristics";
import { getFavoriteItems, getViewedItems, getItemNotes } from "@/original/lib/itemUtils";

interface SectionStats {
  total: number;
  viewed: number;
  favorites: number;
  notes: number;
}

interface AllStats {
  pokemon: SectionStats;
  locations: SectionStats;
  moves: SectionStats;
  items: SectionStats;
}

export default function ExplorationDashboardPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const [stats, setStats] = useState<AllStats>({
    pokemon: { total: 400, viewed: 0, favorites: 0, notes: 0 },
    locations: { total: 100, viewed: 0, favorites: 0, notes: 0 },
    moves: { total: 800, viewed: 0, favorites: 0, notes: 0 },
    items: { total: 300, viewed: 0, favorites: 0, notes: 0 },
  });

  useEffect(() => {
    // Load stats from localStorage
    const pokemonViewed = getViewedPokemon();
    const pokemonFavorites = getFavoritePokemon();
    const pokemonNotes = getPokemonNotes();

    const locationsViewed = getVisitedLocations();
    const locationsFavorites = getFavoriteLocations();
    const locationsNotes = getLocationNotes();

    const movesFavorites = getFavoriteMoves();
    const movesNotes = getMoveNotes();

    const itemsViewed = getViewedItems();
    const itemsFavorites = getFavoriteItems();
    const itemsNotes = getItemNotes();

    setStats({
      pokemon: {
        total: 400,
        viewed: pokemonViewed.length,
        favorites: pokemonFavorites.length,
        notes: Object.keys(pokemonNotes).length,
      },
      locations: {
        total: 100,
        viewed: locationsViewed.length,
        favorites: locationsFavorites.length,
        notes: Object.keys(locationsNotes).length,
      },
      moves: {
        total: 800,
        viewed: 0, // Moves don't track viewed yet
        favorites: movesFavorites.length,
        notes: Object.keys(movesNotes).length,
      },
      items: {
        total: 300,
        viewed: itemsViewed.length,
        favorites: itemsFavorites.length,
        notes: Object.keys(itemsNotes).length,
      },
    });
  }, []);

  // Calculate overall stats
  const totalViewed = stats.pokemon.viewed + stats.locations.viewed + stats.items.viewed;
  const totalFavorites =
    stats.pokemon.favorites +
    stats.locations.favorites +
    stats.moves.favorites +
    stats.items.favorites;
  const totalNotes =
    stats.pokemon.notes + stats.locations.notes + stats.moves.notes + stats.items.notes;
  const totalItems =
    stats.pokemon.total + stats.locations.total + stats.moves.total + stats.items.total;
  const overallProgress = Math.round(
    (totalViewed / (stats.pokemon.total + stats.locations.total + stats.items.total)) * 100,
  );

  const sections = [
    {
      id: "pokemon",
      icon: PokedexIcon,
      title: isAr ? "البوكيديكس" : "Pokédex",
      path: "/",
      color: "from-red-500/20 to-orange-500/20",
      iconColor: "text-red-500",
      stats: stats.pokemon,
    },
    {
      id: "locations",
      icon: Map,
      title: isAr ? "المواقع" : "Locations",
      path: "/map",
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-500",
      stats: stats.locations,
    },
    {
      id: "moves",
      icon: Zap,
      title: isAr ? "الحركات" : "Moves",
      path: "/moves",
      color: "from-blue-500/20 to-purple-500/20",
      iconColor: "text-blue-500",
      stats: stats.moves,
    },
    {
      id: "items",
      icon: Package,
      title: isAr ? "الأدوات" : "Items",
      path: "/items",
      color: "from-amber-500/20 to-yellow-500/20",
      iconColor: "text-amber-500",
      stats: stats.items,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <div className="relative px-4 pt-6 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Compass className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {isAr ? "لوحة الاستكشاف" : "Exploration Dashboard"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isAr ? "تتبع تقدمك في جميع الأقسام" : "Track your progress across all sections"}
                </p>
              </div>
            </div>

            {/* Overall Progress */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">
                    {isAr ? "التقدم الكلي" : "Overall Progress"}
                  </span>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {overallProgress}%
                  </Badge>
                </div>
                <Progress value={overallProgress} className="h-3 mb-4" />

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                    <Eye className="w-5 h-5 text-emerald-500 mb-1" />
                    <span className="text-lg font-bold" dir="ltr">
                      {totalViewed}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isAr ? "تمت المشاهدة" : "Viewed"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                    <Star className="w-5 h-5 text-amber-500 mb-1" />
                    <span className="text-lg font-bold" dir="ltr">
                      {totalFavorites}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isAr ? "المفضلة" : "Favorites"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                    <BookOpen className="w-5 h-5 text-blue-500 mb-1" />
                    <span className="text-lg font-bold" dir="ltr">
                      {totalNotes}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isAr ? "الملاحظات" : "Notes"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section Cards */}
        <div className="px-4 py-4 space-y-4">
          <h2 className="text-lg font-semibold mb-3">{isAr ? "الأقسام" : "Sections"}</h2>

          {sections.map((section) => {
            const IconComponent = section.icon;
            const progress =
              section.stats.viewed > 0
                ? Math.round((section.stats.viewed / section.stats.total) * 100)
                : 0;

            return (
              <Card
                key={section.id}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all duration-200",
                  "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                )}
                onClick={() => navigate(section.path)}
              >
                <div
                  className={cn("absolute inset-0 bg-gradient-to-r opacity-50", section.color)}
                />
                <CardContent className="relative p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "p-3 rounded-xl bg-background/80 backdrop-blur",
                        section.iconColor,
                      )}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{section.title}</h3>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {/* Progress Bar */}
                      <Progress value={progress} className="h-2 mb-2" />

                      {/* Stats Row */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {section.stats.viewed > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-emerald-500" />
                            <span dir="ltr">{section.stats.viewed}</span>
                          </span>
                        )}
                        {section.stats.favorites > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            <span dir="ltr">{section.stats.favorites}</span>
                          </span>
                        )}
                        {section.stats.notes > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                            <span dir="ltr">{section.stats.notes}</span>
                          </span>
                        )}
                        {section.stats.viewed === 0 &&
                          section.stats.favorites === 0 &&
                          section.stats.notes === 0 && (
                            <span>{isAr ? "ابدأ الاستكشاف!" : "Start exploring!"}</span>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Achievement Teaser */}
        <div className="px-4 py-4">
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Trophy className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {isAr ? "استمر في الاستكشاف!" : "Keep Exploring!"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isAr
                      ? "اكتشف المزيد من المحتوى واحفظ ملاحظاتك"
                      : "Discover more content and save your notes"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
