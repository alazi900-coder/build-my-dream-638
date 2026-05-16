import { useLanguage } from "@/original/contexts/LanguageContext";
import { Switch } from "@/original/components/ui/switch";
import { Label } from "@/original/components/ui/label";
import { MapPin, Building, Users, Swords } from "lucide-react";

export type MapLayer = "locations" | "gyms" | "npcs";

interface MapLayerToggleProps {
  activeLayers: MapLayer[];
  onChange: (layers: MapLayer[]) => void;
}

const layers: {
  id: MapLayer;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  color: string;
}[] = [
  {
    id: "locations",
    icon: MapPin,
    labelEn: "Locations",
    labelAr: "المواقع",
    color: "text-green-500",
  },
  { id: "gyms", icon: Swords, labelEn: "Gyms", labelAr: "الصالات", color: "text-red-500" },
  { id: "npcs", icon: Users, labelEn: "NPCs", labelAr: "الشخصيات", color: "text-blue-500" },
];

export function MapLayerToggle({ activeLayers, onChange }: MapLayerToggleProps) {
  const { t } = useLanguage();

  const toggleLayer = (layerId: MapLayer) => {
    if (activeLayers.includes(layerId)) {
      onChange(activeLayers.filter((l) => l !== layerId));
    } else {
      onChange([...activeLayers, layerId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg border">
      {layers.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayers.includes(layer.id);
        return (
          <div key={layer.id} className="flex items-center gap-2">
            <Switch
              id={`layer-${layer.id}`}
              checked={isActive}
              onCheckedChange={() => toggleLayer(layer.id)}
            />
            <Label
              htmlFor={`layer-${layer.id}`}
              className={`flex items-center gap-1.5 cursor-pointer text-sm ${isActive ? layer.color : "text-muted-foreground"}`}
            >
              <Icon className="w-4 h-4" />
              {t(layer.labelEn, layer.labelAr)}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
