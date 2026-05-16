import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/original/integrations/supabase/client";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Input } from "@/original/components/ui/input";
import { Textarea } from "@/original/components/ui/textarea";
import { Badge } from "@/original/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/original/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/original/components/ui/select";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { Plus, Edit, Trash2, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { ALL_TYPES } from "@/original/lib/typeEffectiveness";
import { GAMES } from "@/original/contexts/GameFilterContext";

interface Gym {
  id?: number;
  game_id: string;
  leader_name_en: string;
  leader_name_ar: string;
  city_en: string;
  city_ar: string;
  type: string;
  challenge_en?: string;
  challenge_ar?: string;
  tips_en?: string;
  tips_ar?: string;
  badge_order?: number;
  available_in?: string[];
}

interface GymRosterItem {
  id?: number;
  gym_id: number;
  pokemon_id: number;
  level: number;
  moves?: string[];
}

const emptyGym: Gym = {
  game_id: "swsh",
  leader_name_en: "",
  leader_name_ar: "",
  city_en: "",
  city_ar: "",
  type: "normal",
  challenge_en: "",
  challenge_ar: "",
  tips_en: "",
  tips_ar: "",
  badge_order: 1,
  available_in: ["swsh"],
};

export function GymAdminSection() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);
  const [selectedGymForRoster, setSelectedGymForRoster] = useState<Gym | null>(null);
  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  // Fetch gyms
  const { data: gyms = [], isLoading } = useQuery({
    queryKey: ["admin-gyms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gyms")
        .select("*")
        .order("game_id")
        .order("badge_order");
      if (error) throw error;
      return data as Gym[];
    },
  });

  // Fetch roster for selected gym
  const { data: roster = [] } = useQuery({
    queryKey: ["admin-gym-roster", selectedGymForRoster?.id],
    queryFn: async () => {
      if (!selectedGymForRoster?.id) return [];
      const { data, error } = await supabase
        .from("gym_roster")
        .select("*")
        .eq("gym_id", selectedGymForRoster.id)
        .order("level");
      if (error) throw error;
      return data as GymRosterItem[];
    },
    enabled: !!selectedGymForRoster?.id,
  });

  // Save gym mutation
  const saveGymMutation = useMutation({
    mutationFn: async (gym: Gym) => {
      if (gym.id) {
        const { error } = await supabase.from("gyms").update(gym).eq("id", gym.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gyms").insert(gym);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gyms"] });
      setDialogOpen(false);
      setEditingGym(null);
      toast.success(t("Gym saved!", "تم حفظ الصالة!"));
    },
    onError: (e) => toast.error(e.message),
  });

  // Delete gym mutation
  const deleteGymMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("gyms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gyms"] });
      toast.success(t("Gym deleted", "تم حذف الصالة"));
    },
    onError: (e) => toast.error(e.message),
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (data: { gyms?: Gym[]; roster?: GymRosterItem[] }) => {
      if (data.gyms && data.gyms.length > 0) {
        const { error } = await supabase.from("gyms").upsert(data.gyms, { onConflict: "id" });
        if (error) throw error;
      }
      if (data.roster && data.roster.length > 0) {
        const { error } = await supabase
          .from("gym_roster")
          .upsert(data.roster, { onConflict: "id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gyms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gym-roster"] });
      setJsonImportOpen(false);
      setJsonInput("");
      toast.success(t("Import complete!", "اكتمل الاستيراد!"));
    },
    onError: (e) => toast.error(e.message),
  });

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.gyms && !parsed.roster) {
        toast.error(t("Invalid format. Expected { gyms: [...], roster: [...] }", "صيغة غير صالحة"));
        return;
      }
      bulkImportMutation.mutate(parsed);
    } catch (e) {
      toast.error(t("Invalid JSON", "JSON غير صالح"));
    }
  };

  const handleSaveGym = () => {
    if (!editingGym) return;
    if (!editingGym.leader_name_en || !editingGym.city_en) {
      toast.error(t("Fill required fields", "املأ الحقول المطلوبة"));
      return;
    }
    saveGymMutation.mutate(editingGym);
  };

  const openNewGym = () => {
    setEditingGym({ ...emptyGym });
    setDialogOpen(true);
  };

  const openEditGym = (gym: Gym) => {
    setEditingGym({ ...gym });
    setDialogOpen(true);
  };

  const openRosterEditor = (gym: Gym) => {
    setSelectedGymForRoster(gym);
    setRosterDialogOpen(true);
  };

  // Group gyms by game
  const gymsByGame = gyms.reduce(
    (acc, gym) => {
      const key = gym.game_id || "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(gym);
      return acc;
    },
    {} as Record<string, Gym[]>,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("Gym Management", "إدارة الصالات")}</span>
          <div className="flex gap-2">
            <Dialog open={jsonImportOpen} onOpenChange={setJsonImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  {t("Bulk Import", "استيراد")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {t("Bulk Import Gyms & Roster", "استيراد الصالات والفرق")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'Paste JSON with format: { "gyms": [...], "roster": [...] }',
                      'الصق JSON بالصيغة: { "gyms": [...], "roster": [...] }',
                    )}
                  </p>
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{ "gyms": [...], "roster": [...] }'
                    className="min-h-[200px] font-mono text-xs"
                  />
                  <Button onClick={handleJsonImport} disabled={bulkImportMutation.isPending}>
                    {t("Import", "استيراد")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={openNewGym}>
              <Plus className="w-4 h-4 mr-1" />
              {t("Add Gym", "إضافة صالة")}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</p>
        ) : gyms.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t(
              "No gyms yet. Add one or import data.",
              "لا توجد صالات بعد. أضف واحدة أو استورد البيانات.",
            )}
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(gymsByGame).map(([gameId, gameGyms]) => (
              <div key={gameId}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {GAMES.find((g) => g.id === gameId)?.fullNameEn || gameId}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {gameGyms.map((gym) => (
                    <div
                      key={gym.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="shrink-0">
                          #{gym.badge_order}
                        </Badge>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {language === "ar" ? gym.leader_name_ar : gym.leader_name_en}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {language === "ar" ? gym.city_ar : gym.city_en}
                          </p>
                        </div>
                        <TypeBadge type={gym.type} size="sm" />
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openRosterEditor(gym)}
                        >
                          <Users className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditGym(gym)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => gym.id && deleteGymMutation.mutate(gym.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit/Add Gym Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGym?.id ? t("Edit Gym", "تعديل الصالة") : t("Add Gym", "إضافة صالة")}
              </DialogTitle>
            </DialogHeader>
            {editingGym && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">{t("Game", "اللعبة")}</label>
                    <Select
                      value={editingGym.game_id}
                      onValueChange={(v) =>
                        setEditingGym({ ...editingGym, game_id: v, available_in: [v] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GAMES.filter((g) => g.id !== "all").map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">{t("Type", "النوع")}</label>
                    <Select
                      value={editingGym.type}
                      onValueChange={(v) => setEditingGym({ ...editingGym, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Leader Name (EN)"
                    value={editingGym.leader_name_en}
                    onChange={(e) =>
                      setEditingGym({ ...editingGym, leader_name_en: e.target.value })
                    }
                  />
                  <Input
                    placeholder="اسم القائد (AR)"
                    value={editingGym.leader_name_ar}
                    onChange={(e) =>
                      setEditingGym({ ...editingGym, leader_name_ar: e.target.value })
                    }
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="City (EN)"
                    value={editingGym.city_en}
                    onChange={(e) => setEditingGym({ ...editingGym, city_en: e.target.value })}
                  />
                  <Input
                    placeholder="المدينة (AR)"
                    value={editingGym.city_ar}
                    onChange={(e) => setEditingGym({ ...editingGym, city_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    {t("Badge Order", "ترتيب الشارة")}
                  </label>
                  <Input
                    type="number"
                    value={editingGym.badge_order || 1}
                    onChange={(e) =>
                      setEditingGym({ ...editingGym, badge_order: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Textarea
                    placeholder="Challenge (EN)"
                    value={editingGym.challenge_en || ""}
                    onChange={(e) => setEditingGym({ ...editingGym, challenge_en: e.target.value })}
                  />
                  <Textarea
                    placeholder="التحدي (AR)"
                    value={editingGym.challenge_ar || ""}
                    onChange={(e) => setEditingGym({ ...editingGym, challenge_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Textarea
                    placeholder="Tips (EN)"
                    value={editingGym.tips_en || ""}
                    onChange={(e) => setEditingGym({ ...editingGym, tips_en: e.target.value })}
                  />
                  <Textarea
                    placeholder="النصائح (AR)"
                    value={editingGym.tips_ar || ""}
                    onChange={(e) => setEditingGym({ ...editingGym, tips_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <Button
                  onClick={handleSaveGym}
                  disabled={saveGymMutation.isPending}
                  className="w-full"
                >
                  {t("Save", "حفظ")}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Roster Editor Dialog */}
        <Dialog open={rosterDialogOpen} onOpenChange={setRosterDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {t("Roster for", "فريق")}{" "}
                {selectedGymForRoster &&
                  (language === "ar"
                    ? selectedGymForRoster.leader_name_ar
                    : selectedGymForRoster.leader_name_en)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {roster.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t(
                    "No roster data. Use bulk import to add.",
                    "لا توجد بيانات فريق. استخدم الاستيراد لإضافتها.",
                  )}
                </p>
              ) : (
                roster.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded border">
                    <span>Pokemon #{r.pokemon_id}</span>
                    <Badge>Lv. {r.level}</Badge>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
