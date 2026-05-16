import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Textarea } from "@/original/components/ui/textarea";
import { StickyNote, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ItemNotesSectionProps {
  itemId: number;
}

const STORAGE_KEY = "item_notes";

export function ItemNotesSection({ itemId }: ItemNotesSectionProps) {
  const { language } = useLanguage();
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Load saved note on mount
  useEffect(() => {
    const allNotes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const itemNote = allNotes[itemId] || "";
    setSavedNote(itemNote);
    setNote(itemNote);
  }, [itemId]);

  const handleSave = () => {
    const allNotes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    if (note.trim()) {
      allNotes[itemId] = note.trim();
    } else {
      delete allNotes[itemId];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));
    setSavedNote(note.trim());
    setIsEditing(false);

    toast.success(language === "ar" ? "تم حفظ الملاحظة" : "Note saved");
  };

  const handleDelete = () => {
    const allNotes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    delete allNotes[itemId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotes));

    setNote("");
    setSavedNote("");
    setIsEditing(false);

    toast.success(language === "ar" ? "تم حذف الملاحظة" : "Note deleted");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <StickyNote className="w-5 h-5 text-primary" />
            {language === "ar" ? "ملاحظاتي" : "My Notes"}
          </span>
          {savedNote && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs"
            >
              {language === "ar" ? "تعديل" : "Edit"}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing || !savedNote ? (
          <div className="space-y-3">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                language === "ar"
                  ? "أضف ملاحظة شخصية عن هذه الأداة..."
                  : "Add a personal note about this item..."
              }
              className="min-h-[80px] resize-none"
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            <div className="flex items-center gap-2 justify-end">
              {savedNote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  {language === "ar" ? "حذف" : "Delete"}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!note.trim() && !savedNote}
                className="gap-1"
              >
                <Save className="w-3 h-3" />
                {language === "ar" ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p
              className="text-foreground whitespace-pre-wrap"
              dir={language === "ar" ? "rtl" : "ltr"}
            >
              {savedNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
