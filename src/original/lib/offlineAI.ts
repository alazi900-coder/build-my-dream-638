import { openDB, IDBPDatabase } from "idb";

interface AIResponseDB {
  ai_responses: {
    key: string;
    value: {
      id: string;
      question: string;
      answer: string;
      category: string;
      timestamp: number;
      language: "ar" | "en";
    };
    indexes: { "by-category": string; "by-language": string };
  };
  ai_faq: {
    key: string;
    value: {
      id: string;
      question_ar: string;
      question_en: string;
      answer_ar: string;
      answer_en: string;
      category: string;
      keywords: string[];
    };
    indexes: { "by-category": string };
  };
}

let aiDbPromise: Promise<IDBPDatabase<AIResponseDB>> | null = null;

export async function getAIDB() {
  if (!aiDbPromise) {
    aiDbPromise = openDB<AIResponseDB>("pokemon-ai-db", 1, {
      upgrade(db) {
        // Store for cached AI responses
        const responsesStore = db.createObjectStore("ai_responses", { keyPath: "id" });
        responsesStore.createIndex("by-category", "category");
        responsesStore.createIndex("by-language", "language");

        // Store for pre-loaded FAQ
        const faqStore = db.createObjectStore("ai_faq", { keyPath: "id" });
        faqStore.createIndex("by-category", "category");
      },
    });
  }
  return aiDbPromise;
}

// Save AI response for offline access
export async function saveAIResponse(
  question: string,
  answer: string,
  language: "ar" | "en",
): Promise<void> {
  const db = await getAIDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const category = categorizeQuestion(question, language);

  await db.put("ai_responses", {
    id,
    question: question.toLowerCase().trim(),
    answer,
    category,
    timestamp: Date.now(),
    language,
  });
}

// Search for similar cached responses
export async function findCachedResponse(
  question: string,
  language: "ar" | "en",
): Promise<string | null> {
  const db = await getAIDB();
  const normalizedQuestion = question.toLowerCase().trim();

  // First try exact match
  const allResponses = await db.getAll("ai_responses");
  const exactMatch = allResponses.find(
    (r) => r.language === language && r.question === normalizedQuestion,
  );
  if (exactMatch) return exactMatch.answer;

  // Try keyword matching
  const keywords = extractKeywords(normalizedQuestion, language);
  for (const response of allResponses) {
    if (response.language !== language) continue;
    const responseKeywords = extractKeywords(response.question, language);
    const matchScore = calculateMatchScore(keywords, responseKeywords);
    if (matchScore > 0.7) {
      return response.answer;
    }
  }

  // Try FAQ
  const faqMatch = await findFAQAnswer(question, language);
  if (faqMatch) return faqMatch;

  return null;
}

// Find answer from pre-loaded FAQ
export async function findFAQAnswer(
  question: string,
  language: "ar" | "en",
): Promise<string | null> {
  const db = await getAIDB();
  const allFAQ = await db.getAll("ai_faq");
  const normalizedQuestion = question.toLowerCase().trim();
  const keywords = extractKeywords(normalizedQuestion, language);

  for (const faq of allFAQ) {
    const faqQuestion = language === "ar" ? faq.question_ar : faq.question_en;
    const faqKeywords = [...faq.keywords, ...extractKeywords(faqQuestion, language)];
    const matchScore = calculateMatchScore(keywords, faqKeywords);

    if (matchScore > 0.5) {
      return language === "ar" ? faq.answer_ar : faq.answer_en;
    }
  }

  return null;
}

// Initialize FAQ database with pre-loaded answers
export async function initializeFAQ(): Promise<void> {
  const db = await getAIDB();
  const existingCount = await db.count("ai_faq");
  if (existingCount > 0) return; // Already initialized

  const faqData = getPreloadedFAQ();
  const tx = db.transaction("ai_faq", "readwrite");

  for (const faq of faqData) {
    await tx.store.put(faq);
  }

  await tx.done;
}

// Get count of cached responses
export async function getCachedResponsesCount(): Promise<number> {
  const db = await getAIDB();
  return db.count("ai_responses");
}

// Clear old cached responses (keep last 100)
export async function cleanupOldResponses(): Promise<void> {
  const db = await getAIDB();
  const allResponses = await db.getAll("ai_responses");

  if (allResponses.length > 100) {
    const sortedByTime = allResponses.sort((a, b) => b.timestamp - a.timestamp);
    const toDelete = sortedByTime.slice(100);

    const tx = db.transaction("ai_responses", "readwrite");
    for (const response of toDelete) {
      await tx.store.delete(response.id);
    }
    await tx.done;
  }
}

// Helper functions
function categorizeQuestion(question: string, language: "ar" | "en"): string {
  const q = question.toLowerCase();

  const categories = {
    type:
      language === "ar"
        ? ["نوع", "ضعف", "قوة", "فعال", "مقاوم"]
        : ["type", "weakness", "strength", "effective", "resist"],
    team:
      language === "ar"
        ? ["فريق", "تشكيل", "توازن", "اقترح"]
        : ["team", "build", "balance", "suggest"],
    gym: language === "ar" ? ["صالة", "قائد", "شارة", "أهزم"] : ["gym", "leader", "badge", "beat"],
    moves:
      language === "ar" ? ["حركة", "حركات", "هجوم", "تعلم"] : ["move", "moves", "attack", "learn"],
    strategy:
      language === "ar"
        ? ["استراتيجية", "خطة", "نصيحة", "كيف"]
        : ["strategy", "plan", "tip", "how"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((k) => q.includes(k))) {
      return category;
    }
  }

  return "general";
}

function extractKeywords(text: string, language: "ar" | "en"): string[] {
  const stopWords =
    language === "ar"
      ? ["ما", "هل", "كيف", "هي", "هو", "في", "من", "على", "إلى", "أن", "لي", "أفضل", "الأفضل"]
      : ["what", "is", "are", "how", "to", "the", "a", "an", "for", "of", "best", "good"];

  const words = text
    .toLowerCase()
    .replace(/[؟?!.,،]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.includes(w));

  return [...new Set(words)];
}

