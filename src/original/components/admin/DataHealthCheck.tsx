import { useState } from "react";
import { Button } from "@/original/components/ui/button";
import { Alert, AlertDescription } from "@/original/components/ui/alert";
import { Loader2, Activity, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { localSeedData } from "@/original/data/seedData";
import { toast } from "sonner";

type Report = {
  counts: Record<string, number>;
  expected: Record<string, number>;
  missing: Record<string, number>;
  source?: string;
};

const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  moves: { ar: "الحركات", en: "Moves" },
  gyms: { ar: "الصالات", en: "Gyms" },
  npcs: { ar: "الشخصيات", en: "NPCs" },
  learnsets: { ar: "قوائم التعلم", en: "Learnsets" },
  encounters: { ar: "اللقاءات", en: "Encounters" },
};

const LOCAL_FALLBACK_REPORT: Report = Object.entries(localSeedData).reduce(
  (report, [key, rows]) => {
    report.counts[key] = rows.length;
    report.expected[key] = rows.length;
    return report;
  },
  { counts: {}, expected: {}, missing: {}, source: "local-seed" } as Report,
);

function toNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const numbers: Record<string, number> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      numbers[key] = rawValue;
    }
  }
  return numbers;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(text.slice(0, 160) || "Invalid JSON response");
  }
}

function getResponseError(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const error = (payload as Record<string, unknown>).error;
  return typeof error === "string" ? error : undefined;
}

function normalizeReport(payload: unknown, fallback: Report = LOCAL_FALLBACK_REPORT): Report {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return fallback;

  const rawReport = payload as Record<string, unknown>;
  const counts = toNumberRecord(rawReport.counts);
  const expected = toNumberRecord(rawReport.expected);
  const missing = toNumberRecord(rawReport.missing);
  const source = typeof rawReport.source === "string" ? rawReport.source : fallback.source;

  return {
    counts: Object.keys(counts).length > 0 ? counts : fallback.counts,
    expected: Object.keys(expected).length > 0 ? expected : fallback.expected,
    missing,
    source,
  };
}

export function DataHealthCheck({ onRefresh }: { onRefresh?: () => void }) {
  const { t } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const scan = async () => {
    setLoading("scan");
    try {
      const response = await fetch("/api/public/sync-data");
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(payload) ?? response.statusText);
      setReport(normalizeReport(payload));
      toast.success(t("تم الفحص بنجاح", "Scan complete"));
    } catch (error) {
      setReport((currentReport) => currentReport ?? LOCAL_FALLBACK_REPORT);
      toast.error(t(`فشل الفحص: ${String(error)}`, `Scan failed: ${String(error)}`));
    } finally {
      setLoading(null);
    }
  };

  const runAction = async (action: string, limit?: number) => {
    setLoading(action);
    try {
      const qs = new URLSearchParams({ action });
      if (limit) qs.set("limit", String(limit));
      const response = await fetch(`/api/public/sync-data?${qs}`, { method: "POST" });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getResponseError(payload) ?? response.statusText);
      toast.success(t(`تم استيراد ${action}`, `Imported ${action}`));
      setReport(normalizeReport(payload, report ?? LOCAL_FALLBACK_REPORT));
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
                  <span className={`text-xs ${miss > 0 ? "text-yellow-600" : "text-green-600"}`}>
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
