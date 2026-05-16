import { useState, KeyboardEvent } from "react";
import { Button } from "@/original/components/ui/button";
import { Textarea } from "@/original/components/ui/textarea";
import { Send } from "lucide-react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t bg-background">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={language === "ar" ? "اكتب سؤالك هنا..." : "Type your question here..."}
        disabled={disabled}
        className={cn("min-h-[44px] max-h-32 resize-none", isRTL && "text-right")}
        dir={isRTL ? "rtl" : "ltr"}
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        size="icon"
        className="shrink-0 h-11 w-11"
      >
        <Send className={cn("h-5 w-5", isRTL && "rotate-180")} />
      </Button>
    </div>
  );
};
