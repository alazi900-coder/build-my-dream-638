import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/original/integrations/supabase/client";
import { useLanguage } from "@/original/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Textarea } from "@/original/components/ui/textarea";
import { Badge } from "@/original/components/ui/badge";
import { Alert, AlertDescription } from "@/original/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/original/components/ui/tabs";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Building,
  Users,
  Swords,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  inserted: number;
  updated: number;
  errors: ValidationError[];
}

// JSON format examples for each import type
const EXAMPLE_GYMS_JSON = `{
  "game_id": "sv",
  "gyms": [
    {
      "id": 100,
      "region": "Paldea",
      "leader_name_en": "Katy",
      "leader_name_ar": "كاتي",
      "city_en": "Cortondo",
      "city_ar": "كورتوندو",
      "type": "bug",
      "challenge_en": "Olive Roll challenge",
      "challenge_ar": "تحدي دحرجة الزيتون",
      "tips_en": "Use Fire, Flying, or Rock types",
      "tips_ar": "استخدم أنواع النار أو الطيران أو الصخر",
      "badge_order": 1
    }
  ]
}`;

const EXAMPLE_NPCS_JSON = `{
  "game_id": "lgpe",
  "npcs": [
    {
      "id": 100,
      "name_en": "Brock",
      "name_ar": "بروك",
      "role_en": "Gym Leader",
      "role_ar": "قائد صالة",
      "category": "gym_leader",
      "location_en": "Pewter City",
      "location_ar": "مدينة بيوتر",
      "story_en": "The rock-solid Pokémon Trainer!",
      "story_ar": "مدرب البوكيمون الصلب كالصخر!",
      "specialty_type": "rock",
      "badge_order": 1,
      "image_url": "https://example.com/brock.png"
    }
  ]
}`;

const EXAMPLE_ROSTERS_JSON = `{
  "game_id": "lgpe",
  "rosters": [
    {
      "gym_id": 1,
      "pokemon_id": 74,
      "level": 12,
      "moves": ["tackle", "defense-curl"]
    },
    {
      "gym_id": 1,
      "pokemon_id": 95,
      "level": 14,
      "moves": ["tackle", "bind", "rock-throw"]
    }
  ]
}`;

