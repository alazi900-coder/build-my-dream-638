import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { Item } from "@/original/types/pokemon";
import { Layout } from "@/original/components/layout/Layout";
import { Button } from "@/original/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { ItemPreviewModal } from "@/original/components/items/ItemPreviewModal";
import { RelatedItemsSection } from "@/original/components/items/RelatedItemsSection";
import { ItemNotesSection } from "@/original/components/items/ItemNotesSection";
import { UsageTipsSection } from "@/original/components/items/UsageTipsSection";
import { ItemRating } from "@/original/components/items/ItemRating";
import { ItemWishlist } from "@/original/components/items/ItemWishlist";
import { LtrToken } from "@/original/components/ui/ltr-token";
import {
  getItemSpriteUrl,
  generateTLDR,
  getUsageLabels,
  getCategoryGradient,
  getGenericObtainInfo,
  getGameDisplayInfo,
  getBulbapediaUrl,
} from "@/original/lib/itemUtils";
import {
  ArrowLeft,
  MapPin,
  Package,
  Sparkles,
  Info,
  Target,
  Pill,
  Cherry,
  Circle,
  Zap,
  Shield,
  FlaskConical,
  Disc,
  Key,
  Users,
  Eye,
  Star,
  Share2,
  Lightbulb,
  ExternalLink,
  Gamepad2,
  CheckCircle,
  Search,
  Grid,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/original/lib/utils";
import { NextSteps } from "@/original/components/layout/NextSteps";
import "@/original/styles/item-animations.css";

interface ObtainInfo {
  location_en?: string;
  location_ar?: string;
  method_en?: string;
  method_ar?: string;
}

interface PokemonHeldItem {
  id: number;
  pokemon_id: number;
  item_id: number;
  hold_chance: number;
  game_id: string;
}

interface PokemonBasic {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
}

type ItemWithDetails = Item & {
  available_in?: string[];
  obtain?: ObtainInfo[];
};

// Category styling - simplified to use semantic colors
const getCategoryColor = (category: string): string => {
  // Use primary for important categories, muted for others
  const primaryCategories = ["evolution", "healing", "standard-balls"];
  if (primaryCategories.includes(category)) {
    return "bg-primary/10 text-primary border-primary/30";
  }
  return "bg-muted text-muted-foreground border-border";
};

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    healing: Pill,
    medicine: Pill,
    revival: Sparkles,
    "status-cures": Shield,
    "pp-recovery": Zap,
    evolution: Sparkles,
    "standard-balls": Circle,
    "special-balls": Circle,
    "apricorn-balls": Circle,
    berries: Cherry,
    "held-items": Package,
    "type-enhancement": Target,
    "species-specific": Target,
    "stat-boosts": FlaskConical,
    "all-machines": Disc,
    vitamins: FlaskConical,
    "plot-advancement": Key,
  };
  return iconMap[category] || Package;
};

const getCategoryLabel = (category: string, language: "en" | "ar"): string => {
  const labels: Record<string, { en: string; ar: string }> = {
    healing: { en: "Healing", ar: "علاج" },
    medicine: { en: "Medicine", ar: "دواء" },
    revival: { en: "Revival", ar: "إحياء" },
    "status-cures": { en: "Status Cures", ar: "علاج الحالات" },
    "pp-recovery": { en: "PP Recovery", ar: "استعادة PP" },
    evolution: { en: "Evolution", ar: "تطور" },
    "standard-balls": { en: "Poké Balls", ar: "كرات بوكيمون" },
    "special-balls": { en: "Special Balls", ar: "كرات خاصة" },
    "apricorn-balls": { en: "Apricorn Balls", ar: "كرات أبريكورن" },
    berries: { en: "Berries", ar: "توت" },
    "held-items": { en: "Held Items", ar: "أدوات محمولة" },
    "type-enhancement": { en: "Type Boost", ar: "تعزيز النوع" },
    "species-specific": { en: "Species-Specific", ar: "خاص بنوع معين" },
    "stat-boosts": { en: "Stat Boosts", ar: "تعزيز الإحصائيات" },
    "all-machines": { en: "TMs/HMs", ar: "آلات التعليم" },
    vitamins: { en: "Vitamins", ar: "فيتامينات" },
    "plot-advancement": { en: "Key Items", ar: "أدوات رئيسية" },
  };
  return labels[category]?.[language] || category;
};

