import { useState, useCallback, useEffect } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import { toast } from "@/original/hooks/use-toast";
import { getSupabaseFunctionRequest } from "@/original/integrations/supabase/client";
import { findCachedResponse, saveAIResponse, initializeFAQ } from "@/original/lib/offlineAI";
import { processLocalQuestion } from "@/original/lib/localAssistant";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp?: number;
  isOffline?: boolean; // Flag to indicate offline response
}

const STORAGE_KEY = "pokemon-coach-chat-history";

const loadMessagesFromStorage = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.filter((m: ChatMessage) => !m.isStreaming);
    }
  } catch (e) {
    console.error("Failed to load chat history:", e);
  }
  return [];
};

const saveMessagesToStorage = (messages: ChatMessage[]) => {
  try {
    const toSave = messages.filter((m) => !m.isStreaming);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
};

export const useOfflineAICoach = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessagesFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const isOnline = useOnlineStatus();

  // Initialize FAQ on mount
  useEffect(() => {
    initializeFAQ().catch(console.error);
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    const hasStreaming = messages.some((m) => m.isStreaming);
    if (!hasStreaming && messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: userMessage.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const assistantId = crypto.randomUUID();

      // If offline, try local responses
      if (!isOnline) {
        try {
          // First try local processing
          let response = processLocalQuestion(userMessage, language);

          // Then try cached responses
          if (!response) {
            response = await findCachedResponse(userMessage, language);
          }

          if (response) {
            const offlineNote =
              language === "ar"
                ? "\n\n---\n📱 *هذا الرد من الذاكرة المحفوظة (وضع عدم الاتصال)*"
                : "\n\n---\n📱 *This response is from cached data (offline mode)*";

            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: response + offlineNote,
                timestamp: Date.now(),
                isOffline: true,
              },
            ]);
          } else {
            // No cached response available
            const noDataMsg =
              language === "ar"
                ? "📱 **أنت غير متصل بالإنترنت**\n\nللأسف لا يوجد رد محفوظ لهذا السؤال. جرب:\n\n• الأسئلة السريعة المتاحة\n• أسئلة عن الأنواع ونقاط الضعف\n• الاتصال بالإنترنت للإجابات الكاملة"
                : "📱 **You are offline**\n\nNo cached response found for this question. Try:\n\n• Available quick questions\n• Type weakness questions\n• Connect to internet for full answers";

            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: noDataMsg,
                timestamp: Date.now(),
                isOffline: true,
              },
            ]);
          }
        } catch (error) {
          console.error("Offline response error:", error);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Online: use AI
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
            {
              id: assistantId,
              role: "assistant",
              content: assistantContent,
              isStreaming: true,
              timestamp: Date.now(),
            },
          ];
        });
      };

      try {
        const chatMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const request = getSupabaseFunctionRequest("ai-coach");
        if (!request) {
          const localResponse = processLocalQuestion(userMessage, language);
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content:
                localResponse ||
                (language === "ar"
                  ? "ميزة المدرب الذكي تحتاج إعداد Supabase للردود المتصلة."
                  : "AI Coach needs Supabase configuration for online responses."),
              timestamp: Date.now(),
              isOffline: true,
            },
          ]);
          return;
        }

        const resp = await fetch(request.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...request.headers,
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

        // Save response for offline use
        if (assistantContent) {
          await saveAIResponse(userMessage, assistantContent, language);
        }

        // Mark streaming as complete
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m)),
        );
      } catch (error) {
        console.error("AI Coach error:", error);
        toast({
          title: language === "ar" ? "خطأ" : "Error",
          description:
            language === "ar" ? "حدث خطأ أثناء الاتصال بالمدرب" : "Failed to connect to coach",
          variant: "destructive",
        });
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, language, isOnline],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, isLoading, sendMessage, clearChat, isOnline };
};