function calculateMatchScore(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  let matches = 0;
  for (const k1 of keywords1) {
    for (const k2 of keywords2) {
      if (k1 === k2 || k1.includes(k2) || k2.includes(k1)) {
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(keywords1.length, keywords2.length);
}

function getPreloadedFAQ() {
  return [
    // === TYPE WEAKNESSES ===
    {
      id: "fire-weakness",
      question_ar: "ما هي نقاط ضعف النار؟",
      question_en: "What are Fire type weaknesses?",
      answer_ar:
        "🔥 **نوع النار ضعيف ضد:**\n\n• 💧 **الماء** - فعال جداً\n• 🪨 **الصخر** - فعال جداً\n• 🏔️ **الأرض** - فعال جداً\n\n**نصيحة:** استخدم بوكيمون مائي أو صخري لمواجهة النار بسهولة!",
      answer_en:
        "🔥 **Fire type is weak against:**\n\n• 💧 **Water** - Super effective\n• 🪨 **Rock** - Super effective\n• 🏔️ **Ground** - Super effective\n\n**Tip:** Use Water or Rock type Pokémon to easily counter Fire types!",
      category: "type",
      keywords: ["fire", "نار", "weakness", "ضعف", "weak"],
    },
    {
      id: "water-weakness",
      question_ar: "ما هي نقاط ضعف الماء؟",
      question_en: "What are Water type weaknesses?",
      answer_ar:
        "💧 **نوع الماء ضعيف ضد:**\n\n• ⚡ **الكهرباء** - فعال جداً\n• 🌿 **العشب** - فعال جداً\n\n**نصيحة:** الكهرباء والعشب هما الخياران الأفضل!",
      answer_en:
        "💧 **Water type is weak against:**\n\n• ⚡ **Electric** - Super effective\n• 🌿 **Grass** - Super effective\n\n**Tip:** Electric and Grass are your best options!",
      category: "type",
      keywords: ["water", "ماء", "مائي", "weakness", "ضعف"],
    },
    {
      id: "electric-weakness",
      question_ar: "ما هي نقاط ضعف الكهرباء؟",
      question_en: "What are Electric type weaknesses?",
      answer_ar:
        "⚡ **نوع الكهرباء ضعيف ضد:**\n\n• 🏔️ **الأرض** - فعال جداً (الوحيد!)\n\n**نصيحة:** الأرض هي الضعف الوحيد للكهرباء، لكن الكهرباء لا تؤثر على الأرض أبداً!",
      answer_en:
        "⚡ **Electric type is weak against:**\n\n• 🏔️ **Ground** - Super effective (the only one!)\n\n**Tip:** Ground is Electric's only weakness, and Electric moves have no effect on Ground types!",
      category: "type",
      keywords: ["electric", "كهرباء", "كهربائي", "weakness", "ضعف"],
    },
    {
      id: "grass-weakness",
      question_ar: "ما هي نقاط ضعف العشب؟",
      question_en: "What are Grass type weaknesses?",
      answer_ar:
        "🌿 **نوع العشب ضعيف ضد:**\n\n• 🔥 **النار** - فعال جداً\n• 🧊 **الجليد** - فعال جداً\n• 🦋 **الحشرات** - فعال جداً\n• ☠️ **السم** - فعال جداً\n• 🦅 **الطيران** - فعال جداً\n\n**نصيحة:** العشب له 5 نقاط ضعف، لكنه مقاوم للماء والأرض والكهرباء!",
      answer_en:
        "🌿 **Grass type is weak against:**\n\n• 🔥 **Fire** - Super effective\n• 🧊 **Ice** - Super effective\n• 🦋 **Bug** - Super effective\n• ☠️ **Poison** - Super effective\n• 🦅 **Flying** - Super effective\n\n**Tip:** Grass has 5 weaknesses, but resists Water, Ground, and Electric!",
      category: "type",
      keywords: ["grass", "عشب", "عشبي", "weakness", "ضعف"],
    },
    {
      id: "ice-weakness",
      question_ar: "ما هي نقاط ضعف الجليد؟",
      question_en: "What are Ice type weaknesses?",
      answer_ar:
        "🧊 **نوع الجليد ضعيف ضد:**\n\n• 🔥 **النار** - فعال جداً\n• ⚔️ **القتال** - فعال جداً\n• 🪨 **الصخر** - فعال جداً\n• 🔩 **الفولاذ** - فعال جداً\n\n**نصيحة:** الجليد من أضعف الأنواع دفاعياً لكنه ممتاز هجومياً ضد التنين!",
      answer_en:
        "🧊 **Ice type is weak against:**\n\n• 🔥 **Fire** - Super effective\n• ⚔️ **Fighting** - Super effective\n• 🪨 **Rock** - Super effective\n• 🔩 **Steel** - Super effective\n\n**Tip:** Ice is one of the weakest defensive types but excellent offensively against Dragon!",
      category: "type",
      keywords: ["ice", "جليد", "ثلج", "weakness", "ضعف"],
    },
    {
      id: "fighting-weakness",
      question_ar: "ما هي نقاط ضعف القتال؟",
      question_en: "What are Fighting type weaknesses?",
      answer_ar:
        "⚔️ **نوع القتال ضعيف ضد:**\n\n• 🦅 **الطيران** - فعال جداً\n• 🔮 **النفسي** - فعال جداً\n• 🧚 **الجن** - فعال جداً\n\n**نصيحة:** القتال لا يؤثر على الشبح إطلاقاً!",
      answer_en:
        "⚔️ **Fighting type is weak against:**\n\n• 🦅 **Flying** - Super effective\n• 🔮 **Psychic** - Super effective\n• 🧚 **Fairy** - Super effective\n\n**Tip:** Fighting has no effect on Ghost types!",
      category: "type",
      keywords: ["fighting", "قتال", "weakness", "ضعف"],
    },
    {
      id: "poison-weakness",
      question_ar: "ما هي نقاط ضعف السم؟",
      question_en: "What are Poison type weaknesses?",
      answer_ar:
        "☠️ **نوع السم ضعيف ضد:**\n\n• 🏔️ **الأرض** - فعال جداً\n• 🔮 **النفسي** - فعال جداً\n\n**نصيحة:** السم لا يؤثر على الفولاذ إطلاقاً!",
      answer_en:
        "☠️ **Poison type is weak against:**\n\n• 🏔️ **Ground** - Super effective\n• 🔮 **Psychic** - Super effective\n\n**Tip:** Poison has no effect on Steel types!",
      category: "type",
      keywords: ["poison", "سم", "weakness", "ضعف"],
    },
    {
      id: "ground-weakness",
      question_ar: "ما هي نقاط ضعف الأرض؟",
      question_en: "What are Ground type weaknesses?",
      answer_ar:
        "🏔️ **نوع الأرض ضعيف ضد:**\n\n• 💧 **الماء** - فعال جداً\n• 🌿 **العشب** - فعال جداً\n• 🧊 **الجليد** - فعال جداً\n\n**نصيحة:** الأرض محصن ضد الكهرباء تماماً!",
      answer_en:
        "🏔️ **Ground type is weak against:**\n\n• 💧 **Water** - Super effective\n• 🌿 **Grass** - Super effective\n• 🧊 **Ice** - Super effective\n\n**Tip:** Ground is completely immune to Electric!",
      category: "type",
      keywords: ["ground", "أرض", "أرضي", "weakness", "ضعف"],
    },
    {
      id: "flying-weakness",
      question_ar: "ما هي نقاط ضعف الطيران؟",
      question_en: "What are Flying type weaknesses?",
      answer_ar:
        "🦅 **نوع الطيران ضعيف ضد:**\n\n• ⚡ **الكهرباء** - فعال جداً\n• 🧊 **الجليد** - فعال جداً\n• 🪨 **الصخر** - فعال جداً\n\n**نصيحة:** الطيران محصن ضد الأرض تماماً!",
      answer_en:
        "🦅 **Flying type is weak against:**\n\n• ⚡ **Electric** - Super effective\n• 🧊 **Ice** - Super effective\n• 🪨 **Rock** - Super effective\n\n**Tip:** Flying is completely immune to Ground!",
      category: "type",
      keywords: ["flying", "طيران", "weakness", "ضعف"],
    },
    {
      id: "psychic-weakness",
      question_ar: "ما هي نقاط ضعف النفسي؟",
      question_en: "What are Psychic type weaknesses?",
      answer_ar:
        "🔮 **نوع النفسي ضعيف ضد:**\n\n• 🦋 **الحشرات** - فعال جداً\n• 👻 **الشبح** - فعال جداً\n• 🌑 **الظلام** - فعال جداً\n\n**نصيحة:** النفسي لا يؤثر على الظلام إطلاقاً!",
      answer_en:
        "🔮 **Psychic type is weak against:**\n\n• 🦋 **Bug** - Super effective\n• 👻 **Ghost** - Super effective\n• 🌑 **Dark** - Super effective\n\n**Tip:** Psychic has no effect on Dark types!",
      category: "type",
      keywords: ["psychic", "نفسي", "weakness", "ضعف"],
    },
    {
      id: "rock-weakness",
      question_ar: "ما هي نقاط ضعف الصخر؟",
      question_en: "What are Rock type weaknesses?",
      answer_ar:
        "🪨 **نوع الصخر ضعيف ضد:**\n\n• 💧 **الماء** - فعال جداً\n• 🌿 **العشب** - فعال جداً\n• ⚔️ **القتال** - فعال جداً\n• 🏔️ **الأرض** - فعال جداً\n• 🔩 **الفولاذ** - فعال جداً\n\n**نصيحة:** الصخر له 5 نقاط ضعف لكن مقاوم للنار والطيران!",
      answer_en:
        "🪨 **Rock type is weak against:**\n\n• 💧 **Water** - Super effective\n• 🌿 **Grass** - Super effective\n• ⚔️ **Fighting** - Super effective\n• 🏔️ **Ground** - Super effective\n• 🔩 **Steel** - Super effective\n\n**Tip:** Rock has 5 weaknesses but resists Fire and Flying!",
      category: "type",
      keywords: ["rock", "صخر", "صخري", "weakness", "ضعف"],
    },
    {
      id: "ghost-weakness",
      question_ar: "ما هي نقاط ضعف الشبح؟",
      question_en: "What are Ghost type weaknesses?",
      answer_ar:
        "👻 **نوع الشبح ضعيف ضد:**\n\n• 👻 **الشبح** - فعال جداً\n• 🌑 **الظلام** - فعال جداً\n\n**نصيحة:** الشبح محصن ضد العادي والقتال تماماً!",
      answer_en:
        "👻 **Ghost type is weak against:**\n\n• 👻 **Ghost** - Super effective\n• 🌑 **Dark** - Super effective\n\n**Tip:** Ghost is completely immune to Normal and Fighting!",
      category: "type",
      keywords: ["ghost", "شبح", "weakness", "ضعف"],
    },
    {
      id: "dragon-weakness",
      question_ar: "ما هي نقاط ضعف التنين؟",
      question_en: "What are Dragon type weaknesses?",
      answer_ar:
        "🐉 **نوع التنين ضعيف ضد:**\n\n• 🧊 **الجليد** - فعال جداً\n• 🐉 **التنين** - فعال جداً\n• 🧚 **الجن** - فعال جداً\n\n**نصيحة:** التنين لا يؤثر على الجن إطلاقاً! استخدم الجن للتغلب عليه!",
      answer_en:
        "🐉 **Dragon type is weak against:**\n\n• 🧊 **Ice** - Super effective\n• 🐉 **Dragon** - Super effective\n• 🧚 **Fairy** - Super effective\n\n**Tip:** Dragon has no effect on Fairy! Use Fairy to counter Dragons!",
      category: "type",
      keywords: ["dragon", "تنين", "weakness", "ضعف"],
    },
    {
      id: "dark-weakness",
      question_ar: "ما هي نقاط ضعف الظلام؟",
      question_en: "What are Dark type weaknesses?",
      answer_ar:
        "🌑 **نوع الظلام ضعيف ضد:**\n\n• ⚔️ **القتال** - فعال جداً\n• 🦋 **الحشرات** - فعال جداً\n• 🧚 **الجن** - فعال جداً\n\n**نصيحة:** الظلام محصن ضد النفسي تماماً!",
      answer_en:
        "🌑 **Dark type is weak against:**\n\n• ⚔️ **Fighting** - Super effective\n• 🦋 **Bug** - Super effective\n• 🧚 **Fairy** - Super effective\n\n**Tip:** Dark is completely immune to Psychic!",
      category: "type",
      keywords: ["dark", "ظلام", "darkness", "weakness", "ضعف"],
    },
    {
      id: "steel-weakness",
      question_ar: "ما هي نقاط ضعف الفولاذ؟",
      question_en: "What are Steel type weaknesses?",
      answer_ar:
        "🔩 **نوع الفولاذ ضعيف ضد:**\n\n• 🔥 **النار** - فعال جداً\n• ⚔️ **القتال** - فعال جداً\n• 🏔️ **الأرض** - فعال جداً\n\n**نصيحة:** الفولاذ محصن ضد السم ومقاوم لـ 10 أنواع!",
      answer_en:
        "🔩 **Steel type is weak against:**\n\n• 🔥 **Fire** - Super effective\n• ⚔️ **Fighting** - Super effective\n• 🏔️ **Ground** - Super effective\n\n**Tip:** Steel is immune to Poison and resists 10 types!",
      category: "type",
      keywords: ["steel", "فولاذ", "حديد", "weakness", "ضعف"],
    },
    {
      id: "fairy-weakness",
      question_ar: "ما هي نقاط ضعف الجن؟",
      question_en: "What are Fairy type weaknesses?",
      answer_ar:
        "🧚 **نوع الجن ضعيف ضد:**\n\n• ☠️ **السم** - فعال جداً\n• 🔩 **الفولاذ** - فعال جداً\n\n**نصيحة:** الجن محصن ضد التنين ومقاوم للقتال والظلام!",
      answer_en:
        "🧚 **Fairy type is weak against:**\n\n• ☠️ **Poison** - Super effective\n• 🔩 **Steel** - Super effective\n\n**Tip:** Fairy is immune to Dragon and resists Fighting and Dark!",
      category: "type",
      keywords: ["fairy", "جن", "جني", "weakness", "ضعف"],
    },
    {
      id: "normal-weakness",
      question_ar: "ما هي نقاط ضعف العادي؟",
      question_en: "What are Normal type weaknesses?",
      answer_ar:
        "⚪ **نوع العادي ضعيف ضد:**\n\n• ⚔️ **القتال** - فعال جداً (الوحيد!)\n\n**نصيحة:** العادي محصن ضد الشبح ولا يؤثر على الشبح أيضاً!",
      answer_en:
        "⚪ **Normal type is weak against:**\n\n• ⚔️ **Fighting** - Super effective (the only one!)\n\n**Tip:** Normal is immune to Ghost and Ghost is immune to Normal!",
      category: "type",
      keywords: ["normal", "عادي", "weakness", "ضعف"],
    },
    {
      id: "bug-weakness",
      question_ar: "ما هي نقاط ضعف الحشرات؟",
      question_en: "What are Bug type weaknesses?",
      answer_ar:
        "🦋 **نوع الحشرات ضعيف ضد:**\n\n• 🔥 **النار** - فعال جداً\n• 🦅 **الطيران** - فعال جداً\n• 🪨 **الصخر** - فعال جداً\n\n**نصيحة:** الحشرات قوية ضد النفسي والظلام والعشب!",
      answer_en:
        "🦋 **Bug type is weak against:**\n\n• 🔥 **Fire** - Super effective\n• 🦅 **Flying** - Super effective\n• 🪨 **Rock** - Super effective\n\n**Tip:** Bug is strong against Psychic, Dark, and Grass!",
      category: "type",
      keywords: ["bug", "حشرات", "حشرة", "weakness", "ضعف"],
    },

    // === COUNTERS ===
    {
      id: "dragon-counter",
      question_ar: "كيف أتغلب على التنين؟",
      question_en: "How to counter Dragon types?",
      answer_ar:
        "🐉 **للتغلب على نوع التنين:**\n\n• 🧊 **الجليد** - فعال جداً (الأفضل)\n• 🐉 **التنين** - فعال جداً\n• 🧚 **الجن** - فعال جداً ومحصن!\n\n**نصيحة:** الجن هو الخيار الأفضل لأنه محصن ضد هجمات التنين تماماً!",
      answer_en:
        "🐉 **To counter Dragon types:**\n\n• 🧊 **Ice** - Super effective (best option)\n• 🐉 **Dragon** - Super effective\n• 🧚 **Fairy** - Super effective and immune!\n\n**Tip:** Fairy is the best choice as it's completely immune to Dragon attacks!",
      category: "type",
      keywords: ["dragon", "تنين", "counter", "تغلب", "أهزم"],
    },
    {
      id: "steel-counter",
      question_ar: "كيف أتغلب على الفولاذ؟",
      question_en: "How to counter Steel types?",
      answer_ar:
        "🔩 **للتغلب على نوع الفولاذ:**\n\n• 🔥 **النار** - الخيار الأفضل\n• ⚔️ **القتال** - فعال جداً\n• 🏔️ **الأرض** - فعال جداً\n\n**بوكيمون مقترحة:** Charizard, Machamp, Garchomp",
      answer_en:
        "🔩 **To counter Steel types:**\n\n• 🔥 **Fire** - Best option\n• ⚔️ **Fighting** - Super effective\n• 🏔️ **Ground** - Super effective\n\n**Suggested Pokémon:** Charizard, Machamp, Garchomp",
      category: "type",
      keywords: ["steel", "فولاذ", "counter", "تغلب", "أهزم"],
    },

    // === TEAM BUILDING ===
    {
      id: "balanced-team",
      question_ar: "اقترح لي فريقاً متوازناً",
      question_en: "Suggest a balanced team",
      answer_ar:
        "🎯 **فريق متوازن مقترح:**\n\n1. 🔥 **نار/طيران** - للهجوم\n2. 💧 **ماء** - للدفاع والتغطية\n3. ⚡ **كهرباء** - سريع وقوي\n4. 🌿 **عشب/سم** - تغطية جيدة\n5. 🏔️ **أرض/صخر** - دفاع قوي\n6. 👻 **شبح/نفسي** - لتنوع الهجمات\n\n**نصيحة:** تأكد من تغطية نقاط الضعف المتبادلة!",
      answer_en:
        "🎯 **Suggested balanced team:**\n\n1. 🔥 **Fire/Flying** - Offensive power\n2. 💧 **Water** - Defense and coverage\n3. ⚡ **Electric** - Fast and strong\n4. 🌿 **Grass/Poison** - Good coverage\n5. 🏔️ **Ground/Rock** - Strong defense\n6. 👻 **Ghost/Psychic** - Attack variety\n\n**Tip:** Make sure to cover each other's weaknesses!",
      category: "team",
      keywords: ["team", "فريق", "balanced", "متوازن", "suggest", "اقترح"],
    },
    {
      id: "best-starters",
      question_ar: "ما هو أفضل بوكيمون بداية؟",
      question_en: "What is the best starter Pokémon?",
      answer_ar:
        "🌟 **أفضل بوكيمون بداية:**\n\n**للمبتدئين:**\n• 💧 **المائي** - أسهل في المعارك الأولى\n\n**للتحدي:**\n• 🌿 **العشبي** - يحتاج استراتيجية\n• 🔥 **الناري** - صعب لكن ممتع\n\n**نصيحة:** اختر الذي يعجبك! كلهم قابلين للفوز!",
      answer_en:
        "🌟 **Best starter Pokémon:**\n\n**For beginners:**\n• 💧 **Water** - Easier for early battles\n\n**For challenge:**\n• 🌿 **Grass** - Needs strategy\n• 🔥 **Fire** - Hard but fun\n\n**Tip:** Choose what you like! All are viable!",
      category: "team",
      keywords: ["starter", "بداية", "best", "أفضل", "choose", "اختار"],
    },
    {
      id: "best-fire",
      question_ar: "أفضل بوكيمون ناري؟",
      question_en: "Best Fire type Pokémon?",
      answer_ar:
        "🔥 **أفضل بوكيمون ناري:**\n\n**للهجوم:**\n• 🔥 Charizard - متعدد الاستخدام\n• 🌋 Arcanine - قوي ومتوازن\n• 🦊 Ninetales - سريع وأنيق\n\n**للقوة:**\n• 🔥 Blaziken - نار/قتال قوي جداً\n• 🐒 Infernape - سريع ومتنوع\n\n**للدفاع:**\n• 🐌 Magcargo - دفاع عالي",
      answer_en:
        "🔥 **Best Fire type Pokémon:**\n\n**For offense:**\n• 🔥 Charizard - Versatile\n• 🌋 Arcanine - Strong and balanced\n• 🦊 Ninetales - Fast and elegant\n\n**For power:**\n• 🔥 Blaziken - Very powerful Fire/Fighting\n• 🐒 Infernape - Fast and diverse\n\n**For defense:**\n• 🐌 Magcargo - High defense",
      category: "team",
      keywords: ["fire", "نار", "ناري", "best", "أفضل", "pokemon", "بوكيمون"],
    },
    {
      id: "best-water",
      question_ar: "أفضل بوكيمون مائي؟",
      question_en: "Best Water type Pokémon?",
      answer_ar:
        "💧 **أفضل بوكيمون مائي:**\n\n**للهجوم:**\n• 🐢 Blastoise - متوازن وقوي\n• 🦆 Gyarados - ماء/طيران قوي جداً\n• 🦈 Sharpedo - سريع ومدمر\n\n**للدفاع:**\n• 🐙 Tentacruel - دفاع خاص عالي\n• 🐚 Cloyster - دفاع فيزيائي ممتاز\n\n**متعدد الاستخدام:**\n• ⭐ Starmie - سريع ومتنوع الحركات",
      answer_en:
        "💧 **Best Water type Pokémon:**\n\n**For offense:**\n• 🐢 Blastoise - Balanced and strong\n• 🦆 Gyarados - Very powerful Water/Flying\n• 🦈 Sharpedo - Fast and devastating\n\n**For defense:**\n• 🐙 Tentacruel - High special defense\n• 🐚 Cloyster - Excellent physical defense\n\n**Versatile:**\n• ⭐ Starmie - Fast with diverse moves",
      category: "team",
      keywords: ["water", "ماء", "مائي", "best", "أفضل", "pokemon", "بوكيمون"],
    },
    {
      id: "best-electric",
      question_ar: "أفضل بوكيمون كهربائي؟",
      question_en: "Best Electric type Pokémon?",
      answer_ar:
        "⚡ **أفضل بوكيمون كهربائي:**\n\n**للسرعة:**\n• ⚡ Jolteon - أسرع كهربائي\n• 🐭 Pikachu/Raichu - كلاسيكي\n\n**للقوة:**\n• ⚡ Electivire - قوة هائلة\n• 🦓 Zebstrika - سريع وقوي\n\n**للتغطية:**\n• 🧲 Magnezone - كهرباء/فولاذ",
      answer_en:
        "⚡ **Best Electric type Pokémon:**\n\n**For speed:**\n• ⚡ Jolteon - Fastest Electric\n• 🐭 Pikachu/Raichu - Classic\n\n**For power:**\n• ⚡ Electivire - Massive power\n• 🦓 Zebstrika - Fast and strong\n\n**For coverage:**\n• 🧲 Magnezone - Electric/Steel",
      category: "team",
      keywords: ["electric", "كهرباء", "كهربائي", "best", "أفضل", "pokemon", "بوكيمون"],
    },

    // === GYM STRATEGIES ===
    {
      id: "electric-gym",
      question_ar: "كيف أهزم صالة الكهرباء؟",
      question_en: "How to beat Electric gym?",
      answer_ar:
        '⚡ **استراتيجية صالة الكهرباء:**\n\n**الأنواع المطلوبة:**\n• 🏔️ **الأرض** - الخيار الأفضل (محصن!)\n\n**نصائح:**\n• استخدم بوكيمون أرضي كهجوم رئيسي\n• تجنب الماء والطيران تماماً\n• حركات مثل "زلزال" و"حفر" فعالة جداً\n\n**بوكيمون مقترحة:** Sandslash, Dugtrio, Golem',
      answer_en:
        "⚡ **Electric gym strategy:**\n\n**Types needed:**\n• 🏔️ **Ground** - Best choice (immune!)\n\n**Tips:**\n• Use Ground type as your main attacker\n• Completely avoid Water and Flying\n• Moves like Earthquake and Dig are very effective\n\n**Suggested Pokémon:** Sandslash, Dugtrio, Golem",
      category: "gym",
      keywords: ["electric", "كهرباء", "gym", "صالة", "beat", "أهزم"],
    },
    {
      id: "water-gym",
      question_ar: "كيف أهزم صالة الماء؟",
      question_en: "How to beat Water gym?",
      answer_ar:
        '💧 **استراتيجية صالة الماء:**\n\n**الأنواع المطلوبة:**\n• ⚡ **الكهرباء** - فعال جداً\n• 🌿 **العشب** - فعال جداً\n\n**نصائح:**\n• الكهرباء أسرع لكن العشب أقوى\n• تجنب النار والأرض والصخر\n• حركات مثل "Thunderbolt" و"Energy Ball" ممتازة\n\n**بوكيمون مقترحة:** Pikachu, Venusaur, Jolteon',
      answer_en:
        "💧 **Water gym strategy:**\n\n**Types needed:**\n• ⚡ **Electric** - Super effective\n• 🌿 **Grass** - Super effective\n\n**Tips:**\n• Electric is faster but Grass is stronger\n• Avoid Fire, Ground, and Rock\n• Moves like Thunderbolt and Energy Ball are excellent\n\n**Suggested Pokémon:** Pikachu, Venusaur, Jolteon",
      category: "gym",
      keywords: ["water", "ماء", "gym", "صالة", "beat", "أهزم"],
    },
    {
      id: "fire-gym",
      question_ar: "كيف أهزم صالة النار؟",
      question_en: "How to beat Fire gym?",
      answer_ar:
        '🔥 **استراتيجية صالة النار:**\n\n**الأنواع المطلوبة:**\n• 💧 **الماء** - الخيار الأفضل\n• 🏔️ **الأرض** - فعال جداً\n• 🪨 **الصخر** - فعال جداً\n\n**نصائح:**\n• الماء هو الخيار الأسلم\n• تجنب العشب والحشرات والجليد\n• حركات مثل "Surf" و"Earthquake" ممتازة\n\n**بوكيمون مقترحة:** Blastoise, Golem, Gyarados',
      answer_en:
        "🔥 **Fire gym strategy:**\n\n**Types needed:**\n• 💧 **Water** - Best choice\n• 🏔️ **Ground** - Super effective\n• 🪨 **Rock** - Super effective\n\n**Tips:**\n• Water is the safest choice\n• Avoid Grass, Bug, and Ice\n• Moves like Surf and Earthquake are excellent\n\n**Suggested Pokémon:** Blastoise, Golem, Gyarados",
      category: "gym",
      keywords: ["fire", "نار", "gym", "صالة", "beat", "أهزم"],
    },
    {
      id: "grass-gym",
      question_ar: "كيف أهزم صالة العشب؟",
      question_en: "How to beat Grass gym?",
      answer_ar:
        '🌿 **استراتيجية صالة العشب:**\n\n**الأنواع المطلوبة:**\n• 🔥 **النار** - الخيار الأفضل\n• 🦅 **الطيران** - فعال جداً\n• 🧊 **الجليد** - فعال جداً\n• ☠️ **السم** - فعال جداً\n\n**نصائح:**\n• النار تدمر العشب بسهولة\n• تجنب الماء والأرض\n• حركات مثل "Flamethrower" ممتازة\n\n**بوكيمون مقترحة:** Charizard, Arcanine, Pidgeot',
      answer_en:
        "🌿 **Grass gym strategy:**\n\n**Types needed:**\n• 🔥 **Fire** - Best choice\n• 🦅 **Flying** - Super effective\n• 🧊 **Ice** - Super effective\n• ☠️ **Poison** - Super effective\n\n**Tips:**\n• Fire destroys Grass easily\n• Avoid Water and Ground\n• Moves like Flamethrower are excellent\n\n**Suggested Pokémon:** Charizard, Arcanine, Pidgeot",
      category: "gym",
      keywords: ["grass", "عشب", "gym", "صالة", "beat", "أهزم"],
    },
    {
      id: "rock-gym",
      question_ar: "كيف أهزم صالة الصخر؟",
      question_en: "How to beat Rock gym?",
      answer_ar:
        "🪨 **استراتيجية صالة الصخر:**\n\n**الأنواع المطلوبة:**\n• 💧 **الماء** - فعال جداً\n• 🌿 **العشب** - فعال جداً\n• ⚔️ **القتال** - فعال جداً\n• 🏔️ **الأرض** - فعال جداً\n\n**نصائح:**\n• الماء والعشب هما الأفضل\n• القتال ممتاز أيضاً\n• تجنب النار والطيران\n\n**بوكيمون مقترحة:** Blastoise, Venusaur, Machamp",
      answer_en:
        "🪨 **Rock gym strategy:**\n\n**Types needed:**\n• 💧 **Water** - Super effective\n• 🌿 **Grass** - Super effective\n• ⚔️ **Fighting** - Super effective\n• 🏔️ **Ground** - Super effective\n\n**Tips:**\n• Water and Grass are best\n• Fighting is excellent too\n• Avoid Fire and Flying\n\n**Suggested Pokémon:** Blastoise, Venusaur, Machamp",
      category: "gym",
      keywords: ["rock", "صخر", "gym", "صالة", "beat", "أهزم"],
    },
    {
      id: "psychic-gym",
      question_ar: "كيف أهزم صالة النفسي؟",
      question_en: "How to beat Psychic gym?",
      answer_ar:
        '🔮 **استراتيجية صالة النفسي:**\n\n**الأنواع المطلوبة:**\n• 🌑 **الظلام** - الخيار الأفضل (محصن!)\n• 👻 **الشبح** - فعال جداً\n• 🦋 **الحشرات** - فعال جداً\n\n**نصائح:**\n• الظلام محصن ضد النفسي تماماً\n• تجنب القتال والسم\n• حركات مثل "Dark Pulse" و"Shadow Ball" ممتازة\n\n**بوكيمون مقترحة:** Umbreon, Gengar, Scizor',
      answer_en:
        "🔮 **Psychic gym strategy:**\n\n**Types needed:**\n• 🌑 **Dark** - Best choice (immune!)\n• 👻 **Ghost** - Super effective\n• 🦋 **Bug** - Super effective\n\n**Tips:**\n• Dark is completely immune to Psychic\n• Avoid Fighting and Poison\n• Moves like Dark Pulse and Shadow Ball are excellent\n\n**Suggested Pokémon:** Umbreon, Gengar, Scizor",
      category: "gym",
      keywords: ["psychic", "نفسي", "gym", "صالة", "beat", "أهزم"],
    },

    // === MOVES ===
    {
      id: "grass-moves",
      question_ar: "ما الحركات الأفضل لبوكيمون عشبي؟",
      question_en: "Best moves for Grass types?",
      answer_ar:
        "🌿 **أفضل حركات العشب:**\n\n**هجومية:**\n• 🌸 **Petal Dance** - قوة 120\n• 🌿 **Leaf Storm** - قوة 130\n• ☀️ **Solar Beam** - قوة 120\n• 🌱 **Energy Ball** - قوة 90\n\n**دعم:**\n• 😴 **Sleep Powder** - لتنويم الخصم\n• 🌿 **Leech Seed** - لاستنزاف HP\n\n**نصيحة:** Energy Ball هي الأكثر موثوقية!",
      answer_en:
        "🌿 **Best Grass type moves:**\n\n**Offensive:**\n• 🌸 **Petal Dance** - 120 power\n• 🌿 **Leaf Storm** - 130 power\n• ☀️ **Solar Beam** - 120 power\n• 🌱 **Energy Ball** - 90 power\n\n**Support:**\n• 😴 **Sleep Powder** - Put enemy to sleep\n• 🌿 **Leech Seed** - Drain HP\n\n**Tip:** Energy Ball is the most reliable!",
      category: "moves",
      keywords: ["grass", "عشب", "moves", "حركات", "best", "أفضل"],
    },
    {
      id: "fire-moves",
      question_ar: "ما الحركات الأفضل لبوكيمون ناري؟",
      question_en: "Best moves for Fire types?",
      answer_ar:
        "🔥 **أفضل حركات النار:**\n\n**هجومية:**\n• 🔥 **Fire Blast** - قوة 110\n• 🔥 **Flamethrower** - قوة 90 (موثوق)\n• ☀️ **Overheat** - قوة 130\n• 🔥 **Blaze Kick** - قوة 85\n\n**دعم:**\n• ☀️ **Sunny Day** - لتقوية النار\n• 🛡️ **Will-O-Wisp** - لحرق الخصم\n\n**نصيحة:** Flamethrower هي الأفضل للموثوقية!",
      answer_en:
        "🔥 **Best Fire type moves:**\n\n**Offensive:**\n• 🔥 **Fire Blast** - 110 power\n• 🔥 **Flamethrower** - 90 power (reliable)\n• ☀️ **Overheat** - 130 power\n• 🔥 **Blaze Kick** - 85 power\n\n**Support:**\n• ☀️ **Sunny Day** - Boost Fire\n• 🛡️ **Will-O-Wisp** - Burn enemy\n\n**Tip:** Flamethrower is best for reliability!",
      category: "moves",
      keywords: ["fire", "نار", "moves", "حركات", "best", "أفضل"],
    },
    {
      id: "water-moves",
      question_ar: "ما الحركات الأفضل لبوكيمون مائي؟",
      question_en: "Best moves for Water types?",
      answer_ar:
        "💧 **أفضل حركات الماء:**\n\n**هجومية:**\n• 💧 **Hydro Pump** - قوة 110\n• 🌊 **Surf** - قوة 90 (موثوق)\n• 💦 **Scald** - قوة 80 + حرق\n• 💧 **Waterfall** - قوة 80 (فيزيائي)\n\n**دعم:**\n• 🌧️ **Rain Dance** - لتقوية الماء\n• 🐚 **Aqua Ring** - للشفاء\n\n**نصيحة:** Scald ممتاز لأنه يحرق الخصم!",
      answer_en:
        "💧 **Best Water type moves:**\n\n**Offensive:**\n• 💧 **Hydro Pump** - 110 power\n• 🌊 **Surf** - 90 power (reliable)\n• 💦 **Scald** - 80 power + burn\n• 💧 **Waterfall** - 80 power (physical)\n\n**Support:**\n• 🌧️ **Rain Dance** - Boost Water\n• 🐚 **Aqua Ring** - Healing\n\n**Tip:** Scald is excellent as it can burn!",
      category: "moves",
      keywords: ["water", "ماء", "moves", "حركات", "best", "أفضل"],
    },
    {
      id: "electric-moves",
      question_ar: "ما الحركات الأفضل لبوكيمون كهربائي؟",
      question_en: "Best moves for Electric types?",
      answer_ar:
        "⚡ **أفضل حركات الكهرباء:**\n\n**هجومية:**\n• ⚡ **Thunder** - قوة 110\n• ⚡ **Thunderbolt** - قوة 90 (موثوق)\n• ⚡ **Volt Tackle** - قوة 120 (فيزيائي)\n• ⚡ **Discharge** - قوة 80\n\n**دعم:**\n• ⚡ **Thunder Wave** - لشل الخصم\n• 🔋 **Charge** - لتقوية الهجوم القادم\n\n**نصيحة:** Thunderbolt هي الأفضل للموثوقية!",
      answer_en:
        "⚡ **Best Electric type moves:**\n\n**Offensive:**\n• ⚡ **Thunder** - 110 power\n• ⚡ **Thunderbolt** - 90 power (reliable)\n• ⚡ **Volt Tackle** - 120 power (physical)\n• ⚡ **Discharge** - 80 power\n\n**Support:**\n• ⚡ **Thunder Wave** - Paralyze enemy\n• 🔋 **Charge** - Boost next attack\n\n**Tip:** Thunderbolt is best for reliability!",
      category: "moves",
      keywords: ["electric", "كهرباء", "moves", "حركات", "best", "أفضل"],
    },

    // === GENERAL ===
    {
      id: "type-chart",
      question_ar: "شرح جدول الأنواع",
      question_en: "Explain the type chart",
      answer_ar:
        "📊 **جدول الأنواع المختصر:**\n\n🔥 النار → قوي ضد: عشب، جليد، حشرات، فولاذ\n💧 الماء → قوي ضد: نار، أرض، صخر\n🌿 العشب → قوي ضد: ماء، أرض، صخر\n⚡ الكهرباء → قوي ضد: ماء، طيران\n🏔️ الأرض → قوي ضد: نار، كهرباء، سم، صخر، فولاذ\n\n**نصيحة:** احفظ المثلث الأساسي: نار > عشب > ماء > نار",
      answer_en:
        "📊 **Type chart summary:**\n\n🔥 Fire → Strong vs: Grass, Ice, Bug, Steel\n💧 Water → Strong vs: Fire, Ground, Rock\n🌿 Grass → Strong vs: Water, Ground, Rock\n⚡ Electric → Strong vs: Water, Flying\n🏔️ Ground → Strong vs: Fire, Electric, Poison, Rock, Steel\n\n**Tip:** Remember the basic triangle: Fire > Grass > Water > Fire",
      category: "type",
      keywords: ["type", "نوع", "chart", "جدول", "effective", "فعال"],
    },
    {
      id: "ev-training",
      question_ar: "ما هي EVs وكيف أدربها؟",
      question_en: "What are EVs and how to train them?",
      answer_ar:
        "📈 **قيم الجهد (EVs):**\n\n**ما هي:**\n• نقاط خفية تزيد إحصائيات البوكيمون\n• الحد الأقصى 510 نقطة إجمالية\n• الحد الأقصى 252 لكل إحصائية\n\n**كيف تحصل عليها:**\n• هزيمة بوكيمون معين تعطي EVs معينة\n• الماء يعطي HP\n• الطيران يعطي سرعة\n\n**نصيحة:** ركز على إحصائيتين رئيسيتين!",
      answer_en:
        "📈 **Effort Values (EVs):**\n\n**What they are:**\n• Hidden points that boost stats\n• Max 510 total points\n• Max 252 per stat\n\n**How to get them:**\n• Defeating certain Pokémon gives specific EVs\n• Water types give HP EVs\n• Flying types give Speed EVs\n\n**Tip:** Focus on two main stats!",
      category: "strategy",
      keywords: ["ev", "evs", "training", "تدريب", "جهد"],
    },
    {
      id: "nature",
      question_ar: "ما هي طبائع البوكيمون؟",
      question_en: "What are Pokémon natures?",
      answer_ar:
        "🎭 **طبائع البوكيمون:**\n\n**ما هي:**\n• كل بوكيمون له طبيعة تؤثر على إحصائياته\n• تزيد إحصائية 10% وتنقص أخرى 10%\n\n**طبائع مهمة:**\n• **Adamant** - +هجوم، -هجوم خاص\n• **Jolly** - +سرعة، -هجوم خاص\n• **Modest** - +هجوم خاص، -هجوم\n• **Timid** - +سرعة، -هجوم\n\n**نصيحة:** اختر الطبيعة حسب دور البوكيمون!",
      answer_en:
        "🎭 **Pokémon Natures:**\n\n**What they are:**\n• Each Pokémon has a nature affecting stats\n• Increases one stat by 10%, decreases another by 10%\n\n**Important natures:**\n• **Adamant** - +Attack, -Sp.Atk\n• **Jolly** - +Speed, -Sp.Atk\n• **Modest** - +Sp.Atk, -Attack\n• **Timid** - +Speed, -Attack\n\n**Tip:** Choose nature based on Pokémon's role!",
      category: "strategy",
      keywords: ["nature", "طبيعة", "طبائع", "stats", "إحصائيات"],
    },
    {
      id: "abilities",
      question_ar: "ما هي قدرات البوكيمون؟",
      question_en: "What are Pokémon abilities?",
      answer_ar:
        "✨ **قدرات البوكيمون:**\n\n**ما هي:**\n• كل بوكيمون له قدرة خاصة\n• تعطي مزايا في المعركة\n\n**قدرات مشهورة:**\n• **Intimidate** - ينقص هجوم الخصم\n• **Levitate** - محصن ضد الأرض\n• **Drought** - يبدأ المعركة بالشمس\n• **Swift Swim** - سرعة مضاعفة في المطر\n\n**نصيحة:** القدرة مهمة جداً في بناء الفريق!",
      answer_en:
        "✨ **Pokémon Abilities:**\n\n**What they are:**\n• Each Pokémon has a special ability\n• Provides battle advantages\n\n**Famous abilities:**\n• **Intimidate** - Lowers opponent's Attack\n• **Levitate** - Immune to Ground\n• **Drought** - Starts battle with Sun\n• **Swift Swim** - Double Speed in Rain\n\n**Tip:** Abilities are crucial for team building!",
      category: "strategy",
      keywords: ["ability", "قدرة", "قدرات", "abilities"],
    },
    {
      id: "held-items",
      question_ar: "ما هي أفضل العناصر المحمولة؟",
      question_en: "What are the best held items?",
      answer_ar:
        "🎒 **أفضل العناصر المحمولة:**\n\n**للهجوم:**\n• 🗡️ **Choice Band** - +50% هجوم (حركة واحدة)\n• 📿 **Life Orb** - +30% ضرر (يستنزف HP)\n• 🔮 **Choice Specs** - +50% هجوم خاص\n\n**للدفاع:**\n• 🍇 **Leftovers** - شفاء كل دور\n• 🛡️ **Assault Vest** - +50% دفاع خاص\n\n**للسرعة:**\n• 🧣 **Choice Scarf** - +50% سرعة",
      answer_en:
        "🎒 **Best Held Items:**\n\n**For offense:**\n• 🗡️ **Choice Band** - +50% Attack (one move)\n• 📿 **Life Orb** - +30% damage (drains HP)\n• 🔮 **Choice Specs** - +50% Sp.Atk\n\n**For defense:**\n• 🍇 **Leftovers** - Heal each turn\n• 🛡️ **Assault Vest** - +50% Sp.Def\n\n**For speed:**\n• 🧣 **Choice Scarf** - +50% Speed",
      category: "strategy",
      keywords: ["item", "items", "عنصر", "عناصر", "held", "محمول"],
    },
    {
      id: "legendary",
      question_ar: "ما هي البوكيمون الأسطورية؟",
      question_en: "What are Legendary Pokémon?",
      answer_ar:
        "🌟 **البوكيمون الأسطورية:**\n\n**ما هي:**\n• بوكيمون نادرة وقوية جداً\n• واحد فقط من كل نوع في اللعبة\n• إحصائيات عالية جداً\n\n**أمثلة مشهورة:**\n• 🐲 Mewtwo - نفسي قوي جداً\n• 🔥 Ho-Oh - نار/طيران أسطوري\n• 💧 Lugia - نفسي/طيران أسطوري\n• 🌙 Rayquaza - تنين/طيران أسطوري\n\n**نصيحة:** احفظ كرة الماستر للأسطوريين!",
      answer_en:
        "🌟 **Legendary Pokémon:**\n\n**What they are:**\n• Rare and very powerful Pokémon\n• Only one of each in the game\n• Very high stats\n\n**Famous examples:**\n• 🐲 Mewtwo - Very powerful Psychic\n• 🔥 Ho-Oh - Legendary Fire/Flying\n• 💧 Lugia - Legendary Psychic/Flying\n• 🌙 Rayquaza - Legendary Dragon/Flying\n\n**Tip:** Save Master Ball for Legendaries!",
      category: "general",
      keywords: ["legendary", "أسطوري", "أسطورية", "mewtwo", "lugia"],
    },
  ];
}
