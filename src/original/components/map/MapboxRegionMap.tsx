import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Badge } from "@/original/components/ui/badge";
import { MapPin, Swords, Users } from "lucide-react";

// Mapbox public token
mapboxgl.accessToken =
  "pk.eyJ1IjoibmFuaXRhMSIsImEiOiJjbWpuejJ5M2UydHNnM2ZxeHo5cjkzamFlIn0.KZN5kfLPJQAZqlyC2HBh-w";

interface Location {
  id: number;
  name_en: string;
  name_ar: string;
  region: string;
  notes_en?: string;
  notes_ar?: string;
}

interface Gym {
  id: number;
  city_en: string;
  city_ar: string;
  leader_name_en: string;
  leader_name_ar: string;
  type: string;
}

interface NPC {
  id: number;
  name_en: string;
  name_ar: string;
  location_en: string;
  location_ar: string;
  category: string;
}

interface MapboxRegionMapProps {
  game: string;
  locations: Location[];
  gyms: Gym[];
  npcs: NPC[];
  activeLayers: string[];
  onLocationClick: (location: Location) => void;
  onGymClick?: (gym: Gym) => void;
}

// Fictional coordinates for Pokémon regions (centered on fictional map)
const regionCoordinates: Record<string, { center: [number, number]; zoom: number }> = {
  "sword-shield": { center: [0, 52], zoom: 5 }, // Galar - based on UK
  "lets-go": { center: [139.7, 35.7], zoom: 6 }, // Kanto - based on Japan
  "legends-arceus": { center: [142, 43], zoom: 6 }, // Hisui - based on Hokkaido
};

// Generate pseudo-coordinates for locations based on their names
const getLocationCoordinates = (
  location: Location,
  game: string,
  index: number,
): [number, number] => {
  const region = regionCoordinates[game] || regionCoordinates["sword-shield"];
  const baseCenter = region.center;

  // Create a deterministic but spread-out pattern
  const angle = (index * 137.5 * Math.PI) / 180; // Golden angle for good distribution
  const radius = 0.5 + (index % 5) * 0.3;

  return [baseCenter[0] + Math.cos(angle) * radius, baseCenter[1] + Math.sin(angle) * radius];
};

const getGymCoordinates = (gym: Gym, game: string, index: number): [number, number] => {
  const region = regionCoordinates[game] || regionCoordinates["sword-shield"];
  const baseCenter = region.center;

  const angle = (index * 45 * Math.PI) / 180;
  const radius = 0.8;

  return [baseCenter[0] + Math.cos(angle) * radius, baseCenter[1] + Math.sin(angle) * radius];
};

export function MapboxRegionMap({
  game,
  locations,
  gyms,
  npcs,
  activeLayers,
  onLocationClick,
  onGymClick,
}: MapboxRegionMapProps) {
  const { t, isRTL } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const region = regionCoordinates[game] || regionCoordinates["sword-shield"];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: region.center,
      zoom: region.zoom,
      pitch: 30,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map center when game changes
  useEffect(() => {
    if (!map.current) return;

    const region = regionCoordinates[game] || regionCoordinates["sword-shield"];
    map.current.flyTo({
      center: region.center,
      zoom: region.zoom,
      duration: 1500,
    });
  }, [game]);

  // Add markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add location markers
    if (activeLayers.includes("locations")) {
      locations.forEach((location, index) => {
        const coords = getLocationCoordinates(location, game, index);

        const el = document.createElement("div");
        el.className = "mapbox-marker location-marker";
        el.innerHTML = `
          <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `;

        el.addEventListener("click", () => onLocationClick(location));

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <strong>${isRTL ? location.name_ar : location.name_en}</strong>
              <p class="text-xs text-gray-500">${location.region}</p>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }

    // Add gym markers
    if (activeLayers.includes("gyms")) {
      gyms.forEach((gym, index) => {
        const coords = getGymCoordinates(gym, game, index);

        const el = document.createElement("div");
        el.className = "mapbox-marker gym-marker";
        el.innerHTML = `
          <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.5 3.5 15 6"/>
              <path d="m8.5 21.5 2.5-2.5"/>
              <path d="M18.5 8.5 21 6"/>
              <path d="m2.5 18.5 2.5-2.5"/>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
          </div>
        `;

        if (onGymClick) {
          el.addEventListener("click", () => onGymClick(gym));
        }

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <strong>${isRTL ? gym.leader_name_ar : gym.leader_name_en}</strong>
              <p class="text-xs text-gray-500">${isRTL ? gym.city_ar : gym.city_en}</p>
              <span class="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">${gym.type}</span>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }

    // Add NPC markers
    if (activeLayers.includes("npcs")) {
      npcs.slice(0, 20).forEach((npc, index) => {
        const region = regionCoordinates[game] || regionCoordinates["sword-shield"];
        const angle = ((index + locations.length) * 137.5 * Math.PI) / 180;
        const radius = 0.4 + (index % 4) * 0.25;
        const coords: [number, number] = [
          region.center[0] + Math.cos(angle) * radius,
          region.center[1] + Math.sin(angle) * radius,
        ];

        const el = document.createElement("div");
        el.className = "mapbox-marker npc-marker";
        el.innerHTML = `
          <div class="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <strong>${isRTL ? npc.name_ar : npc.name_en}</strong>
              <p class="text-xs text-gray-500">${isRTL ? npc.location_ar : npc.location_en}</p>
              <span class="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">${npc.category}</span>
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }
  }, [locations, gyms, npcs, activeLayers, mapLoaded, game, isRTL, onLocationClick, onGymClick]);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
          {t("Legend", "دليل الخريطة")}
        </h4>
        <div className="flex flex-col gap-1.5">
          {activeLayers.includes("locations") && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <MapPin className="w-2.5 h-2.5 text-white" />
              </div>
              <span>{t("Locations", "المواقع")}</span>
              <Badge variant="secondary" className="text-[10px] h-4">
                {locations.length}
              </Badge>
            </div>
          )}
          {activeLayers.includes("gyms") && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <Swords className="w-2.5 h-2.5 text-white" />
              </div>
              <span>{t("Gyms", "الصالات")}</span>
              <Badge variant="secondary" className="text-[10px] h-4">
                {gyms.length}
              </Badge>
            </div>
          )}
          {activeLayers.includes("npcs") && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-2.5 h-2.5 text-white" />
              </div>
              <span>{t("NPCs", "الشخصيات")}</span>
              <Badge variant="secondary" className="text-[10px] h-4">
                {npcs.length}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
