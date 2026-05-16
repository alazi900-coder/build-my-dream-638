import { useLanguage } from "@/original/contexts/LanguageContext";
import { useState, useEffect } from "react";

interface HisuiMapProps {
  onZoneClick?: (zoneId: string) => void;
  onZoneHover?: (zoneId: string, event: React.MouseEvent) => void;
  onZoneLeave?: () => void;
  highlightedZone?: string;
  markers?: { zoneId: string; type: "location" | "gym" | "npc"; count?: number }[];
  isNavigating?: boolean;
  navigationPath?: { from: string; to: string } | null;
}

const hisuiZones = [
  {
    id: "jubilife_village",
    cx: 190,
    cy: 220,
    labelEn: "Jubilife Village",
    labelAr: "قرية جوبيلايف",
    isCapital: true,
    size: 18,
  },
  {
    id: "obsidian_fieldlands",
    cx: 100,
    cy: 180,
    labelEn: "Obsidian Fieldlands",
    labelAr: "حقول أوبسيديان",
    isField: true,
    size: 35,
  },
  {
    id: "crimson_mirelands",
    cx: 280,
    cy: 250,
    labelEn: "Crimson Mirelands",
    labelAr: "أراضي القرمزية",
    isSwamp: true,
    size: 30,
  },
  {
    id: "cobalt_coastlands",
    cx: 300,
    cy: 140,
    labelEn: "Cobalt Coastlands",
    labelAr: "سواحل كوبالت",
    isCoast: true,
    size: 32,
  },
  {
    id: "coronet_highlands",
    cx: 190,
    cy: 100,
    labelEn: "Coronet Highlands",
    labelAr: "مرتفعات كورونيت",
    isMountain: true,
    size: 30,
  },
  {
    id: "alabaster_icelands",
    cx: 190,
    cy: 40,
    labelEn: "Alabaster Icelands",
    labelAr: "أراضي ألباستر الجليدية",
    isIce: true,
    size: 28,
  },

  // Sub-areas
  {
    id: "aspiration_hill",
    cx: 80,
    cy: 200,
    labelEn: "Aspiration Hill",
    labelAr: "تلة الطموح",
    size: 8,
    parent: "obsidian_fieldlands",
  },
  {
    id: "floaro_gardens",
    cx: 120,
    cy: 160,
    labelEn: "Floaro Gardens",
    labelAr: "حدائق فلوارو",
    size: 8,
    parent: "obsidian_fieldlands",
  },
  {
    id: "horseshoe_plains",
    cx: 100,
    cy: 210,
    labelEn: "Horseshoe Plains",
    labelAr: "سهول حدوة الحصان",
    size: 8,
    parent: "obsidian_fieldlands",
  },
  {
    id: "droning_meadow",
    cx: 260,
    cy: 280,
    labelEn: "Droning Meadow",
    labelAr: "مرج الطنين",
    size: 8,
    parent: "crimson_mirelands",
  },
  {
    id: "ginkgo_landing",
    cx: 280,
    cy: 120,
    labelEn: "Ginkgo Landing",
    labelAr: "مرسى جينكو",
    size: 8,
    parent: "cobalt_coastlands",
  },
  {
    id: "sacred_plaza",
    cx: 210,
    cy: 80,
    labelEn: "Sacred Plaza",
    labelAr: "الساحة المقدسة",
    size: 8,
    parent: "coronet_highlands",
  },
  {
    id: "snowpoint_temple",
    cx: 210,
    cy: 30,
    labelEn: "Snowpoint Temple",
    labelAr: "معبد سنوبوينت",
    size: 8,
    parent: "alabaster_icelands",
    isTemple: true,
  },
];

const hisuiConnections = [
  { path: "M 190 220 Q 145 200 100 180", from: "jubilife_village", to: "obsidian_fieldlands" },
  { path: "M 190 220 Q 235 235 280 250", from: "jubilife_village", to: "crimson_mirelands" },
  { path: "M 190 220 Q 245 180 300 140", from: "jubilife_village", to: "cobalt_coastlands" },
  { path: "M 190 220 L 190 100", from: "jubilife_village", to: "coronet_highlands" },
  { path: "M 190 100 L 190 40", from: "coronet_highlands", to: "alabaster_icelands" },
  { path: "M 100 180 Q 145 140 190 100", from: "obsidian_fieldlands", to: "coronet_highlands" },
  { path: "M 300 140 Q 245 120 190 100", from: "cobalt_coastlands", to: "coronet_highlands" },
];

