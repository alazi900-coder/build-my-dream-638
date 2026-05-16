import { useLanguage } from "@/original/contexts/LanguageContext";
import { Label } from "@/original/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/original/components/ui/select";
import { Button } from "@/original/components/ui/button";
import { Slider } from "@/original/components/ui/slider";
import { Switch } from "@/original/components/ui/switch";
import { Badge } from "@/original/components/ui/badge";
import { Filter, X, Star, Sparkles } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/original/components/ui/collapsible";
import { useState } from "react";

export interface MapFilters {
  pokemonType: string;
  minLevel: number;
  maxLevel: number;
  legendaryOnly: boolean;
  exclusiveOnly: boolean;
}

interface AdvancedMapFiltersProps {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  availableTypes: string[];
}

const pokemonTypes = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
];

export function AdvancedMapFilters({ filters, onChange, availableTypes }: AdvancedMapFiltersProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.pokemonType !== "all" ||
    filters.minLevel > 1 ||
    filters.maxLevel < 100 ||
    filters.legendaryOnly ||
    filters.exclusiveOnly;

  const resetFilters = () => {
    onChange({
      pokemonType: "all",
      minLevel: 1,
      maxLevel: 100,
      legendaryOnly: false,
      exclusiveOnly: false,
    });
  };

  const activeFilterCount = [
    filters.pokemonType !== "all",
    filters.minLevel > 1 || filters.maxLevel < 100,
    filters.legendaryOnly,
    filters.exclusiveOnly,
  ].filter(Boolean).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            {t("Advanced Filters", "فلاتر متقدمة")}
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-1 text-muted-foreground"
          >
            <X className="w-4 h-4" />
            {t("Reset", "إعادة")}
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
          {/* Pokemon Type Filter */}
          <div className="space-y-2">
            <Label className="text-sm">{t("Pokémon Type", "نوع البوكيمون")}</Label>
            <Select
              value={filters.pokemonType}
              onValueChange={(value) => onChange({ ...filters, pokemonType: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Types", "كل الأنواع")}</SelectItem>
                {pokemonTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level Range */}
          <div className="space-y-2">
            <Label className="text-sm">
              {t("Level Range", "نطاق المستوى")}: {filters.minLevel} - {filters.maxLevel}
            </Label>
            <div className="pt-2">
              <Slider
                value={[filters.minLevel, filters.maxLevel]}
                min={1}
                max={100}
                step={5}
                onValueChange={([min, max]) =>
                  onChange({ ...filters, minLevel: min, maxLevel: max })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Legendary Only */}
          <div className="flex items-center gap-3">
            <Switch
              id="legendary-only"
              checked={filters.legendaryOnly}
              onCheckedChange={(checked) => onChange({ ...filters, legendaryOnly: checked })}
            />
            <Label
              htmlFor="legendary-only"
              className="flex items-center gap-1.5 cursor-pointer text-sm"
            >
              <Star className="w-4 h-4 text-yellow-500" />
              {t("Legendary Only", "الأسطوريين فقط")}
            </Label>
          </div>

          {/* Exclusive Only */}
          <div className="flex items-center gap-3">
            <Switch
              id="exclusive-only"
              checked={filters.exclusiveOnly}
              onCheckedChange={(checked) => onChange({ ...filters, exclusiveOnly: checked })}
            />
            <Label
              htmlFor="exclusive-only"
              className="flex items-center gap-1.5 cursor-pointer text-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              {t("Exclusive Only", "الحصريين فقط")}
            </Label>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
