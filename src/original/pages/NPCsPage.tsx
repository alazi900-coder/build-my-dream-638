import { useState, useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useNPCs } from "@/original/hooks/useNPCs";
import { NPC } from "@/original/types/pokemon";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { SearchBar } from "@/original/components/ui/search-bar";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Card, CardContent } from "@/original/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { EmptyState } from "@/original/components/ui/empty-state";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import {
  MapPin,
  User,
  Crown,
  Swords,
  FlaskConical,
  Users,
  Skull,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { cn } from "@/original/lib/utils";
import { NPC_CATEGORY_COLORS } from "@/original/styles/design-tokens";
import { NPCRelationships } from "@/original/components/npc/NPCRelationships";
import { NPCRewards } from "@/original/components/npc/NPCRewards";

const categoryFilters = [
  "all",
  "gym_leader",
  "champion",
  "rival",
  "professor",
  "villain",
  "important",
] as const;

const categoryLabels: Record<string, { en: string; ar: string }> = {
  all: { en: "All", ar: "الكل" },
  gym_leader: { en: "Gym Leaders", ar: "قادة الصالات" },
  champion: { en: "Champion", ar: "البطل" },
  rival: { en: "Rivals", ar: "المنافسون" },
  professor: { en: "Professors", ar: "الأساتذة" },
  villain: { en: "Villains", ar: "الأشرار" },
  important: { en: "Important", ar: "مهمون" },
};

const categoryIcons: Record<string, React.ElementType> = {
  gym_leader: Swords,
  champion: Crown,
  rival: Users,
  professor: FlaskConical,
  villain: Skull,
  important: User,
};

// Card gradient colors using semantic tokens
const categoryCardColors: Record<string, string> = {
  gym_leader: "from-accent/20 to-destructive/10 border-accent/30",
  champion: "from-chart-3/20 to-accent/10 border-chart-3/30",
  rival: "from-secondary/20 to-chart-2/10 border-secondary/30",
  professor: "from-chart-4/20 to-chart-4/10 border-chart-4/30",
  villain: "from-primary/20 to-chart-1/10 border-primary/30",
  important: "from-muted to-muted/50 border-border",
};

// Badge colors using centralized tokens
const categoryBadgeColors: Record<string, string> = {
  gym_leader: NPC_CATEGORY_COLORS.gym_leader,
  champion: NPC_CATEGORY_COLORS.champion,
  rival: NPC_CATEGORY_COLORS.rival,
  professor: NPC_CATEGORY_COLORS.professor,
  villain: NPC_CATEGORY_COLORS.villain,
  important: NPC_CATEGORY_COLORS.important,
};

