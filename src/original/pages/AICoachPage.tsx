import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/original/components/layout/Layout";
import { ChatMessage } from "@/original/components/coach/ChatMessage";
import { ChatInput } from "@/original/components/coach/ChatInput";
import { QuickQuestions } from "@/original/components/coach/QuickQuestions";
import { OfflineIndicatorBadge } from "@/original/components/coach/OfflineIndicatorBadge";
import { CoachPersonalizedTips } from "@/original/components/coach/CoachPersonalizedTips";
import { useOfflineAICoach } from "@/original/hooks/useOfflineAICoach";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { Bot, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/original/lib/utils";

const AICoachPage = () => {
  const { messages, isLoading, sendMessage, clearChat, isOnline } = useOfflineAICoach();
  const { tr, language } = useLanguage();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRTL = language === "ar";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between p-4 border-b",
            isRTL && "flex-row-reverse",
          )}
        >
          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg">{tr("page.coach.title")}</h1>
                <OfflineIndicatorBadge isOnline={isOnline} />
              </div>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? language === "ar"
                    ? "اسألني أي شيء!"
                    : "Ask me anything!"
                  : language === "ar"
                    ? "ردود محفوظة متاحة"
                    : "Cached responses available"}
              </p>
            </div>
          </div>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/chatgpt")}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {tr("nav.gemini")}
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                aria-label={tr("action.clear")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                {language === "ar"
                  ? "مرحباً! أنا مدربك الشخصي 🎮"
                  : "Hello! I'm your personal coach 🎮"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                {isOnline
                  ? language === "ar"
                    ? "يمكنني مساعدتك في استراتيجيات المعارك، بناء الفرق، ومعرفة نقاط القوة والضعف. اختر سؤالاً أو اكتب سؤالك!"
                    : "I can help you with battle strategies, team building, and type matchups. Pick a question or type your own!"
                  : language === "ar"
                    ? "أنت غير متصل حالياً. يمكنني الإجابة على الأسئلة المحفوظة أو أسئلة الأنواع."
                    : "You are currently offline. I can answer cached questions or type-related questions."}
              </p>
              <QuickQuestions
                onSelect={sendMessage}
                disabled={isLoading}
                showOfflineIndicator={!isOnline}
              />

              {/* Personalized Tips */}
              <div className="mt-4 max-w-md">
                <CoachPersonalizedTips />
              </div>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick questions when there are messages */}
        {messages.length > 0 && !isLoading && (
          <QuickQuestions
            onSelect={sendMessage}
            disabled={isLoading}
            showOfflineIndicator={!isOnline}
          />
        )}

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </Layout>
  );
};

export default AICoachPage;
