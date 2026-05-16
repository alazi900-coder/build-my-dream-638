import { cn } from "@/original/lib/utils";

interface IconProps {
  className?: string;
}

// Pokédex Icon - Enhanced classic Pokédex device
export function PokedexIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Main body */}
      <rect
        x="2"
        y="1"
        width="20"
        height="22"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Large lens/screen */}
      <circle cx="8" cy="5.5" r="2.5" fill="currentColor" opacity="0.9" />
      <circle cx="8" cy="5.5" r="1" fill="currentColor" opacity="0.4" />
      {/* Small indicator lights */}
      <circle cx="13" cy="5" r="1" fill="currentColor" opacity="0.7" />
      <circle cx="16" cy="5" r="0.75" fill="currentColor" opacity="0.5" />
      <circle cx="18.5" cy="5" r="0.5" fill="currentColor" opacity="0.4" />
      {/* Screen area */}
      <rect
        x="4"
        y="9"
        width="16"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Screen details */}
      <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <line x1="6" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      {/* Hinge line */}
      <line
        x1="2"
        y1="8"
        x2="22"
        y2="8"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="2 1"
        opacity="0.6"
      />
    </svg>
  );
}

// Attack/Moves Icon - Enhanced lightning with energy burst
export function MovesIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Main lightning bolt */}
      <polygon
        points="13,2 3,13 10,13 8,22 20,10 13,10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Energy particles */}
      <circle cx="5" cy="5" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="19" cy="18" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="20" cy="6" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="3" cy="17" r="1" fill="currentColor" opacity="0.4" />
      {/* Inner energy line */}
      <line x1="11" y1="8" x2="13" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

// Items Icon - Enhanced Backpack/Bag with details
export function ItemsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Strap */}
      <path
        d="M8 7V4.5a4 4 0 0 1 8 0V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Main bag body */}
      <path
        d="M4 9h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Pokeball clasp */}
      <circle cx="12" cy="15" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
      {/* Pocket detail */}
      <path d="M6 9v3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M18 9v3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

// Gym Badge Icon - Enhanced golden badge with star
export function GymIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Outer badge shape */}
      <polygon
        points="12,1 15,7 22,8 17,13 18.5,21 12,17.5 5.5,21 7,13 2,8 9,7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Inner star/gem */}
      <polygon
        points="12,6 13.5,9 17,9.5 14.5,12 15,15.5 12,14 9,15.5 9.5,12 7,9.5 10.5,9"
        fill="currentColor"
        opacity="0.3"
      />
      {/* Center jewel */}
      <circle cx="12" cy="10.5" r="2" fill="currentColor" />
      <circle cx="11.5" cy="10" r="0.75" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

// Battle Icon - Enhanced crossed Pokeballs with clash
export function BattleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* First Pokeball (top-left) */}
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="7" cy="7" r="0.75" fill="currentColor" />

      {/* Second Pokeball (bottom-right) */}
      <circle cx="17" cy="17" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="12" y1="17" x2="22" y2="17" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="17" cy="17" r="0.75" fill="currentColor" />

      {/* Clash effect in center */}
      <path
        d="M10.5 10.5L13.5 13.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M13 10L10.5 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M11.5 13.5L14 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Energy sparks */}
      <circle cx="12" cy="9" r="0.75" fill="currentColor" opacity="0.7" />
      <circle cx="15" cy="12" r="0.75" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

// Map Icon - Enhanced stylized region map
export function MapIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Folded map shape */}
      <path
        d="M3 5l6-3 6 3 6-3v17l-6 3-6-3-6 3V5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Fold lines */}
      <line
        x1="9"
        y1="2"
        x2="9"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
      <line
        x1="15"
        y1="5"
        x2="15"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
      {/* Location markers */}
      <circle cx="6" cy="10" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="18" cy="9" r="1.5" fill="currentColor" />
      {/* Path connection */}
      <path
        d="M6 10L12 12L18 9"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 1"
        opacity="0.5"
      />
    </svg>
  );
}

// Settings/More Icon - Enhanced Pokeball-styled gear
export function MoreIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Outer Pokeball circle */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Dividing line */}
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" />
      {/* Center button */}
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* Gear-like notches */}
      <line
        x1="12"
        y1="1"
        x2="12"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="21"
        x2="12"
        y2="23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="5"
        x2="4.5"
        y2="6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="19.5"
        y1="17.5"
        x2="21"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

// Download Icon - Enhanced for offline downloads
export function DownloadSectionIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Pokeball base */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" />
      {/* Center with download arrow */}
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Download arrow */}
      <path
        d="M12 8v5m0 0l-2-2m2 2l2-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base line */}
      <line
        x1="9"
        y1="15"
        x2="15"
        y2="15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Sound/Audio Icon - For Pokemon cries
export function SoundIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Pokeball with sound waves */}
      <circle cx="10" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="4" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="10" cy="12" r="0.75" fill="currentColor" />

      {/* Sound waves */}
      <path
        d="M17 9c1 1 1.5 2 1.5 3s-0.5 2-1.5 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19.5 7c1.5 1.5 2.5 3.5 2.5 5s-1 3.5-2.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

// Coach/AI Icon - For AI assistant
export function CoachIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Speech bubble with Pokeball */}
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Brain/AI symbol */}
      <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M10 11h4" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
      {/* Sparkle effects */}
      <circle cx="17" cy="7" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="8" cy="15" r="0.75" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// Team Builder Icon
export function TeamIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Three Pokeballs in triangle formation */}
      <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="8" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="6" r="1.25" fill="currentColor" />

      <circle cx="6" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="2" y1="16" x2="10" y2="16" stroke="currentColor" strokeWidth="1" />
      <circle cx="6" cy="16" r="1.25" fill="currentColor" />

      <circle cx="18" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="14" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1" />
      <circle cx="18" cy="16" r="1.25" fill="currentColor" />

      {/* Connection lines */}
      <path
        d="M12 10L6 12M12 10L18 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 1"
        opacity="0.5"
      />
    </svg>
  );
}

// NPCs Icon
export function NPCIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-5 h-5", className)}
    >
      {/* Person silhouette with trainer hat */}
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Hat detail */}
      <path d="M8 5.5C8 4 9.5 3 12 3s4 1 4 2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="3.5" r="1" fill="currentColor" opacity="0.6" />
      {/* Body */}
      <path
        d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Pokeball on belt */}
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}
