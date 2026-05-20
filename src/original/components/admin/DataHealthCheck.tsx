import { useState } from "react";
import { Button } from "@/original/components/ui/button";
import { Alert, AlertDescription } from "@/original/components/ui/alert";
import { Loader2, Activity, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { toast } from "sonner";

type Report = {
  counts: Record<string, number>;
  expected: Record<string, number>;
  missing: Record<string, number>;
};

const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  moves: { ar: "الحركات", en: "Moves" },
  gyms: { ar: "الصالات", en: "Gyms" },
  npcs: { ar: "الشخصيات", en: "NPCs" },
  learnsets: { ar: "قوائم التعلم", en: "Learnsets" },
  encounters: { ar: "اللقاءات", en: "Encounters" },
};

export function DataHealthCheck({ onRefresh }: { onRefresh?: () => void }) {
  const { t } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const scan = async () => {
    setLoading("scan");
    try {
      const r = await fetch("/api/public/sync-data");
      const j = (await r.json()) as Report & { ok: boolean };
      setReport(j);
      toast.success(t("تم الفحص بنجاح", "Scan complete"));
    } catch (e) {
      toast.error(t("فشل الفحص", "Scan failed"));
    } finally {
      setLoading(null);
    }
  };

  const runAction = async (action: string, limit?: number) => {
    setLoading(action);
    try {
      const qs = new URLSearchParams({ action });
      if (limit) qs.set("limit", String(limit));
      const r = await fetch(`/api/public/sync-data?${qs}`, { method: "POST" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Sync failed");
      toast.success(
        t(
          `تم استيراد ${action}: ${JSON.stringify(j.result)}`,
          `Imported ${action}: ${JSON.stringify(j.result)}`,
        ),
      );
      setReport({ counts: j.counts, expected: report?.expected ?? {}, missing: {} });
      onRefresh?.();
    } catch (e) {
      toast.error(t(`فشل: ${String(e)}`, `Failed: ${String(e)}`));
    } finally {
      setLoading(null);
    }
  };

  const missingKeys = report ? Object.keys(report.missing) : [];

  return (
    <section className="bg-gradient-to-br from-chart-4/10 to-chart-3/5 border-2 border-chart-4/30 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-chart-4" />
            {t("فحص صحة البيانات", "Data Health Check")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              "افحص البيانات الناقصة واستوردها تلقائياً من PokéAPI",
              "Scan missing data and import it automatically from PokéAPI",
            )}
          </p>
        </div>
        <Button onClick={scan} disabled={loading === "scan"} size="sm">
          {loading === "scan" ? (
            <Loader2 className="w-4 h-4 animate-spin ml-1" />
          ) : (
            <Activity className="w-4 h-4 ml-1" />
          )}
          {t("فحص الآن", "Scan Now")}
        </Button>
      </div>

      {report && (
        <div className="space-y-3">
          {missingKeys.length === 0 ? (
            <Alert className="border-green-500/40 bg-green-500/5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-sm">
                {t("جميع البيانات مكتملة ✓", "All data is complete ✓")}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-500/40 bg-yellow-500/5">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                {t(
                  `بيانات ناقصة في ${missingKeys.length} جداول`,
                  `Missing data in ${missingKeys.length} tables`,
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(report.counts).map(([k, v]) => {
              const exp = report.expected[k] ?? 0;
              const miss = report.missing[k] ?? 0;
              return (
                <div
                  key={k}
                  className="flex items-center justify-between p-2 bg-card border border-border rounded-lg text-sm"
                >
                  <span className="font-medium">{k}</span>
                  <span
                    className={`text-xs ${miss > 0 ? "text-yellow-600" : "text-green-600"}`}
                  >
                    {v} / {exp} {miss > 0 ? `(-${miss})` : "✓"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {Object.entries(ACTION_LABELS).map(([action, label]) => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                disabled={!!loading}
                onClick={() => runAction(action)}
              >
                {loading === action ? (
                  <Loader2 className="w-3 h-3 animate-spin ml-1" />
                ) : (
                  <Download className="w-3 h-3 ml-1" />
                )}
                {t(label.ar, label.en)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
