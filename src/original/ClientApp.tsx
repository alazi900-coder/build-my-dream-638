import { lazy, Suspense, useEffect, useState } from "react";

const OriginalApp = lazy(() => import("./App"));

export function OriginalClientApp() {
  const [mounted, setMounted] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold shadow-lg">
          جاري تحميل دليل البوكيمون...
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm font-semibold shadow-lg">
            جاري تحميل البيانات والأدوات...
          </div>
        </div>
      }
    >
      <OriginalApp />
    </Suspense>
  );
}
