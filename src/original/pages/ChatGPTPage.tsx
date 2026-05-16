import { useRef, useEffect, useState, useCallback } from "react";
import { Layout } from "@/original/components/layout/Layout";
import { ChatMessage } from "@/original/components/coach/ChatMessage";
import { ChatInput } from "@/original/components/coach/ChatInput";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Button } from "@/original/components/ui/button";
import { Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/original/lib/utils";
import { toast } from "@/original/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatgpt`;
const STORAGE_KEY = "chatgpt-history";

const ChatGPTPage = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored).filter((m: Message) => !m.isStreaming) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRTL = language === "ar";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const hasStreaming = messages.some((m) => m.isStreaming);
    if (!hasStreaming && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userMessage.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const assistantId = crypto.randomUUID();
      let assistantContent = "";

      const updateAssistant = (chunk: string) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === assistantId) {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m,
            );
          }
          return [
            ...prev,
            { id: assistantId, role: "assistant", content: assistantContent, isStreaming: true },
          ];
        });
      };

      try {
        const chatMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: chatMessages, language }),
        });

        if (!resp.ok) {
          const errorData = await resp.json();
          if (resp.status === 429 || resp.status === 402) {
            toast({
              title: language === "ar" ? "خطأ" : "Error",
              description: errorData.message,
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          throw new Error(errorData.error || "Failed to get response");
        }

        if (!resp.body) throw new Error("No response body");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) updateAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m)),
        );
      } catch (error) {
        console.error("ChatGPT error:", error);
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description: language === "ar" ? "حدث خطأ أثناء الاتصال" : "Failed to connect",
          variant: "destructive",
        });
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, language],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const quickPrompts =
    language === "ar"
      ? [
          "ما هي أفضل استراتيجية للفوز بمعركة بوكيمون؟",
          "اشرح لي نظام الأنواع في بوكيمون",
          "كيف أبني فريق متوازن؟",
          "ما هي أقوى الحركات في اللعبة؟",
        ]
      : [
          "What's the best strategy to win a Pokemon battle?",
          "Explain the type system in Pokemon",
          "How do I build a balanced team?",
          "What are the strongest moves in the game?",
        ];

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
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <h1 className="font-bold text-lg">Gemini</h1>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "مدعوم بـ Gemini" : "Powered by Gemini"}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 mb-4">
                <Sparkles className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                {language === "ar" ? "مرحباً! أنا Gemini 🤖" : "Hello! I'm Gemini 🤖"}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                {language === "ar"
                  ? "يمكنني مساعدتك في أي شيء يخص البوكيمون أو غيره. اختر سؤالاً أو اكتب سؤالك!"
                  : "I can help you with anything about Pokemon or beyond. Pick a question or type your own!"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {quickPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
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

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </Layout>
  );
};

export default ChatGPTPage;
