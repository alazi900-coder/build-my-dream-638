import { useState } from "react";
import { Sparkles, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/original/components/ui/input";
import { Button } from "@/original/components/ui/button";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { TYPE_LABELS } from "@/original/lib/localization";
import { useUnifiedPokemonData } from "@/original/hooks/useUnifiedPokemonData";
import { OfflineDataRequired } from "@/original/components/OfflineDataRequired";
import { UnifiedPokemonCard } from "@/original/components/pokemon/UnifiedPokemonCard";

// Type filter keys (English for filtering)
const typeFilterKeys = [
  "all",
  "fighting",
  "grass",
  "fire",
  "water",
  "dragon",
  "ghost",
  "steel",
  "rock",
  "dark",
  "normal",
  "poison",
  "electric",
  "fairy",
  "psychic",
  "bug",
  "ground",
  "ice",
  "flying",
];

const PokemonGrid = () => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const { pokemon, loading, error, isEmpty, refresh } = useUnifiedPokemonData();

  const filteredPokemon = pokemon.filter((p) => {
    const matchesSearch =
      p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name_ar.includes(searchTerm) ||
      p.id.toString().includes(searchTerm);

    const pokemonTypesLower = p.types.map((t) => t.toLowerCase());
    const matchesType = selectedType === "all" || pokemonTypesLower.includes(selectedType);

    return matchesSearch && matchesType;
  });

  const getTypeLabel = (typeKey: string) => {
    if (typeKey === "all") {
      return language === "ar" ? "الكل" : "All";
    }
    return TYPE_LABELS[typeKey]?.[language] || typeKey;
  };

  // Show offline data required if empty and error is offline_no_data
  if (isEmpty && error === "offline_no_data") {
    return (
      <section id="pokemon" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <OfflineDataRequired onRetry={refresh} />
        </div>
      </section>
    );
  }

  return (
    <section id="pokemon" className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-12 h-12 text-accent" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">{t("Pokémon", "البوكيمونات")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("Loading...", "جاري التحميل...")}
              </span>
            ) : (
              t(
                `${pokemon.length} Pokémon available with evolutions, moves, and locations`,
                `${pokemon.length} بوكيمون متاح مع التطورات والحركات والأماكن`,
              )
            )}
          </p>

          {/* Search and Filter */}
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("Search by name or number...", "ابحث بالاسم أو الرقم...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-background"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              {typeFilterKeys.map((typeKey) => (
                <Button
                  key={typeKey}
                  variant={selectedType === typeKey ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(typeKey)}
                  className="text-xs"
                >
                  {getTypeLabel(typeKey)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-muted-foreground mb-6">
          {t(
            `Showing ${filteredPokemon.length} of ${pokemon.length} Pokémon`,
            `عرض ${filteredPokemon.length} من ${pokemon.length} بوكيمون`,
          )}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPokemon.slice(0, 50).map((p, index) => (
            <UnifiedPokemonCard key={p.id} pokemon={p} index={index} />
          ))}
        </div>

        {filteredPokemon.length > 50 && (
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              {t(
                `Showing first 50 of ${filteredPokemon.length} results. Use the Dex page for full list.`,
                `عرض أول 50 من ${filteredPokemon.length} نتيجة. استخدم صفحة الدليل للقائمة الكاملة.`,
              )}
            </p>
          </div>
        )}

        {filteredPokemon.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <p>
              {t("No Pokémon found matching your search", "لم يتم العثور على بوكيمون مطابق للبحث")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PokemonGrid;