export default function NPCsPage() {
  const { t, language, tr } = useLanguage();
  const { data: npcs, loading, error } = useNPCs();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredNPCs = useMemo(() => {
    return npcs.filter((npc) => {
      const matchesSearch =
        search === "" ||
        npc.name_en.toLowerCase().includes(search.toLowerCase()) ||
        npc.name_ar.includes(search);

      const matchesCategory = selectedCategory === "all" || npc.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [npcs, search, selectedCategory]);

  // Sort NPCs: gym leaders by badge_order, then others
  const sortedNPCs = useMemo(() => {
    return [...filteredNPCs].sort((a, b) => {
      // Gym leaders first, sorted by badge_order
      if (a.category === "gym_leader" && b.category === "gym_leader") {
        return (a.badge_order || 0) - (b.badge_order || 0);
      }
      if (a.category === "gym_leader") return -1;
      if (b.category === "gym_leader") return 1;

      // Then champions
      if (a.category === "champion") return -1;
      if (b.category === "champion") return 1;

      return 0;
    });
  }, [filteredNPCs]);

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
          title={tr("page.npcs.title")}
          description={tr("page.npcs.subtitle").replace("{count}", String(filteredNPCs.length))}
          icon={Users}
        />

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={{ en: "Search characters...", ar: "بحث عن الشخصيات..." }}
        />

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categoryFilters.map((category) => {
            const Icon = categoryIcons[category] || User;
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap shrink-0 gap-1.5"
              >
                {category !== "all" && <Icon className="w-4 h-4" />}
                {language === "ar" ? categoryLabels[category].ar : categoryLabels[category].en}
              </Button>
            );
          })}
        </div>

        {/* NPCs Grid */}
        {loading ? (
          <LoadingSkeleton count={8} type="card" />
        ) : sortedNPCs.length === 0 ? (
          <EmptyState
            type={npcs.length === 0 ? "empty" : "no-results"}
            message={npcs.length === 0 ? tr("page.npcs.noData") : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNPCs.map((npc) => (
              <NPCCard key={npc.id} npc={npc} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function NPCCard({ npc }: { npc: NPC }) {
  const { t, language, tr } = useLanguage();
  const Icon = categoryIcons[npc.category] || User;
  const gradientClass = categoryCardColors[npc.category] || categoryCardColors.important;
  const badgeClass = categoryBadgeColors[npc.category] || categoryBadgeColors.important;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          className={cn(
            "cursor-pointer border transition-all hover:scale-[1.02] hover:shadow-lg overflow-hidden",
            "bg-gradient-to-br",
            gradientClass,
          )}
        >
          <CardContent className="p-0">
            {/* Header with Image */}
            <div className="relative">
              {/* Character Image */}
              <div className="h-40 flex items-center justify-center bg-gradient-to-b from-background/50 to-transparent">
                <OfflineImage
                  src={npc.image_url || ""}
                  alt={language === "ar" ? npc.name_ar : npc.name_en}
                  className="h-36 object-contain drop-shadow-lg hover:scale-105 transition-transform"
                  placeholderType="npc"
                  trainerName={npc.name_en}
                />
              </div>

              {/* Badge Order for Gym Leaders */}
              {npc.category === "gym_leader" && npc.badge_order && (
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
                  {npc.badge_order}
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className={cn("text-xs", badgeClass)}>
                  <Icon className="w-3 h-3 mr-1" />
                  {language === "ar"
                    ? categoryLabels[npc.category]?.ar
                    : categoryLabels[npc.category]?.en}
                </Badge>
              </div>
            </div>

            {/* Info Section */}
            <div className="p-4 space-y-2 bg-card/80 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground truncate">
                    {language === "ar" ? npc.name_ar || tr("npc.nameBeingAdded") : npc.name_en}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {language === "ar" ? npc.role_ar || tr("npc.roleBeingAdded") : npc.role_en}
                  </p>
                </div>
                {npc.specialty_type && <TypeBadge type={npc.specialty_type} size="sm" />}
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {language === "ar"
                    ? npc.location_ar || tr("npc.locationBeingAdded")
                    : npc.location_en}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
        {/* Header with gradient background */}
        <div className={cn("relative p-6 bg-gradient-to-br", gradientClass)}>
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              {/* Large Character Image */}
              <div className="w-32 h-32 mb-4 flex items-center justify-center">
                <OfflineImage
                  src={npc.image_url || ""}
                  alt={language === "ar" ? npc.name_ar : npc.name_en}
                  className="h-full object-contain drop-shadow-xl"
                  placeholderType="npc"
                  trainerName={npc.name_en}
                />
              </div>

              <DialogTitle className="text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {language === "ar" ? npc.name_ar || tr("npc.nameBeingAdded") : npc.name_en}
                </h2>
                {language !== "ar" && npc.name_ar && (
                  <p className="text-muted-foreground font-normal mt-1">{npc.name_ar}</p>
                )}
              </DialogTitle>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                <Badge variant="outline" className={cn("gap-1", badgeClass)}>
                  <Icon className="w-3 h-3" />
                  {language === "ar"
                    ? categoryLabels[npc.category]?.ar
                    : categoryLabels[npc.category]?.en}
                </Badge>
                {npc.specialty_type && <TypeBadge type={npc.specialty_type} />}
                {npc.badge_order && npc.category === "gym_leader" && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    {tr("npc.gym").replace("{order}", String(npc.badge_order))}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4">
          {/* Role */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <User className="w-4 h-4 text-primary" />
              {tr("npc.role")}
            </div>
            <p className="text-foreground">
              {language === "ar" ? npc.role_ar || tr("npc.roleBeingAdded") : npc.role_en}
            </p>
          </div>

          {/* Location */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              {tr("npc.location")}
            </div>
            <p className="text-foreground">
              {language === "ar"
                ? npc.location_ar || tr("npc.locationBeingAdded")
                : npc.location_en}
            </p>
          </div>

          {/* Story */}
          {(language === "ar" ? npc.story_ar : npc.story_en) && (
            <div className="bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {tr("npc.story")}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {language === "ar" ? npc.story_ar || tr("npc.storyBeingAdded") : npc.story_en}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
