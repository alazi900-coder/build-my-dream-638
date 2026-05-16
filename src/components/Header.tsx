import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n/context";
import { Gamepad2, Globe2, Search, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { GameFilterChips } from "@/components/GameFilterChips";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 rounded-b-[2rem] border-b border-border bg-card/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-2 pt-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Gamepad2 className="h-8 w-8" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-3xl font-black leading-tight text-foreground md:text-4xl">
              {t.appName}
            </span>
            <span className="block truncate text-base font-semibold text-muted-foreground">
              {t.tagline}
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="hidden h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground sm:flex"
            aria-label={lang === "ar" ? "بحث" : "Search"}
          >
            <Search className="h-6 w-6" />
          </button>
          <span
            title={online ? undefined : t.offline}
            className="hidden h-12 w-12 items-center justify-center rounded-xl text-amber-500 sm:flex"
          >
            {online ? <Wifi className="h-6 w-6" aria-hidden /> : <WifiOff className="h-6 w-6" />}
          </span>
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-muted/60 px-4 text-lg font-bold text-foreground hover:bg-accent"
          >
            <span>{lang === "ar" ? "EN" : "ع"}</span>
            <Globe2 className="h-6 w-6" />
          </button>
        </div>
      </div>
      <GameFilterChips />
    </header>
  );
}
