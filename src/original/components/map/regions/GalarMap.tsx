import { useLanguage } from "@/original/contexts/LanguageContext";
import { useState, useEffect } from "react";

interface GalarMapProps {
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string, event: React.MouseEvent) => void;
  onZoneLeave?: () => void;
  highlightedZone?: string;
  markers?: { zoneId: string; type: "location" | "gym" | "npc"; count?: number }[];
  isNavigating?: boolean;
  navigationPath?: { from: string; to: string } | null;
}

// Galar region zones with paths
const galarZones = [
  {
    id: "postwick",
    path: "M 180 380 L 200 380 L 200 400 L 180 400 Z",
    cx: 190,
    cy: 390,
    labelEn: "Postwick",
    labelAr: "بوستويك",
  },
  {
    id: "wedgehurst",
    path: "M 175 350 L 205 350 L 205 375 L 175 375 Z",
    cx: 190,
    cy: 362,
    labelEn: "Wedgehurst",
    labelAr: "ودجهورست",
  },
  {
    id: "route1",
    path: "M 185 375 Q 190 380 195 375",
    cx: 190,
    cy: 378,
    labelEn: "Route 1",
    labelAr: "الطريق 1",
    isRoute: true,
  },
  {
    id: "route2",
    path: "M 185 325 Q 175 340 185 350",
    cx: 175,
    cy: 340,
    labelEn: "Route 2",
    labelAr: "الطريق 2",
    isRoute: true,
  },
  {
    id: "wild_area",
    path: "M 120 200 L 280 200 L 280 300 L 120 300 Z",
    cx: 200,
    cy: 250,
    labelEn: "Wild Area",
    labelAr: "المنطقة البرية",
    isWild: true,
  },
  {
    id: "motostoke",
    path: "M 220 170 L 260 170 L 260 195 L 220 195 Z",
    cx: 240,
    cy: 182,
    labelEn: "Motostoke",
    labelAr: "موتوستوك",
    hasGym: true,
  },
  {
    id: "turffield",
    path: "M 80 160 L 115 160 L 115 185 L 80 185 Z",
    cx: 97,
    cy: 172,
    labelEn: "Turffield",
    labelAr: "تورففيلد",
    hasGym: true,
  },
  {
    id: "hulbury",
    path: "M 280 170 L 315 170 L 315 195 L 280 195 Z",
    cx: 297,
    cy: 182,
    labelEn: "Hulbury",
    labelAr: "هالبري",
    hasGym: true,
  },
  {
    id: "galar_mine",
    path: "M 140 180 L 160 180 L 160 200 L 140 200 Z",
    cx: 150,
    cy: 190,
    labelEn: "Galar Mine",
    labelAr: "منجم غالار",
    isCave: true,
  },
  {
    id: "stow_on_side",
    path: "M 60 110 L 95 110 L 95 135 L 60 135 Z",
    cx: 77,
    cy: 122,
    labelEn: "Stow-on-Side",
    labelAr: "ستو-أون-سايد",
    hasGym: true,
  },
  {
    id: "ballonlea",
    path: "M 100 70 L 135 70 L 135 95 L 100 95 Z",
    cx: 117,
    cy: 82,
    labelEn: "Ballonlea",
    labelAr: "بالونليا",
    hasGym: true,
  },
  {
    id: "circhester",
    path: "M 175 50 L 215 50 L 215 75 L 175 75 Z",
    cx: 195,
    cy: 62,
    labelEn: "Circhester",
    labelAr: "سيرتشستر",
    hasGym: true,
  },
  {
    id: "spikemuth",
    path: "M 260 40 L 295 40 L 295 65 L 260 65 Z",
    cx: 277,
    cy: 52,
    labelEn: "Spikemuth",
    labelAr: "سبايكموث",
    hasGym: true,
  },
  {
    id: "hammerlocke",
    path: "M 170 120 L 220 120 L 220 155 L 170 155 Z",
    cx: 195,
    cy: 137,
    labelEn: "Hammerlocke",
    labelAr: "هامرلوك",
    hasGym: true,
  },
  {
    id: "wyndon",
    path: "M 165 10 L 225 10 L 225 45 L 165 45 Z",
    cx: 195,
    cy: 27,
    labelEn: "Wyndon",
    labelAr: "ويندون",
    isCapital: true,
  },
  {
    id: "slumbering_weald",
    path: "M 140 370 L 170 370 L 170 395 L 140 395 Z",
    cx: 155,
    cy: 382,
    labelEn: "Slumbering Weald",
    labelAr: "الغابة النائمة",
    isForest: true,
  },
  {
    id: "lake_of_outrage",
    path: "M 90 220 L 115 220 L 115 245 L 90 245 Z",
    cx: 102,
    cy: 232,
    labelEn: "Lake of Outrage",
    labelAr: "بحيرة الغضب",
    isLake: true,
  },
  {
    id: "giants_mirror",
    path: "M 250 220 L 275 220 L 275 245 L 250 245 Z",
    cx: 262,
    cy: 232,
    labelEn: "Giant's Mirror",
    labelAr: "مرآة العملاق",
    isWild: true,
  },
];