export function BulkImportSection() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"gyms" | "npcs" | "rosters">("gyms");
  const [jsonInput, setJsonInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [referenceData, setReferenceData] = useState<{
    gymIds: Set<number>;
    pokemonIds: Set<number>;
    moveNames: Set<string>;
  } | null>(null);

  // Fetch reference data for validation
  const fetchReferenceData = async () => {
    const [gymsRes, pokemonRes, movesRes] = await Promise.all([
      supabase.from("gyms").select("id"),
      supabase.from("pokemon").select("id"),
      supabase.from("moves").select("name_en"),
    ]);

    return {
      gymIds: new Set((gymsRes.data || []).map((g) => g.id)),
      pokemonIds: new Set((pokemonRes.data || []).map((p) => p.id)),
      moveNames: new Set((movesRes.data || []).map((m) => m.name_en.toLowerCase())),
    };
  };

  // Validate gym data
  const validateGyms = (data: any): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!data.gyms || !Array.isArray(data.gyms)) {
      errors.push({ row: 0, field: "gyms", message: "Missing gyms array" });
      return errors;
    }

    data.gyms.forEach((gym: any, index: number) => {
      if (!gym.leader_name_en)
        errors.push({ row: index + 1, field: "leader_name_en", message: "Required" });
      if (!gym.leader_name_ar)
        errors.push({ row: index + 1, field: "leader_name_ar", message: "Required" });
      if (!gym.city_en) errors.push({ row: index + 1, field: "city_en", message: "Required" });
      if (!gym.city_ar) errors.push({ row: index + 1, field: "city_ar", message: "Required" });
      if (!gym.type) errors.push({ row: index + 1, field: "type", message: "Required" });
    });

    return errors;
  };

  // Validate NPC data
  const validateNPCs = (data: any): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!data.npcs || !Array.isArray(data.npcs)) {
      errors.push({ row: 0, field: "npcs", message: "Missing npcs array" });
      return errors;
    }

    data.npcs.forEach((npc: any, index: number) => {
      if (!npc.name_en) errors.push({ row: index + 1, field: "name_en", message: "Required" });
      if (!npc.name_ar) errors.push({ row: index + 1, field: "name_ar", message: "Required" });
      if (!npc.role_en) errors.push({ row: index + 1, field: "role_en", message: "Required" });
      if (!npc.role_ar) errors.push({ row: index + 1, field: "role_ar", message: "Required" });
      if (!npc.category) errors.push({ row: index + 1, field: "category", message: "Required" });
      if (!npc.location_en)
        errors.push({ row: index + 1, field: "location_en", message: "Required" });
      if (!npc.location_ar)
        errors.push({ row: index + 1, field: "location_ar", message: "Required" });
    });

    return errors;
  };

  // Validate roster data with reference checking
  const validateRosters = (
    data: any,
    refs: { gymIds: Set<number>; pokemonIds: Set<number>; moveNames: Set<string> } | null,
  ): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!data.rosters || !Array.isArray(data.rosters)) {
      errors.push({ row: 0, field: "rosters", message: "Missing rosters array" });
      return errors;
    }

    data.rosters.forEach((roster: any, index: number) => {
      // Required fields
      if (!roster.gym_id) {
        errors.push({ row: index + 1, field: "gym_id", message: "Required" });
      } else if (refs && !refs.gymIds.has(roster.gym_id)) {
        errors.push({
          row: index + 1,
          field: "gym_id",
          message: `Gym ID ${roster.gym_id} not found in database`,
        });
      }

      if (!roster.pokemon_id) {
        errors.push({ row: index + 1, field: "pokemon_id", message: "Required" });
      } else if (refs && !refs.pokemonIds.has(roster.pokemon_id)) {
        errors.push({
          row: index + 1,
          field: "pokemon_id",
          message: `Pokemon ID ${roster.pokemon_id} not found in database`,
        });
      }

      if (typeof roster.level !== "number") {
        errors.push({ row: index + 1, field: "level", message: "Must be a number" });
      } else if (roster.level < 1 || roster.level > 100) {
        errors.push({ row: index + 1, field: "level", message: "Level must be between 1 and 100" });
      }

      // Optional move validation (warning only, not blocking)
      if (roster.moves && Array.isArray(roster.moves) && refs) {
        roster.moves.forEach((move: string, moveIdx: number) => {
          if (move && !refs.moveNames.has(move.toLowerCase().replace(/-/g, " "))) {
            // This is a warning, not an error - moves might have different naming conventions
          }
        });
      }
    });

    return errors;
  };

  // Preview JSON before import
  const handlePreview = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      let errors: ValidationError[] = [];

      if (activeTab === "gyms") {
        errors = validateGyms(parsed);
      } else if (activeTab === "npcs") {
        errors = validateNPCs(parsed);
      } else if (activeTab === "rosters") {
        // Fetch reference data for roster validation
        toast.loading(t("Validating references...", "جاري التحقق من المراجع..."));
        const refs = await fetchReferenceData();
        setReferenceData(refs);
        errors = validateRosters(parsed, refs);
        toast.dismiss();
      }

      setValidationErrors(errors);
      setPreviewData(parsed);

      if (errors.length === 0) {
        toast.success(t("Validation passed!", "تم التحقق بنجاح!"));
      }
    } catch (e) {
      toast.dismiss();
      toast.error(t("Invalid JSON format", "صيغة JSON غير صالحة"));
      setPreviewData(null);
    }
  };

  // Import gyms mutation
  const importGymsMutation = useMutation({
    mutationFn: async (data: any) => {
      const gameId = data.game_id || "swsh";
      const gyms = data.gyms.map((gym: any) => ({
        ...gym,
        game_id: gym.game_id || gameId,
        available_in: gym.available_in || [gameId],
      }));

      const { error } = await supabase.from("gyms").upsert(gyms, { onConflict: "id" });
      if (error) throw error;
      return gyms.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-gyms"] });
      queryClient.invalidateQueries({ queryKey: ["gyms"] });
      toast.success(t(`Imported ${count} gyms!`, `تم استيراد ${count} صالة!`));
      setJsonInput("");
      setPreviewData(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Import NPCs mutation
  const importNPCsMutation = useMutation({
    mutationFn: async (data: any) => {
      const npcs = data.npcs.map((npc: any) => ({
        ...npc,
      }));

      const { error } = await supabase.from("npcs").upsert(npcs, { onConflict: "id" });
      if (error) throw error;
      return npcs.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["npcs"] });
      queryClient.invalidateQueries({ queryKey: ["npcs-gym-leaders"] });
      toast.success(t(`Imported ${count} NPCs!`, `تم استيراد ${count} شخصية!`));
      setJsonInput("");
      setPreviewData(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Import rosters mutation
  const importRostersMutation = useMutation({
    mutationFn: async (data: any) => {
      const rosters = data.rosters.map((roster: any) => ({
        ...roster,
        moves: roster.moves || [],
      }));

      const { error } = await supabase.from("gym_roster").upsert(rosters, { onConflict: "id" });
      if (error) throw error;
      return rosters.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-gym-roster"] });
      queryClient.invalidateQueries({ queryKey: ["gym-roster"] });
      toast.success(t(`Imported ${count} roster entries!`, `تم استيراد ${count} إدخال فريق!`));
      setJsonInput("");
      setPreviewData(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleImport = () => {
    if (!previewData || validationErrors.length > 0) {
      toast.error(t("Fix validation errors first", "أصلح أخطاء التحقق أولاً"));
      return;
    }

    if (activeTab === "gyms") {
      importGymsMutation.mutate(previewData);
    } else if (activeTab === "npcs") {
      importNPCsMutation.mutate(previewData);
    } else if (activeTab === "rosters") {
      importRostersMutation.mutate(previewData);
    }
  };

  const copyExample = () => {
    let example = "";
    if (activeTab === "gyms") example = EXAMPLE_GYMS_JSON;
    else if (activeTab === "npcs") example = EXAMPLE_NPCS_JSON;
    else if (activeTab === "rosters") example = EXAMPLE_ROSTERS_JSON;

    navigator.clipboard.writeText(example);
    toast.success(t("Copied to clipboard!", "تم النسخ!"));
  };

  const getExampleJson = () => {
    if (activeTab === "gyms") return EXAMPLE_GYMS_JSON;
    if (activeTab === "npcs") return EXAMPLE_NPCS_JSON;
    return EXAMPLE_ROSTERS_JSON;
  };

  const isLoading =
    importGymsMutation.isPending || importNPCsMutation.isPending || importRostersMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          {t("Bulk Import", "استيراد مجمّع")}
        </CardTitle>
        <CardDescription>
          {t(
            "Import gyms, NPCs, and rosters using JSON format",
            "استيراد الصالات والشخصيات والفرق بصيغة JSON",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as any);
            setJsonInput("");
            setPreviewData(null);
            setValidationErrors([]);
          }}
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="gyms" className="gap-1.5">
              <Building className="w-4 h-4" />
              {t("Gyms", "الصالات")}
            </TabsTrigger>
            <TabsTrigger value="npcs" className="gap-1.5">
              <Users className="w-4 h-4" />
              {t("NPCs", "الشخصيات")}
            </TabsTrigger>
            <TabsTrigger value="rosters" className="gap-1.5">
              <Swords className="w-4 h-4" />
              {t("Rosters", "الفرق")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Example JSON */}
            <div className="bg-muted/50 rounded-lg p-3 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {t("Example Format", "الصيغة المطلوبة")}
                </span>
                <Button variant="ghost" size="sm" onClick={copyExample}>
                  <Copy className="w-4 h-4 mr-1" />
                  {t("Copy", "نسخ")}
                </Button>
              </div>
              <pre className="text-xs overflow-x-auto bg-background rounded p-2 max-h-40">
                {getExampleJson()}
              </pre>
            </div>

            {/* JSON Input */}
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={t("Paste your JSON here...", "الصق JSON هنا...")}
              className="min-h-[200px] font-mono text-xs"
              dir="ltr"
            />

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationErrors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-xs">
                        {t(
                          `Row ${err.row}: ${err.field} - ${err.message}`,
                          `السطر ${err.row}: ${err.field} - ${err.message}`,
                        )}
                      </p>
                    ))}
                    {validationErrors.length > 5 && (
                      <p className="text-xs">
                        {t(
                          `...and ${validationErrors.length - 5} more errors`,
                          `...و ${validationErrors.length - 5} أخطاء أخرى`,
                        )}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview Summary */}
            {previewData && validationErrors.length === 0 && (
              <Alert className="border-green-500/30 bg-green-500/10">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  {activeTab === "gyms" &&
                    t(
                      `Ready to import ${previewData.gyms?.length || 0} gyms`,
                      `جاهز لاستيراد ${previewData.gyms?.length || 0} صالة`,
                    )}
                  {activeTab === "npcs" &&
                    t(
                      `Ready to import ${previewData.npcs?.length || 0} NPCs`,
                      `جاهز لاستيراد ${previewData.npcs?.length || 0} شخصية`,
                    )}
                  {activeTab === "rosters" &&
                    t(
                      `Ready to import ${previewData.rosters?.length || 0} roster entries`,
                      `جاهز لاستيراد ${previewData.rosters?.length || 0} إدخال فريق`,
                    )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreview} disabled={!jsonInput || isLoading}>
                {t("Validate", "تحقق")}
              </Button>
              <Button
                onClick={handleImport}
                disabled={!previewData || validationErrors.length > 0 || isLoading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? t("Importing...", "جاري الاستيراد...") : t("Import", "استيراد")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
