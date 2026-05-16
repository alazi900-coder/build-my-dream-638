import { useLanguage } from "@/original/contexts/LanguageContext";
import { useState, useEffect } from "react";

interface KantoMapProps {
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string, event: React.MouseEvent) => void;
  onZoneLeave?: () => void;
  highlightedZone?: string;
  markers?: { zoneId: string; type: "location" | "gym" | "npc"; count?: number }[];
  isNavigating?: boolean;
  navigationPath?: { from: string; to: string } | null;
}

const kantoZones = [
  {
    id: "pallet_town",
    cx: 85,
    cy: 340,
    labelEn: "Pallet Town",
    labelAr: "بلدة باليت",
    isStart: true,
  },
  {
    id: "viridian_city",
    cx: 85,
    cy: 280,
    labelEn: "Viridian City",
    labelAr: "مدينة فيريديان",
    hasGym: true,
  },
  {
    id: "viridian_forest",
    cx: 85,
    cy: 230,
    labelEn: "Viridian Forest",
    labelAr: "غابة فيريديان",
    isForest: true,
  },
  {
    id: "pewter_city",
    cx: 85,
    cy: 180,
    labelEn: "Pewter City",
    labelAr: "مدينة بيوتر",
    hasGym: true,
  },
  { id: "mt_moon", cx: 140, cy: 160, labelEn: "Mt. Moon", labelAr: "جبل القمر", isCave: true },
  {
    id: "cerulean_city",
    cx: 200,
    cy: 140,
    labelEn: "Cerulean City",
    labelAr: "مدينة سيروليان",
    hasGym: true,
  },
  {
    id: "vermilion_city",
    cx: 220,
    cy: 240,
    labelEn: "Vermilion City",
    labelAr: "مدينة فيرميليون",
    hasGym: true,
  },
  {
    id: "rock_tunnel",
    cx: 280,
    cy: 160,
    labelEn: "Rock Tunnel",
    labelAr: "نفق الصخور",
    isCave: true,
  },
  { id: "lavender_town", cx: 300, cy: 200, labelEn: "Lavender Town", labelAr: "بلدة لافندر" },
  {
    id: "celadon_city",
    cx: 160,
    cy: 200,
    labelEn: "Celadon City",
    labelAr: "مدينة سيلادون",
    hasGym: true,
  },
  {
    id: "saffron_city",
    cx: 220,
    cy: 200,
    labelEn: "Saffron City",
    labelAr: "مدينة سافرون",
    hasGym: true,
    isCapital: true,
  },
  {
    id: "fuchsia_city",
    cx: 220,
    cy: 320,
    labelEn: "Fuchsia City",
    labelAr: "مدينة فوشيا",
    hasGym: true,
  },
  {
    id: "cycling_road",
    cx: 140,
    cy: 280,
    labelEn: "Cycling Road",
    labelAr: "طريق الدراجات",
    isRoute: true,
  },
  {
    id: "safari_zone",
    cx: 260,
    cy: 320,
    labelEn: "Safari Zone",
    labelAr: "منطقة السفاري",
    isWild: true,
  },
  {
    id: "seafoam_islands",
    cx: 140,
    cy: 360,
    labelEn: "Seafoam Islands",
    labelAr: "جزر سيفوم",
    isCave: true,
  },
  {
    id: "cinnabar_island",
    cx: 85,
    cy: 380,
    labelEn: "Cinnabar Island",
    labelAr: "جزيرة سينابار",
    hasGym: true,
  },
  { id: "power_plant", cx: 320, cy: 140, labelEn: "Power Plant", labelAr: "محطة الطاقة" },
  {
    id: "victory_road",
    cx: 45,
    cy: 120,
    labelEn: "Victory Road",
    labelAr: "طريق النصر",
    isCave: true,
  },
  {
    id: "indigo_plateau",
    cx: 45,
    cy: 80,
    labelEn: "Indigo Plateau",
    labelAr: "هضبة إنديغو",
    isElite: true,
  },
];