// Connection paths between locations
const connections = [
  { from: "postwick", to: "wedgehurst", path: "M 190 380 L 190 375" },
  { from: "wedgehurst", to: "route2", path: "M 190 350 L 180 340" },
  { from: "route2", to: "wild_area", path: "M 170 320 L 150 300" },
  { from: "wild_area", to: "motostoke", path: "M 220 200 L 240 195" },
  { from: "wild_area", to: "hammerlocke", path: "M 200 200 L 195 155" },
  { from: "motostoke", to: "turffield", path: "M 220 180 L 115 175" },
  { from: "motostoke", to: "hulbury", path: "M 260 182 L 280 182" },
  { from: "hammerlocke", to: "stow_on_side", path: "M 170 130 L 95 125" },
  { from: "hammerlocke", to: "circhester", path: "M 195 120 L 195 75" },
  { from: "circhester", to: "spikemuth", path: "M 215 55 L 260 52" },
  { from: "circhester", to: "wyndon", path: "M 195 50 L 195 45" },
  { from: "stow_on_side", to: "ballonlea", path: "M 80 110 L 110 95" },
  { from: "postwick", to: "slumbering_weald", path: "M 180 385 L 170 382" },
];

export function GalarMap({
  onZoneClick,
  onZoneHover,
  onZoneLeave,
  highlightedZone,
  markers = [],
  isNavigating,
  navigationPath,
}: GalarMapProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [animatedZone, setAnimatedZone] = useState<string | null>(null);
  const [pulseZones, setPulseZones] = useState<string[]>([]);

  // Handle navigation animation
  useEffect(() => {
    if (isNavigating && navigationPath) {
      setAnimatedZone(navigationPath.from);
      setPulseZones([navigationPath.from, navigationPath.to]);

      const timer = setTimeout(() => {
        setAnimatedZone(navigationPath.to);
      }, 400);

      const clearTimer = setTimeout(() => {
        setAnimatedZone(null);
        setPulseZones([]);
      }, 800);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [isNavigating, navigationPath]);

  const getZoneColor = (zone: (typeof galarZones)[0]) => {
    if (zone.isCapital) return "#FFD700";
    if (zone.hasGym) return "#EF4444";
    if (zone.isWild) return "#10B981";
    if (zone.isCave) return "#F59E0B";
    if (zone.isForest) return "#059669";
    if (zone.isLake) return "#3B82F6";
    if (zone.isRoute) return "#8B5CF6";
    return "#6B7280";
  };

  const getMarker = (zoneId: string) => markers.find((m) => m.zoneId === zoneId);

  const isZoneInNavigationPath = (zoneId: string) => {
    if (!navigationPath) return false;
    return navigationPath.from === zoneId || navigationPath.to === zoneId;
  };

  return (
    <svg viewBox="0 0 380 420" className="w-full h-full" style={{ maxHeight: "500px" }}>
      {/* Background */}
      <defs>
        <linearGradient id="galar-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#16213e" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="navigation-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Animation for path */}
        <linearGradient id="navigation-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6">
            <animate attributeName="offset" values="0;1" dur="0.8s" repeatCount="1" />
          </stop>
          <stop offset="100%" stopColor="#60A5FA">
            <animate attributeName="offset" values="0;1" dur="0.8s" repeatCount="1" />
          </stop>
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="380" height="420" fill="url(#galar-bg)" rx="8" />

      {/* Region outline */}
      <path
        d="M 190 5 Q 300 20 310 80 Q 320 150 300 200 Q 320 280 280 350 Q 240 400 190 410 Q 140 400 100 350 Q 60 280 80 200 Q 60 150 70 80 Q 80 20 190 5 Z"
        fill="none"
        stroke="#4B5563"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.5"
      />

      {/* Connections with animation */}
      {connections.map((conn, idx) => {
        const isActiveConnection =
          navigationPath &&
          ((navigationPath.from === conn.from && navigationPath.to === conn.to) ||
            (navigationPath.from === conn.to && navigationPath.to === conn.from));

        return (
          <g key={idx}>
            <path
              d={conn.path}
              stroke={isActiveConnection ? "#3B82F6" : "#4B5563"}
              strokeWidth={isActiveConnection ? 4 : 2}
              fill="none"
              opacity={isActiveConnection ? 1 : 0.6}
              className={isActiveConnection ? "animate-pulse" : ""}
            />
            {isActiveConnection && (
              <path
                d={conn.path}
                stroke="url(#navigation-gradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="10,5"
                className="animate-[dash_0.8s_linear_forwards]"
              />
            )}
          </g>
        );
      })}

      {/* Zones */}
      {galarZones.map((zone) => {
        const isHighlighted = highlightedZone === zone.id;
        const isAnimating = animatedZone === zone.id;
        const isPulsing = pulseZones.includes(zone.id);
        const marker = getMarker(zone.id);
        const baseColor = getZoneColor(zone);

        return (
          <g
            key={zone.id}
            className={`cursor-pointer transition-all duration-300 ${isPulsing ? "animate-pulse" : ""}`}
            onClick={() => onZoneClick?.(zone.id)}
            onMouseEnter={(e) => onZoneHover?.(zone.id, e)}
            onMouseLeave={() => onZoneLeave?.()}
            filter={isHighlighted || isAnimating ? "url(#glow)" : undefined}
            style={{
              transform: isAnimating ? "scale(1.1)" : "scale(1)",
              transformOrigin: `${zone.cx}px ${zone.cy}px`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {/* Zone shape */}
            <path
              d={zone.path}
              fill={baseColor}
              fillOpacity={isHighlighted || isAnimating ? 0.95 : 0.7}
              stroke={isHighlighted || isAnimating ? "#fff" : baseColor}
              strokeWidth={isHighlighted || isAnimating ? 3 : 1}
              className="transition-all duration-300"
              style={{
                filter: isAnimating ? "brightness(1.3)" : "brightness(1)",
              }}
            />

            {/* Animated ring on hover */}
            {isHighlighted && (
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r="15"
                fill="none"
                stroke={baseColor}
                strokeWidth="2"
                opacity="0.5"
                className="animate-[ping_1s_ease-out_infinite]"
              />
            )}

            {/* Zone marker dot */}
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={isHighlighted || isAnimating ? 7 : 4}
              fill="#fff"
              className="transition-all duration-300"
            />

            {/* Gym badge */}
            {zone.hasGym && (
              <circle
                cx={zone.cx + 12}
                cy={zone.cy - 8}
                r="5"
                fill="#EF4444"
                stroke="#fff"
                strokeWidth="1"
              />
            )}

            {/* Marker count */}
            {marker && marker.count && marker.count > 0 && (
              <g className="animate-fade-in">
                <circle cx={zone.cx - 10} cy={zone.cy - 10} r="8" fill="#3B82F6" />
                <text
                  x={zone.cx - 10}
                  y={zone.cy - 6}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {marker.count}
                </text>
              </g>
            )}

            {/* Label */}
            <text
              x={zone.cx}
              y={zone.cy + 16}
              textAnchor="middle"
              fill="#fff"
              fontSize={isHighlighted ? "8" : "7"}
              fontWeight={isHighlighted ? "700" : "500"}
              className="pointer-events-none transition-all duration-300"
            >
              {isArabic ? zone.labelAr : zone.labelEn}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(10, 380)">
        <rect x="0" y="0" width="120" height="35" fill="rgba(0,0,0,0.5)" rx="4" />
        <circle cx="12" cy="10" r="4" fill="#EF4444" />
        <text x="20" y="13" fill="#fff" fontSize="7">
          {isArabic ? "صالة جيم" : "Gym"}
        </text>
        <circle cx="60" cy="10" r="4" fill="#10B981" />
        <text x="68" y="13" fill="#fff" fontSize="7">
          {isArabic ? "برية" : "Wild"}
        </text>
        <circle cx="12" cy="25" r="4" fill="#FFD700" />
        <text x="20" y="28" fill="#fff" fontSize="7">
          {isArabic ? "عاصمة" : "Capital"}
        </text>
        <circle cx="60" cy="25" r="4" fill="#F59E0B" />
        <text x="68" y="28" fill="#fff" fontSize="7">
          {isArabic ? "كهف" : "Cave"}
        </text>
      </g>

      {/* Region title */}
      <text x="190" y="418" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontWeight="bold">
        {isArabic ? "منطقة جالار" : "Galar Region"}
      </text>
    </svg>
  );
}
