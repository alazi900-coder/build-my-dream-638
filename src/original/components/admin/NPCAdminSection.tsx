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
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { Plus, Edit, Trash2, User, Search } from "lucide-react";
import { toast } from "sonner";

interface NPC {
  id?: number;
  name_en: string;
  name_ar: string;
  role_en: string;
  role_ar: string;
  category: string;
  location_en: string;
  location_ar: string;
  story_en?: string;
  story_ar?: string;
  image_url?: string;
  badge_order?: number;
  specialty_type?: string;
}

const NPC_CATEGORIES = [
  { value: "gym_leader", labelEn: "Gym Leader", labelAr: "قائد صالة" },
  { value: "champion", labelEn: "Champion", labelAr: "بطل" },
  { value: "rival", labelEn: "Rival", labelAr: "منافس" },
  { value: "professor", labelEn: "Professor", labelAr: "بروفيسور" },
  { value: "villain", labelEn: "Villain", labelAr: "شرير" },
  { value: "important", labelEn: "Important NPC", labelAr: "شخصية مهمة" },
];

const emptyNPC: NPC = {
  name_en: "",
  name_ar: "",
  role_en: "",
  role_ar: "",
  category: "important",
  location_en: "",
  location_ar: "",
  story_en: "",
  story_ar: "",
  image_url: "",
  badge_order: 0,
  specialty_type: "",
};

