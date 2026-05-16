import { useEffect, useRef } from "react";
import { cn } from "@/original/lib/utils";
import { BattleLogEntry } from "@/original/lib/battleUtils";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { Swords, Zap, Skull, RefreshCw, Flag, MessageCircle } from "lucide-react";

interface BattleLogProps {
  entries: BattleLogEntry[];
  language: "en" | "ar";
  maxHeight?: string;
  className?: string;
}

const LOG_ICONS: Record<string, React.ReactNode> = {
  action: <Swords className="w-3.5 h-3.5" />,
  damage: <Zap className="w-3.5 h-3.5" />,
  faint: <Skull className="w-3.5 h-3.5" />,
  switch: <RefreshCw className="w-3.5 h-3.5" />,
  end: <Flag className="w-3.5 h-3.5" />,
};

const LOG_COLORS: Record<string, string> = {
  action: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  damage: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  faint: "text-red-500 bg-red-500/10 border-red-500/20",
  switch: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  end: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
};

export function BattleLog({ entries, language, maxHeight = "200px", className }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries.length]);

  const getMessage = (entry: BattleLogEntry) => {
    return language === "ar" ? entry.messageAr : entry.messageEn;
  };

  const isEffectivenessMessage = (message: string) => {
    return (
      message.includes("effective") ||
      message.includes("فعال") ||
      message.includes("effect") ||
      message.includes("يؤثر")
    );
  };

  const getEffectivenessStyle = (message: string) => {
    if (message.includes("super effective") || message.includes("فعال جداً")) {
      return "text-green-500 font-bold";
    }
    if (message.includes("not very effective") || message.includes("ليس فعالاً")) {
      return "text-orange-400";
    }
    if (message.includes("no effect") || message.includes("لا يؤثر")) {
      return "text-gray-400 italic";
    }
    return "";
  };

  return (
    <div className={cn("rounded-lg border bg-card/50", className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-sm">{language === "ar" ? "سجل المعركة" : "Battle Log"}</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {entries.length} {language === "ar" ? "رسالة" : "messages"}
        </span>
      </div>

      <ScrollArea className="p-2" style={{ maxHeight }}>
        <div ref={scrollRef} className="space-y-1.5">
          {entries.map((entry, index) => {
            const message = getMessage(entry);
            const effectivenessStyle = isEffectivenessMessage(message)
              ? getEffectivenessStyle(message)
              : "";

            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg border text-sm animate-log-entry",
                  LOG_COLORS[entry.type] || LOG_COLORS.action,
                  effectivenessStyle,
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {LOG_ICONS[entry.type] || LOG_ICONS.action}
                </span>
                <span className={cn("flex-1", language === "ar" && "text-right")}>{message}</span>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      {entries.length === 0 && (
        <div className="p-4 text-center text-muted-foreground text-sm">
          {language === "ar" ? "لا توجد رسائل بعد" : "No messages yet"}
        </div>
      )}
    </div>
  );
}