export function HisuiMap({
  onZoneClick,
  onZoneHover,
  onZoneLeave,
  highlightedZone,
  markers = [],
  isNavigating,
  navigationPath,
}: HisuiMapProps) {
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

  const getZoneColor = (zone: (typeof hisuiZones)[0]) => {
    if (zone.isCapital) return "#FFD700";
    if (zone.isField) return "#22C55E";
    if (zone.isSwamp) return "#DC2626";
    if (zone.isCoast) return "#0EA5E9";
    if (zone.isMountain) return "#6B7280";
    if (zone.isIce) return "#7DD3FC";
    if (zone.isTemple) return "#A855F7";
    if (zone.parent) return "#9CA3AF";
    return "#6B7280";
  };

  const isConnectionActive = (conn: (typeof hisuiConnections)[0]) => {
    if (!navigationPath) return false;
    return (
      (navigationPath.from === conn.from && navigationPath.to === conn.to) ||
      (navigationPath.from === conn.to && navigationPath.to === conn.from)
    );
  };

  const mainAreas = hisuiZones.filter((z) => !z.parent);
  const subAreas = hisuiZones.filter((z) => z.parent);

  return (
    <svg viewBox="0 0 380 320" className="w-full h-full" style={{ maxHeight: "500px" }}>
      <defs>
        <linearGradient id="hisui-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1f2e" />
          <stop offset="50%" stopColor="#2d3748" />
          <stop offset="100%" stopColor="#1a1f2e" />
        </linearGradient>
        <radialGradient id="field-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="swamp-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#991B1B" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="coast-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="mountain-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6B7280" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4B5563" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="ice-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
        </radialGradient>
        <filter id="hisui-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="hisui-nav-glow">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="380" height="320" fill="url(#hisui-bg)" rx="8" />

      {/* Mountain range background */}
      <path d="M 140 120 L 190 60 L 240 120 Z" fill="#374151" opacity="0.3" />

      {/* Connections with animation */}
      {hisuiConnections.map((conn, idx) => {
        const isActive = isConnectionActive(conn);

        return (
          <g key={idx}>
            <path
              d={conn.path}
              stroke={isActive ? "#3B82F6" : "#4B5563"}
              strokeWidth={isActive ? 5 : 3}
              fill="none"
              opacity={isActive ? 1 : 0.4}
              strokeDasharray={isActive ? "none" : "8,4"}
              className={isActive ? "animate-pulse" : ""}
            />
            {isActive && (
              <path
                d={conn.path}
                stroke="#60A5FA"
                strokeWidth="3"
                fill="none"
                strokeDasharray="12,6"
                className="animate-[dash_0.8s_linear_forwards]"
              />
            )}
          </g>
        );
      })}

      {/* Main area regions */}
      {mainAreas
        .filter((z) => !z.isCapital)
        .map((zone) => {
          const isHighlighted = highlightedZone === zone.id;
          const isAnimating = animatedZone === zone.id;
          const isPulsing = pulseZones.includes(zone.id);
          let gradientId = "field-gradient";
          if (zone.isSwamp) gradientId = "swamp-gradient";
          if (zone.isCoast) gradientId = "coast-gradient";
          if (zone.isMountain) gradientId = "mountain-gradient";
          if (zone.isIce) gradientId = "ice-gradient";

          return (
            <g
              key={zone.id}
              className={`cursor-pointer transition-all duration-300 ${isPulsing ? "animate-pulse" : ""}`}
              onClick={() => onZoneClick?.(zone.id)}
              onMouseEnter={(e) => onZoneHover?.(zone.id, e)}
              onMouseLeave={() => onZoneLeave?.()}
              style={{
                transform: isAnimating ? "scale(1.1)" : "scale(1)",
                transformOrigin: `${zone.cx}px ${zone.cy}px`,
                transition: "transform 0.3s ease-out",
              }}
            >
              {/* Animated ring on hover */}
              {isHighlighted && (
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.size + 10}
                  ry={(zone.size + 10) * 0.7}
                  fill="none"
                  stroke={getZoneColor(zone)}
                  strokeWidth="2"
                  opacity="0.5"
                  className="animate-[ping_1s_ease-out_infinite]"
                />
              )}

              <ellipse
                cx={zone.cx}
                cy={zone.cy}
                rx={isHighlighted || isAnimating ? zone.size + 5 : zone.size}
                ry={(isHighlighted || isAnimating ? zone.size + 5 : zone.size) * 0.7}
                fill={`url(#${gradientId})`}
                stroke={getZoneColor(zone)}
                strokeWidth={isHighlighted || isAnimating ? 4 : 1}
                opacity={isHighlighted || isAnimating ? 1 : 0.8}
                filter={isHighlighted || isAnimating ? "url(#hisui-glow)" : undefined}
                className="transition-all duration-300"
                style={{
                  filter: isAnimating ? "brightness(1.3)" : undefined,
                }}
              />
              <text
                x={zone.cx}
                y={zone.cy + zone.size + 14}
                textAnchor="middle"
                fill="#fff"
                fontSize={isHighlighted ? "8" : "7"}
                fontWeight={isHighlighted ? "700" : "500"}
                className="transition-all duration-300"
              >
                {isArabic ? zone.labelAr : zone.labelEn}
              </text>
            </g>
          );
        })}

      {/* Sub-areas (smaller dots) */}
      {subAreas.map((zone) => {
        const isHighlighted = highlightedZone === zone.id;
        const isAnimating = animatedZone === zone.id;

        return (
          <g
            key={zone.id}
            className="cursor-pointer transition-all duration-300"
            onClick={() => onZoneClick?.(zone.id)}
            onMouseEnter={(e) => onZoneHover?.(zone.id, e)}
            onMouseLeave={() => onZoneLeave?.()}
            style={{
              transform: isAnimating ? "scale(1.3)" : "scale(1)",
              transformOrigin: `${zone.cx}px ${zone.cy}px`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {isHighlighted && (
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r={zone.size + 6}
                fill="none"
                stroke={getZoneColor(zone)}
                strokeWidth="1"
                opacity="0.5"
                className="animate-[ping_1s_ease-out_infinite]"
              />
            )}
            <circle
              cx={zone.cx}
              cy={zone.cy}
              r={isHighlighted || isAnimating ? zone.size + 3 : zone.size}
              fill={getZoneColor(zone)}
              stroke={isHighlighted || isAnimating ? "#fff" : "transparent"}
              strokeWidth="2"
              opacity={isHighlighted || isAnimating ? 1 : 0.7}
              className="transition-all duration-300"
            />
          </g>
        );
      })}

      {/* Jubilife Village (Capital) */}
      {mainAreas
        .filter((z) => z.isCapital)
        .map((zone) => {
          const isHighlighted = highlightedZone === zone.id;
          const isAnimating = animatedZone === zone.id;
          const isPulsing = pulseZones.includes(zone.id);

          return (
            <g
              key={zone.id}
              className={`cursor-pointer transition-all duration-300 ${isPulsing ? "animate-pulse" : ""}`}
              onClick={() => onZoneClick?.(zone.id)}
              onMouseEnter={(e) => onZoneHover?.(zone.id, e)}
              onMouseLeave={() => onZoneLeave?.()}
              filter={isHighlighted || isAnimating ? "url(#hisui-glow)" : undefined}
              style={{
                transform: isAnimating ? "scale(1.15)" : "scale(1)",
                transformOrigin: `${zone.cx}px ${zone.cy}px`,
                transition: "transform 0.3s ease-out",
              }}
            >
              {/* Animated ring */}
              {isHighlighted && (
                <circle
                  cx={zone.cx}
                  cy={zone.cy}
                  r="25"
                  fill="none"
                  stroke="#FFD700"
                  strokeWidth="2"
                  opacity="0.5"
                  className="animate-[ping_1s_ease-out_infinite]"
                />
              )}

              {/* Village shape */}
              <polygon
                points={`${zone.cx},${zone.cy - (isHighlighted ? 15 : 12)} ${zone.cx + (isHighlighted ? 17 : 14)},${zone.cy + (isHighlighted ? 10 : 8)} ${zone.cx - (isHighlighted ? 17 : 14)},${zone.cy + (isHighlighted ? 10 : 8)}`}
                fill="#FFD700"
                stroke={isHighlighted || isAnimating ? "#fff" : "#F59E0B"}
                strokeWidth={isHighlighted ? 3 : 2}
                className="transition-all duration-300"
                style={{
                  filter: isAnimating ? "brightness(1.3)" : undefined,
                }}
              />
              <circle
                cx={zone.cx}
                cy={zone.cy}
                r={isHighlighted ? 5 : 4}
                fill="#fff"
                className="transition-all duration-300"
              />
              <text
                x={zone.cx}
                y={zone.cy + 28}
                textAnchor="middle"
                fill="#FFD700"
                fontSize={isHighlighted ? "9" : "8"}
                fontWeight="bold"
                className="transition-all duration-300"
              >
                {isArabic ? zone.labelAr : zone.labelEn}
              </text>
            </g>
          );
        })}

      {/* Legend */}
      <g transform="translate(10, 280)">
        <rect x="0" y="0" width="180" height="35" fill="rgba(0,0,0,0.5)" rx="4" />
        <circle cx="12" cy="10" r="5" fill="#22C55E" />
        <text x="22" y="13" fill="#fff" fontSize="6">
          {isArabic ? "حقول" : "Field"}
        </text>
        <circle cx="55" cy="10" r="5" fill="#DC2626" />
        <text x="65" y="13" fill="#fff" fontSize="6">
          {isArabic ? "مستنقع" : "Swamp"}
        </text>
        <circle cx="100" cy="10" r="5" fill="#0EA5E9" />
        <text x="110" y="13" fill="#fff" fontSize="6">
          {isArabic ? "ساحل" : "Coast"}
        </text>
        <circle cx="145" cy="10" r="5" fill="#6B7280" />
        <text x="155" y="13" fill="#fff" fontSize="6">
          {isArabic ? "جبل" : "Mountain"}
        </text>
        <circle cx="12" cy="25" r="5" fill="#7DD3FC" />
        <text x="22" y="28" fill="#fff" fontSize="6">
          {isArabic ? "جليد" : "Ice"}
        </text>
        <polygon points="55,20 60,30 50,30" fill="#FFD700" />
        <text x="65" y="28" fill="#fff" fontSize="6">
          {isArabic ? "قرية" : "Village"}
        </text>
      </g>

      {/* Region title */}
      <text x="190" y="315" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontWeight="bold">
        {isArabic ? "منطقة هيسوي" : "Hisui Region"}
      </text>
    </svg>
  );
}
