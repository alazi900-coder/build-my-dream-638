import { cn } from "@/original/lib/utils";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = ({ role, content, isStreaming }: ChatMessageProps) => {
  const { language } = useLanguage();
  const isUser = role === "user";
  const isRTL = language === "ar";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "flex-row-reverse" : "flex-row",
        isRTL && !isUser && "flex-row-reverse",
        isRTL && isUser && "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "flex-1 rounded-2xl px-4 py-3 max-w-[80%]",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          isRTL ? "text-right" : "text-left",
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
          {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
        </p>
      </div>
    </div>
  );
};