export function NPCAdminSection() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [editingNPC, setEditingNPC] = useState<NPC | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch NPCs
  const { data: npcs = [], isLoading } = useQuery({
    queryKey: ["admin-npcs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("npcs")
        .select("*")
        .order("category")
        .order("badge_order");
      if (error) throw error;
      return data as NPC[];
    },
  });

  // Filter NPCs
  const filteredNPCs = npcs.filter((npc) => {
    const matchesSearch =
      searchQuery === "" ||
      npc.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.name_ar.includes(searchQuery);
    const matchesCategory = categoryFilter === "all" || npc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Save NPC mutation
  const saveNPCMutation = useMutation({
    mutationFn: async (npc: NPC) => {
      if (npc.id) {
        const { error } = await supabase.from("npcs").update(npc).eq("id", npc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("npcs").insert(npc);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-npcs"] });
      queryClient.invalidateQueries({ queryKey: ["npcs"] });
      queryClient.invalidateQueries({ queryKey: ["npcs-gym-leaders"] });
      setDialogOpen(false);
      setEditingNPC(null);
      toast.success(t("NPC saved!", "تم حفظ الشخصية!"));
    },
    onError: (e) => toast.error(e.message),
  });

  // Delete NPC mutation
  const deleteNPCMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("npcs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-npcs"] });
      toast.success(t("NPC deleted", "تم حذف الشخصية"));
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSaveNPC = () => {
    if (!editingNPC) return;
    if (!editingNPC.name_en || !editingNPC.name_ar) {
      toast.error(t("Fill required fields", "املأ الحقول المطلوبة"));
      return;
    }
    saveNPCMutation.mutate(editingNPC);
  };

  const openNewNPC = () => {
    setEditingNPC({ ...emptyNPC });
    setDialogOpen(true);
  };

  const openEditNPC = (npc: NPC) => {
    setEditingNPC({ ...npc });
    setDialogOpen(true);
  };

  // Group NPCs by category
  const npcsByCategory = filteredNPCs.reduce(
    (acc, npc) => {
      const key = npc.category || "important";
      if (!acc[key]) acc[key] = [];
      acc[key].push(npc);
      return acc;
    },
    {} as Record<string, NPC[]>,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t("NPC Management", "إدارة الشخصيات")}
          </span>
          <Button size="sm" onClick={openNewNPC}>
            <Plus className="w-4 h-4 mr-1" />
            {t("Add NPC", "إضافة شخصية")}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("Search NPCs...", "بحث عن شخصيات...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All", "الكل")}</SelectItem>
              {NPC_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {language === "ar" ? cat.labelAr : cat.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* NPCs List */}
        {isLoading ? (
          <p className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</p>
        ) : filteredNPCs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t(
              "No NPCs found. Add one or import data.",
              "لا توجد شخصيات. أضف واحدة أو استورد البيانات.",
            )}
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {Object.entries(npcsByCategory).map(([category, categoryNPCs]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-card py-1">
                    {NPC_CATEGORIES.find((c) => c.value === category)?.[
                      language === "ar" ? "labelAr" : "labelEn"
                    ] || category}
                    <Badge variant="secondary" className="ml-2">
                      {categoryNPCs.length}
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {categoryNPCs.map((npc) => (
                      <div
                        key={npc.id}
                        className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        {npc.image_url ? (
                          <img
                            src={npc.image_url}
                            alt={language === "ar" ? npc.name_ar : npc.name_en}
                            className="w-10 h-10 rounded-full object-cover border-2 border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {language === "ar" ? npc.name_ar : npc.name_en}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {language === "ar" ? npc.role_ar : npc.role_en}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditNPC(npc)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => npc.id && deleteNPCMutation.mutate(npc.id)}
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
          </ScrollArea>
        )}

        {/* Edit/Add NPC Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNPC?.id ? t("Edit NPC", "تعديل الشخصية") : t("Add NPC", "إضافة شخصية")}
              </DialogTitle>
            </DialogHeader>
            {editingNPC && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Name (EN)"
                    value={editingNPC.name_en}
                    onChange={(e) => setEditingNPC({ ...editingNPC, name_en: e.target.value })}
                  />
                  <Input
                    placeholder="الاسم (AR)"
                    value={editingNPC.name_ar}
                    onChange={(e) => setEditingNPC({ ...editingNPC, name_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Role (EN)"
                    value={editingNPC.role_en}
                    onChange={(e) => setEditingNPC({ ...editingNPC, role_en: e.target.value })}
                  />
                  <Input
                    placeholder="الدور (AR)"
                    value={editingNPC.role_ar}
                    onChange={(e) => setEditingNPC({ ...editingNPC, role_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={editingNPC.category}
                    onValueChange={(v) => setEditingNPC({ ...editingNPC, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {NPC_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Specialty Type (e.g., rock, water)"
                    value={editingNPC.specialty_type || ""}
                    onChange={(e) =>
                      setEditingNPC({ ...editingNPC, specialty_type: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Location (EN)"
                    value={editingNPC.location_en}
                    onChange={(e) => setEditingNPC({ ...editingNPC, location_en: e.target.value })}
                  />
                  <Input
                    placeholder="الموقع (AR)"
                    value={editingNPC.location_ar}
                    onChange={(e) => setEditingNPC({ ...editingNPC, location_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    {t("Badge Order (for gym leaders)", "ترتيب الشارة (لقادة الصالات)")}
                  </label>
                  <Input
                    type="number"
                    value={editingNPC.badge_order || 0}
                    onChange={(e) =>
                      setEditingNPC({ ...editingNPC, badge_order: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <Input
                  placeholder="Image URL"
                  value={editingNPC.image_url || ""}
                  onChange={(e) => setEditingNPC({ ...editingNPC, image_url: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Textarea
                    placeholder="Story (EN)"
                    value={editingNPC.story_en || ""}
                    onChange={(e) => setEditingNPC({ ...editingNPC, story_en: e.target.value })}
                    className="min-h-[80px]"
                  />
                  <Textarea
                    placeholder="القصة (AR)"
                    value={editingNPC.story_ar || ""}
                    onChange={(e) => setEditingNPC({ ...editingNPC, story_ar: e.target.value })}
                    dir="rtl"
                    className="min-h-[80px]"
                  />
                </div>
                <Button
                  onClick={handleSaveNPC}
                  disabled={saveNPCMutation.isPending}
                  className="w-full"
                >
                  {t("Save", "حفظ")}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