const getPokemonSpriteUrl = (id: number) => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: items, loading: itemsLoading } = useOfflineData<ItemWithDetails>({
    table: "items",
  });
  const { data: pokemonHeldItems } = useOfflineData<PokemonHeldItem>({
    table: "pokemon_held_items",
  });
  const { data: allPokemon } = useOfflineData<PokemonBasic>({ table: "pokemon" });

  const item = items?.find((i) => i.id === Number(id));

  // Load favorite status
  useEffect(() => {
    if (item) {
      const favorites = JSON.parse(localStorage.getItem("favoriteItems") || "[]");
      setIsFavorite(favorites.includes(item.id));
    }
  }, [item]);

  const toggleFavorite = () => {
    if (!item) return;
    const favorites = JSON.parse(localStorage.getItem("favoriteItems") || "[]");
    const newFavorites = isFavorite
      ? favorites.filter((fid: number) => fid !== item.id)
      : [...favorites, item.id];
    localStorage.setItem("favoriteItems", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
    toast.success(
      isFavorite
        ? language === "ar"
          ? "تمت إزالة الأداة من المفضلة"
          : "Removed from favorites"
        : language === "ar"
          ? "تمت إضافة الأداة للمفضلة"
          : "Added to favorites",
    );
  };

  const handleShare = async () => {
    const shareData = {
      title: item?.name_en || "Item",
      text:
        language === "ar"
          ? `شاهد ${item?.name_ar || item?.name_en} في PokeApp`
          : `Check out ${item?.name_en} in PokeApp`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(language === "ar" ? "تم نسخ الرابط" : "Link copied");
    }
  };

  // Get Pokemon that hold this item
  const relatedPokemonData = pokemonHeldItems
    ?.filter((phi) => phi.item_id === Number(id))
    .map((phi) => {
      const pokemon = allPokemon?.find((p) => p.id === phi.pokemon_id);
      return pokemon ? { ...pokemon, holdChance: phi.hold_chance } : null;
    })
    .filter(Boolean) as (PokemonBasic & { holdChance: number })[];

  if (itemsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <LoadingSkeleton type="detail" />
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground mb-4">
            {language === "ar" ? "الأداة غير موجودة" : "Item not found"}
          </p>
          <Button onClick={() => navigate("/items")}>
            <ArrowLeft className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {language === "ar" ? "العودة للأدوات" : "Back to Items"}
          </Button>
        </div>
      </Layout>
    );
  }

  const CategoryIcon = getCategoryIcon(item.category);
  const itemSpriteUrl = getItemSpriteUrl(item.name_en);
  const displayName = language === "ar" && item.name_ar ? item.name_ar : item.name_en;
  const displayEffect = language === "ar" && item.effect_ar ? item.effect_ar : item.effect_en;
  const displayUsage = language === "ar" && item.usage_ar ? item.usage_ar : item.usage_en;
  const usageLabels = getUsageLabels(item.category, language);
  const tldr = generateTLDR(displayEffect, item.category, language);

  // Process obtain locations
  const obtainLocations = item.obtain || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Sticky Back Button */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-border/50">
          <Button variant="ghost" size="sm" onClick={() => navigate("/items")} className="gap-2">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {language === "ar" ? "العودة" : "Back"}
          </Button>
        </div>

        {/* Hero Header */}
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden p-6",
            "bg-gradient-to-br",
            getCategoryGradient(item.category),
          )}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

          <div className="relative flex flex-col items-center text-center space-y-4">
            {/* Item Image with glow */}
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-28 h-28 bg-background/60 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-border/50 shadow-xl hover:scale-105 transition-transform cursor-pointer group relative"
            >
              <OfflineImage
                src={itemSpriteUrl}
                alt={item.name_en}
                className="w-24 h-24 object-contain"
                placeholderType="item"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <Eye className="w-6 h-6 text-primary" />
              </div>
            </button>

            {/* Name + ID */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              <div className="flex items-center justify-center gap-2 mt-1 text-sm text-muted-foreground">
                {language === "ar" && item.name_ar !== item.name_en && <span>{item.name_en}</span>}
                <LtrToken className="opacity-60">#{item.id.toString().padStart(3, "0")}</LtrToken>
              </div>
            </div>

            {/* Category + Usage Badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className={cn("gap-1", getCategoryColor(item.category))}>
                <CategoryIcon className="w-3 h-3" />
                {getCategoryLabel(item.category, language)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {usageLabels.context}
              </Badge>
              {usageLabels.trigger && (
                <Badge variant="outline" className="text-xs bg-background/50">
                  {usageLabels.trigger}
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant={isFavorite ? "default" : "outline"}
                size="sm"
                onClick={toggleFavorite}
                className="gap-1"
              >
                <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
                {language === "ar"
                  ? isFavorite
                    ? "مفضل"
                    : "مفضلة"
                  : isFavorite
                    ? "Saved"
                    : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-1">
                <Share2 className="w-4 h-4" />
                {language === "ar" ? "مشاركة" : "Share"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="gap-1"
              >
                <Eye className="w-4 h-4" />
                {language === "ar" ? "معاينة" : "Preview"}
              </Button>
            </div>
          </div>
        </div>

        {/* TL;DR Card */}
        {displayEffect && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-primary font-medium mb-1">
                    {language === "ar" ? "باختصار" : "In Brief"}
                  </p>
                  <p className="text-foreground font-medium">{tldr}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Effect Section */}
        {displayEffect && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-primary" />
                {language === "ar" ? "التأثير" : "Effect"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{displayEffect}</p>
            </CardContent>
          </Card>
        )}

        {/* Usage Section */}
        {displayUsage && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-primary" />
                {language === "ar" ? "طريقة الاستخدام" : "How to Use"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{displayUsage}</p>
            </CardContent>
          </Card>
        )}

        {/* Usage Tips Section */}
        <UsageTipsSection category={item.category} />

        {/* Obtain Locations - Enhanced with Generic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              {language === "ar" ? "طريقة الحصول عليها" : "How to Obtain"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Specific obtain locations if available */}
            {obtainLocations.length > 0 && (
              <div className="space-y-3">
                {obtainLocations.map((loc, index) => {
                  const location =
                    language === "ar"
                      ? loc.location_ar || loc.location_en || ""
                      : loc.location_en || "";
                  const method =
                    language === "ar" ? loc.method_ar || loc.method_en || "" : loc.method_en || "";

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border"
                    >
                      <MapPin className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          {location || (language === "ar" ? "موقع غير محدد" : "Unknown Location")}
                        </p>
                        {method && <p className="text-sm text-muted-foreground mt-1">{method}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Generic obtain info based on category */}
            {(() => {
              const genericInfo = getGenericObtainInfo(item.category, language);
              return (
                <div className="space-y-3">
                  {obtainLocations.length === 0 && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {language === "ar"
                        ? "معلومات عامة عن هذا النوع من الأدوات:"
                        : "General info for this type of item:"}
                    </p>
                  )}

                  <div className="grid gap-2">
                    {genericInfo.methods.map((method, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50"
                      >
                        <span className="text-xl shrink-0">{method.icon}</span>
                        <div>
                          <p className="font-medium text-foreground text-sm">{method.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground/70 italic mt-2 flex items-start gap-1.5">
                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                    {genericInfo.note}
                  </p>

                  {/* Bulbapedia link */}
                  <div className="pt-2 border-t border-border/50">
                    <a
                      href={getBulbapediaUrl(item.name_en)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {language === "ar" ? "ابحث في Bulbapedia" : "Search on Bulbapedia"}
                    </a>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Related Pokemon Section */}
        {relatedPokemonData && relatedPokemonData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                {language === "ar" ? "البوكيمون المرتبط" : "Related Pokémon"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {relatedPokemonData.map((pokemon) => (
                  <Link
                    key={pokemon.id}
                    to={`/pokemon/${pokemon.id}`}
                    className="flex flex-col items-center p-3 bg-muted/30 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <OfflineImage
                      src={getPokemonSpriteUrl(pokemon.id)}
                      alt={pokemon.name_en}
                      className="w-16 h-16 object-contain"
                      placeholderType="pokemon"
                    />
                    <p className="font-medium text-foreground text-sm mt-2 text-center">
                      {language === "ar" ? pokemon.name_ar : pokemon.name_en}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {pokemon.holdChance === 100
                        ? language === "ar"
                          ? "محمول دائماً"
                          : "Always held"
                        : language === "ar"
                          ? `نسبة ${pokemon.holdChance}%`
                          : `${pokemon.holdChance}% chance`}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Items Section */}
        {items && (
          <RelatedItemsSection currentItemId={item.id} category={item.category} allItems={items} />
        )}

        {/* Available In Games - Enhanced with full names and icons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gamepad2 className="w-5 h-5 text-primary" />
              {language === "ar" ? "متوفرة في الألعاب" : "Available In Games"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {item.available_in && item.available_in.length > 0 ? (
              <div className="grid gap-2">
                {item.available_in.map((gameId) => {
                  const gameInfo = getGameDisplayInfo(gameId);
                  return (
                    <div
                      key={gameId}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${gameInfo.color}`}
                    >
                      <span className="text-xl">{gameInfo.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">
                          {language === "ar" ? gameInfo.name_ar : gameInfo.name_en}
                        </p>
                        {language === "ar" && (
                          <p className="text-xs text-muted-foreground">{gameInfo.name_en}</p>
                        )}
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {language === "ar" ? "غير محدد في أي لعبة" : "Not specified for any game"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Rating */}
        <ItemRating category={item.category} itemName={displayName} />

        {/* Wishlist */}
        <ItemWishlist itemId={item.id} itemName={displayName} />

        {/* My Notes Section */}
        <div id="notes-section">
          <ItemNotesSection itemId={item.id} />
        </div>

        {/* Next Steps - Guide user to next action */}
        <NextSteps
          actions={[
            {
              label: language === "ar" ? "العودة للقائمة" : "Back to Items",
              icon: Grid,
              onClick: () => navigate("/items"),
            },
            ...(relatedPokemonData && relatedPokemonData.length > 0
              ? [
                  {
                    label: language === "ar" ? "عرض البوكيمون" : "View Pokémon",
                    icon: Search,
                    onClick: () => navigate(`/pokemon/${relatedPokemonData[0].id}`),
                  },
                ]
              : []),
          ]}
        />

        {/* Item Preview Modal */}
        <ItemPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} item={item} />
      </div>
    </Layout>
  );
}