const kantoConnections = [
  { path: "M 85 340 L 85 280", from: "pallet_town", to: "viridian_city" },
  { path: "M 85 280 L 85 230", from: "viridian_city", to: "viridian_forest" },
  { path: "M 85 230 L 85 180", from: "viridian_forest", to: "pewter_city" },
  { path: "M 85 180 L 140 160", from: "pewter_city", to: "mt_moon" },
  { path: "M 140 160 L 200 140", from: "mt_moon", to: "cerulean_city" },
  { path: "M 200 140 L 220 200", from: "cerulean_city", to: "saffron_city" },
  { path: "M 220 200 L 220 240", from: "saffron_city", to: "vermilion_city" },
  { path: "M 200 140 L 280 160", from: "cerulean_city", to: "rock_tunnel" },
  { path: "M 280 160 L 300 200", from: "rock_tunnel", to: "lavender_town" },
  { path: "M 220 200 L 300 200", from: "saffron_city", to: "lavender_town" },
  { path: "M 160 200 L 220 200", from: "celadon_city", to: "saffron_city" },
  { path: "M 85 280 L 160 200", from: "viridian_city", to: "celadon_city" },
  { path: "M 160 200 L 140 280", from: "celadon_city", to: "cycling_road" },
  { path: "M 140 280 L 220 320", from: "cycling_road", to: "fuchsia_city" },
  { path: "M 220 320 L 260 320", from: "fuchsia_city", to: "safari_zone" },
  { path: "M 140 280 L 140 360", from: "cycling_road", to: "seafoam_islands" },
  { path: "M 140 360 L 85 380", from: "seafoam_islands", to: "cinnabar_island" },
  { path: "M 85 380 L 85 340", from: "cinnabar_island", to: "pallet_town" },
  { path: "M 85 180 L 45 120", from: "pewter_city", to: "victory_road" },
  { path: "M 45 120 L 45 80", from: "victory_road", to: "indigo_plateau" },
  { path: "M 320 140 L 280 160", from: "power_plant", to: "rock_tunnel" },
];

