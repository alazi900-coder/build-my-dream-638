import { useState, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { History, MessageSquare, Trash2, Clock } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface ChatSession {
  id: string;
  preview: string;
  messageCount: number;
  timestamp: number;
}

const HISTORY_KEY = "pokemon-coach-chat-sessions";

export function ChatHistory({ onLoadSession }: { onLoadSession?: (sessionId: string) => void }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load chat sessions:", e);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setSessions([]);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "PPp", { locale: isAr ? ar : enUS });
  };

  if (sessions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {isAr ? "لا توجد محادثات سابقة" : "No previous conversations"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className={cn("flex items-center justify-between", isAr && "flex-row-reverse")}>
          <CardTitle
            className={cn("flex items-center gap-2 text-base", isAr && "flex-row-reverse")}
          >
            <History className="h-5 w-5" />
            {isAr ? "المحادثات السابقة" : "Previous Chats"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px]">
          <div className="divide-y">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onLoadSession?.(session.id)}
                className={cn(
                  "w-full p-3 hover:bg-muted/50 transition-colors text-start",
                  isAr && "text-right",
                )}
              >
                <div className={cn("flex items-center gap-2 mb-1", isAr && "flex-row-reverse")}>
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate flex-1">{session.preview}</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-3 text-xs text-muted-foreground",
                    isAr && "flex-row-reverse",
                  )}
                >
                  <span className={cn("flex items-center gap-1", isAr && "flex-row-reverse")}>
                    <Clock className="h-3 w-3" />
                    {formatDate(session.timestamp)}
                  </span>
                  <span>
                    {session.messageCount} {isAr ? "رسائل" : "messages"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
