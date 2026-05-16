import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";
import { PokedexIcon, BattleIcon } from "@/original/components/icons/PokemonIcons";
import {
  Bot,
  Compass,
  Menu,
  Map,
  Users,
  Swords,
  Package,
  Zap,
  GitCompare,
  Settings,
  Wrench,
  BookOpen,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Star,
  Trophy,
  Flame,
  Target,
  AlertCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/original/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/original/components/ui/sheet";
import {
  useAdventureStats,
  TOTAL_ACHIEVEMENTS,
  STORY_TYPES,
} from "@/original/hooks/useAdventureStats";
import { AdventureHub } from "@/original/components/adventure/AdventureHub";

// Menu items for Explore popover
const exploreItems = [
  { path: "/map", icon: Map, labelKey: "nav.map", descKey: "explore.map.desc" },
  { path: "/gyms", icon: Swords, labelKey: "nav.gyms", descKey: "explore.gyms.desc" },
  { path: "/npcs", icon: Users, labelKey: "nav.npcs", descKey: "explore.npcs.desc" },
];

// Menu items for drawer (removed chatgpt and art)
const drawerItems = [
  {
    path: "/explore",
    icon: Compass,
    labelKey: "nav.exploration",
    descKey: "more.exploration.desc",
    isExploration: true,
  },
  {
    path: "/story",
    icon: BookOpen,
    labelKey: "nav.stories",
    descKey: "more.stories.desc",
    isStory: true,
  },
  { path: "/minigames", icon: Target, labelKey: "nav.minigames", descKey: "more.minigames.desc" },
  { path: "/items", icon: Package, labelKey: "nav.items", descKey: "more.items.desc" },
  { path: "/moves", icon: Zap, labelKey: "nav.moves", descKey: "more.moves.desc" },
  { path: "/compare", icon: GitCompare, labelKey: "nav.compare", descKey: "more.compare.desc" },
  { path: "/settings", icon: Settings, labelKey: "nav.settings", descKey: "more.settings.desc" },
  { path: "/admin", icon: Wrench, labelKey: "nav.admin", descKey: "more.admin.desc" },
];

export function BottomNav(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { tr, language } = useLanguage();
  const isAr = language === "ar";
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Adventure stats
  const stats = useAdventureStats();

  // Theme mode: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark" | "system") || "system";
    }
    return "system";
  });

  // Actual dark mode state (resolved from theme mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  // Listen for SW update events
  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener("sw-update-available", handleUpdate);
    return () => window.removeEventListener("sw-update-available", handleUpdate);
  }, []);

  // Apply theme based on mode
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (isDark: boolean) => {
      setIsDarkMode(isDark);
      if (isDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    };

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (themeMode === "system") {
        applyTheme(e.matches);
      }
    };

    if (themeMode === "system") {
      applyTheme(mediaQuery.matches);
      mediaQuery.addEventListener("change", handleSystemChange);
    } else {
      applyTheme(themeMode === "dark");
    }

    localStorage.setItem("theme", themeMode);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [themeMode]);

  const cycleTheme = () => {
    const modes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (themeMode === "system") return Monitor;
    if (themeMode === "dark") return Moon;
    return Sun;
  };

  const getThemeLabel = () => {
    if (themeMode === "system") return isAr ? "الوضع التلقائي" : "System Mode";
    if (themeMode === "dark") return isAr ? "الوضع المظلم" : "Dark Mode";
    return isAr ? "الوضع الفاتح" : "Light Mode";
  };

  const getThemeDescription = () => {
    if (themeMode === "system") return isAr ? "يتبع إعدادات النظام" : "Follows system settings";
    if (themeMode === "dark")
      return isAr ? "انقر للتبديل إلى الوضع التلقائي" : "Click to switch to system";
    return isAr ? "انقر للتبديل إلى الوضع المظلم" : "Click to switch to dark";
  };

  // Theme colors - simplified to use semantic tokens
  const getThemeColors = () => {
    if (themeMode === "system")
      return {
        bg: "from-muted/50 to-muted/30 hover:from-muted to-muted/50",
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
        textColor: "text-foreground",
        glowColor: "bg-muted",
        toggleBg: "bg-muted",
        toggleDot: "bg-primary",
      };
    if (themeMode === "dark")
      return {
        bg: "from-muted/50 to-muted/30 hover:from-muted to-muted/50",
        iconBg: "bg-muted",
        iconColor: "text-foreground",
        textColor: "text-foreground",
        glowColor: "bg-primary/20",
        toggleBg: "bg-muted",
        toggleDot: "bg-primary",
      };
    return {
      bg: "from-muted/50 to-muted/30 hover:from-muted to-muted/50",
      iconBg: "bg-muted",
      iconColor: "text-foreground",
      textColor: "text-foreground",
      glowColor: "bg-primary/20",
      toggleBg: "bg-muted",
      toggleDot: "bg-primary",
    };
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/battle")
      return location.pathname === "/battle" || location.pathname === "/team-builder";
    if (path === "/coach") return location.pathname === "/coach";
    return location.pathname.startsWith(path);
  };

  const isExploreActive = exploreItems.some((item) => location.pathname.startsWith(item.path));
  const isDrawerActive = drawerItems.some((item) => location.pathname.startsWith(item.path));

  const NavButton = ({
    onClick,
    active,
    label,
    icon: IconComponent,
    showBadge = false,
    isPopoverTrigger = false,
  }: {
    onClick?: () => void;
    active: boolean;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    showBadge?: boolean;
    isPopoverTrigger?: boolean;
  }) => (
    <button
      onClick={onClick}
      aria-label={showBadge ? `${label} - update available` : label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-lg transition-all min-w-0 flex-1 min-h-[56px] touch-manipulation relative",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground active:scale-95",
      )}
    >
      <div className={cn("p-1.5 rounded-lg transition-colors relative", active && "bg-primary/15")}>
        <IconComponent className={cn("w-5 h-5", active && "scale-110")} />
        {showBadge && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>
      <span className="text-[10px] font-medium truncate">{label}</span>
    </button>
  );

  const PopoverMenuItem = ({
    item,
    onSelect,
    index = 0,
  }: {
    item: (typeof exploreItems)[0];
    onSelect: () => void;
    index?: number;
  }) => {
    const IconComponent = item.icon;
    const isItemActive = location.pathname.startsWith(item.path);

    return (
      <button
        onClick={() => {
          navigate(item.path);
          onSelect();
        }}
        className={cn(
          "flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 text-start",
          "animate-in fade-in-0 slide-in-from-bottom-2",
          isItemActive
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted hover:translate-x-1 active:bg-muted/80 active:scale-[0.98]",
        )}
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
      >
        <div
          className={cn(
            "p-2 rounded-lg transition-transform duration-200",
            isItemActive ? "bg-primary/20 scale-110" : "bg-muted group-hover:scale-105",
          )}
        >
          <IconComponent
            className={cn("w-5 h-5 transition-transform", isItemActive && "animate-pulse")}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm">{tr(item.labelKey as any)}</span>
          <span className="text-xs text-muted-foreground truncate">{tr(item.descKey as any)}</span>
        </div>
      </button>
    );
  };

  const DrawerMenuItem = ({
    item,
    onSelect,
    index = 0,
  }: {
    item: (typeof drawerItems)[0];
    onSelect: () => void;
    index?: number;
  }) => {
    const IconComponent = item.icon;
    const isItemActive = location.pathname.startsWith(item.path);
    const isStoryItem = item.path === "/story";

    return (
      <button
        onClick={() => {
          navigate(item.path);
          onSelect();
        }}
        className={cn(
          "group flex items-center gap-4 w-full p-4 rounded-xl text-start",
          "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "opacity-0 translate-x-[-20px]",
          isItemActive
            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
            : "hover:bg-muted hover:translate-x-1 hover:shadow-md active:scale-[0.97]",
        )}
        style={{
          animation: `slideInSpring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 80}ms forwards`,
        }}
      >
        <div
          className={cn(
            "p-3 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            "group-hover:scale-110 group-hover:rotate-3",
            isItemActive ? "bg-primary/20 scale-110 shadow-lg shadow-primary/20" : "bg-muted",
          )}
        >
          <IconComponent
            className={cn(
              "w-6 h-6 transition-all duration-300",
              isItemActive && "text-primary",
              "group-hover:scale-105",
            )}
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-base transition-colors group-hover:text-primary">
            {tr(item.labelKey as any)}
          </span>
          <span className="text-sm text-muted-foreground">{tr(item.descKey as any)}</span>
        </div>

        {/* Story Stats Badges - Simplified colors */}
        {isStoryItem && !stats.isLoading && (
          <div className="flex items-center gap-1.5">
            {/* Points */}
            {stats.totalPoints > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Star className="w-3 h-3" />
                {stats.totalPoints}
              </div>
            )}
            {/* Achievements */}
            {stats.totalAchievements > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                <Trophy className="w-3 h-3" />
                {stats.totalAchievements}
              </div>
            )}
            {/* Active Adventures */}
            {stats.activeAdventures > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold animate-pulse">
                <AlertCircle className="w-3 h-3" />
                {stats.activeAdventures}
              </div>
            )}
            {/* Daily Streak */}
            {stats.dailyStreak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Flame className="w-3 h-3" />
                {stats.dailyStreak}
              </div>
            )}
          </div>
        )}

        {!isStoryItem && (
          <ChevronRight
            className={cn(
              "w-5 h-5 text-muted-foreground/50 transition-all duration-300",
              "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
              isItemActive && "opacity-100 translate-x-0 text-primary",
            )}
          />
        )}
      </button>
    );
  };

  return (
    <nav
      className="pokemon-world-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-card/90 backdrop-blur-xl supports-[backdrop-filter]:bg-card/75 safe-area-pb"
      aria-label={tr("nav.dex")}
    >
      {/* Custom keyframes style */}
      <style>{`
        @keyframes slideInSpring {
          0% {
            opacity: 0;
            transform: translateX(-20px) scale(0.95);
          }
          60% {
            opacity: 1;
            transform: translateX(5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes fire {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.2); }
        }
        
        .animate-fire {
          animation: fire 0.5s ease-in-out infinite;
        }
        
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 15px currentColor, 0 0 25px currentColor; }
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes trophy-shine {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.3) drop-shadow(0 0 8px gold); }
          100% { filter: brightness(1); }
        }
        
        .animate-trophy-shine {
          animation: trophy-shine 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {/* Dex - Direct link */}
        <NavButton
          onClick={() => navigate("/")}
          active={isActive("/")}
          label={tr("nav.dex")}
          icon={PokedexIcon}
        />

        {/* Battle - Direct link */}
        <NavButton
          onClick={() => navigate("/team-builder")}
          active={isActive("/battle")}
          label={tr("nav.battle")}
          icon={BattleIcon}
        />

        {/* Explore - Popover */}
        <Popover open={exploreOpen} onOpenChange={setExploreOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1 min-w-0">
              <NavButton
                active={isExploreActive}
                label={tr("nav.explore")}
                icon={Compass}
                isPopoverTrigger
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-2 bg-card border-border shadow-xl z-[100] animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200"
            side="top"
            align="center"
            sideOffset={12}
          >
            <div className="flex flex-col gap-1">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider animate-in fade-in-0 duration-300">
                {tr("nav.explore")}
              </div>
              {exploreItems.map((item, index) => (
                <PopoverMenuItem
                  key={item.path}
                  item={item}
                  index={index}
                  onSelect={() => setExploreOpen(false)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Coach - Direct link */}
        <NavButton
          onClick={() => navigate("/coach")}
          active={isActive("/coach")}
          label={tr("nav.coach")}
          icon={Bot}
        />

        {/* Menu - Left sliding drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <div className="flex-1 min-w-0">
              <NavButton
                active={isDrawerActive}
                label={tr("nav.more")}
                icon={Menu}
                showBadge={updateAvailable}
                isPopoverTrigger
              />
            </div>
          </SheetTrigger>
          <SheetContent side="left" className="w-[340px] p-0 overflow-hidden">
            {/* Decorative background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />

            <SheetHeader className="relative p-6 pb-5 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                {/* Decorative logo/icon */}
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl opacity-50" />
                </div>
                <div className="flex flex-col">
                  <SheetTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {tr("nav.more")}
                  </SheetTitle>
                  <span className="text-xs text-muted-foreground">
                    {isAr ? "استكشف المزيد من الميزات" : "Explore more features"}
                  </span>
                </div>
              </div>
            </SheetHeader>

            <div className="relative flex flex-col gap-2 p-4 overflow-y-auto max-h-[calc(100vh-280px)]">
              {/* Adventure Hub Section */}
              <AdventureHub onClose={() => setDrawerOpen(false)} />

              {/* Divider */}
              <div className="h-px bg-border my-2" />

              {/* Other Menu Items */}
              <div className="space-y-2">
                {drawerItems
                  .filter((item) => item.path !== "/story")
                  .map((item, index) => (
                    <DrawerMenuItem
                      key={item.path}
                      item={item}
                      index={index}
                      onSelect={() => setDrawerOpen(false)}
                    />
                  ))}
              </div>
            </div>

            {/* Theme Toggle at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card/95 backdrop-blur">
              <button
                onClick={cycleTheme}
                className={cn(
                  "group flex items-center gap-4 w-full p-4 rounded-xl text-start",
                  "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  "bg-gradient-to-r hover:shadow-lg active:scale-[0.97]",
                  getThemeColors().bg,
                )}
              >
                <div
                  className={cn(
                    "relative p-3 rounded-xl transition-all duration-500",
                    "group-hover:scale-110 group-hover:rotate-12",
                    getThemeColors().iconBg,
                  )}
                >
                  {(() => {
                    const ThemeIcon = getThemeIcon();
                    return (
                      <ThemeIcon
                        className={cn(
                          "w-6 h-6 transition-transform duration-500 group-hover:rotate-12",
                          getThemeColors().iconColor,
                        )}
                      />
                    );
                  })()}
                  {/* Glow effect */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300",
                      getThemeColors().glowColor,
                    )}
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className={cn(
                      "font-semibold text-base transition-colors",
                      getThemeColors().textColor,
                    )}
                  >
                    {getThemeLabel()}
                  </span>
                  <span className="text-sm text-muted-foreground">{getThemeDescription()}</span>
                </div>
                {/* Three-state indicator */}
                <div className="flex gap-1.5">
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <div
                      key={mode}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all duration-300",
                        themeMode === mode
                          ? cn("scale-125", getThemeColors().toggleDot)
                          : "bg-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