export function KantoMap({
  onZoneClick,
  onZoneHover,
  onZoneLeave,
  highlightedZone,
  markers = [],
  isNavigating,
  navigationPath,
}: KantoMapProps) {
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

  const getZoneColor = (zone: (typeof kantoZones)[0]) => {
    if (zone.isElite) return "#9333EA";
    if (zone.isCapital) return "#FFD700";
    if (zone.hasGym) return "#EF4444";
    if (zone.isWild) return "#10B981";
    if (zone.isCave) return "#F59E0B";
    if (zone.isForest) return "#059669";
    if (zone.isRoute) return "#8B5CF6";
    if (zone.isStart) return "#60A5FA";
    return "#6B7280";
  };

  const isConnectionActive = (conn: (typeof kantoConnections)[0]) => {
    if (!navigationPath) return false;
    return (
      (navigationPath.from === conn.from && navigationPath.to === conn.to) ||
      (navigationPath.from === conn.to && navigationPath.to === conn.from)
    );
  };

  return (
    <svg viewBox="0 0 380 420" className="w-full h-full" style={{ maxHeight: "500px" }}>
      <defs>
        <linearGradient id="kanto-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <linearGradient id="water" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
        </linearGradient>
        <filter id="kanto-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="kanto-nav-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="380" height="420" fill="url(#kanto-bg)" rx="8" />

      {/* Water areas */}
      <ellipse cx="120" cy="370" rx="60" ry="30" fill="url(#water)" />
      <ellipse cx="300" cy="380" rx="40" ry="20" fill="url(#water)" />

      {/* Region outline */}
      <path
        d="M 30 60 Q 100 40 200 50 Q 340 60 350 150 Q 360 250 340 340 Q 300 400 200 400 Q 100 400 50 340 Q 30 280 30 200 Q 20 120 30 60 Z"
        fill="none"
        stroke="#4B5563"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.4"
      />

      {/* Connections with animation */}
      {kantoConnections.map((conn, idx) => {
        const isActive = isConnectionActive(conn);

        return (
          <g key={idx}>
            <path
              d={conn.path}
              stroke={isActive ? "#3B82F6" : "#4B5563"}
              strokeWidth={isActive ? 4 : 2}
              fill="none"
              opacity={isActive ? 1 : 0.5}
              className={isActive ? "animate-pulse" : ""}
            />
            {isActive && (
              <path
                d={conn.path}
                stroke="#60A5FA"
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
      {kantoZones.map((zone) => {
        const isHighlighted = highlightedZone === zone.id;
        const isAnimating = animatedZone === zone.id;
        const isPulsing = pulseZones.includes(zone.id);
        const baseColor = getZoneColor(zone);
        const size = zone.isCapital || zone.isElite ? 14 : 10;

        return (
          <g
            key={zone.id}
            className={`cursor-pointer transition-all duration-300 ${isPulsing ? "animate-pulse" : ""}`}
            onClick={() => onZoneClick?.(zone.id)}
            onMouseEnter={(e) => onZoneHover?.(zone.id, e)}
            onMouseLeave={() => onZoneLeave?.()}
            filter={isHighlighted || isAnimating ? "url(#kanto-glow)" : undefined}
            style={{
              transform: isAnimating ? "scale(1.15)" : "scale(1)",
              transformOrigin: `${zone.cx}px ${zone.cy}px`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {/* Animated ring on hover */}
            {isHighlighted && (
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r={size + 8}
                fill="none"
                stroke={baseColor}
                strokeWidth="2"
                opacity="0.5"
                className="animate-[ping_1s_ease-out_infinite]"
              />
            )}

            {/* Zone circle */}
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={isHighlighted || isAnimating ? size + 4 : size}
              fill={baseColor}
              fillOpacity={isHighlighted || isAnimating ? 1 : 0.8}
              stroke={isHighlighted || isAnimating ? "#fff" : baseColor}
              strokeWidth={isHighlighted || isAnimating ? 3 : 1}
              className="transition-all duration-300"
              style={{
                filter: isAnimating ? "brightness(1.3)" : "brightness(1)",
              }}
            />

            {/* Inner dot */}
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={isHighlighted ? 4 : 3}
              fill="#fff"
              className="transition-all duration-300"
            />

            {/* Gym badge indicator */}
            {zone.hasGym && (
              <path
                d={`M ${zone.cx + 8} ${zone.cy - 10} l 5 0 l 0 8 l -5 0 Z`}
                fill="#EF4444"
                stroke="#fff"
                strokeWidth="0.5"
              />
            )}

            {/* Label */}
            <text
              x={zone.cx}
              y={zone.cy + (size + 12)}
              textAnchor="middle"
              fill="#fff"
              fontSize={isHighlighted ? "7" : "6"}
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
        <rect x="0" y="0" width="130" height="35" fill="rgba(0,0,0,0.5)" rx="4" />
        <circle cx="12" cy="10" r="4" fill="#EF4444" />
        <text x="20" y="13" fill="#fff" fontSize="6">
          {isArabic ? "صالة جيم" : "Gym"}
        </text>
        <circle cx="55" cy="10" r="4" fill="#F59E0B" />
        <text x="63" y="13" fill="#fff" fontSize="6">
          {isArabic ? "كهف" : "Cave"}
        </text>
        <circle cx="95" cy="10" r="4" fill="#9333EA" />
        <text x="103" y="13" fill="#fff" fontSize="6">
          {isArabic ? "النخبة" : "Elite"}
        </text>
        <circle cx="12" cy="25" r="4" fill="#60A5FA" />
        <text x="20" y="28" fill="#fff" fontSize="6">
          {isArabic ? "بداية" : "Start"}
        </text>
        <circle cx="55" cy="25" r="4" fill="#10B981" />
        <text x="63" y="28" fill="#fff" fontSize="6">
          {isArabic ? "برية" : "Wild"}
        </text>
      </g>

      {/* Region title */}
      <text x="190" y="415" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontWeight="bold">
        {isArabic ? "منطقة كانتو" : "Kanto Region"}
      </text>
    </svg>
  );
}
