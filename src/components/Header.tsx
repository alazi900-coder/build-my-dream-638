import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n/context";
import { Languages, Wifi, WifiOff } from "lucide-react";
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
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-block h-7 w-7 rounded-full bg-gradient-to-b from-primary to-foreground ring-2 ring-background shadow" />
          <span>{t.appName}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent" activeProps={{ className: "bg-accent" }} activeOptions={{ exact: true }}>
            {t.nav.pokedex}
          </Link>
          <Link to="/items" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent" activeProps={{ className: "bg-accent" }}>
            {t.nav.items}
          </Link>
          <Link to="/types" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent" activeProps={{ className: "bg-accent" }}>
            {t.nav.types}
          </Link>
          <Link to="/about" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent" activeProps={{ className: "bg-accent" }}>
            {t.nav.about}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {!online && (
            <span title={t.offline} className="flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-1 text-xs text-destructive">
              <WifiOff className="h-3.5 w-3.5" />
            </span>
          )}
          {online && <Wifi className="h-4 w-4 text-muted-foreground" aria-hidden />}
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            <Languages className="h-4 w-4" />
            {lang === "ar" ? "EN" : "ع"}
          </button>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        <Link to="/" className="rounded-md px-3 py-1 text-sm" activeProps={{ className: "bg-accent" }} activeOptions={{ exact: true }}>{t.nav.pokedex}</Link>
        <Link to="/types" className="rounded-md px-3 py-1 text-sm" activeProps={{ className: "bg-accent" }}>{t.nav.types}</Link>
        <Link to="/about" className="rounded-md px-3 py-1 text-sm" activeProps={{ className: "bg-accent" }}>{t.nav.about}</Link>
      </div>
    </header>
  );
}
