export type Lang = "ar" | "en";

type Dict = {
  appName: string;
  tagline: string;
  nav: { pokedex: string; items: string; types: string; about: string };
  search: { placeholder: string; noResults: string };
  filters: { type: string; generation: string; all: string; reset: string };
  pokemon: {
    number: string;
    height: string;
    weight: string;
    types: string;
    abilities: string;
    stats: string;
    description: string;
    evolution: string;
    effectiveness: string;
    noEvolution: string;
    meters: string;
    kilograms: string;
  };
  stats: {
    hp: string;
    attack: string;
    defense: string;
    "special-attack": string;
    "special-defense": string;
    speed: string;
    total: string;
  };
  effectiveness: { weakTo: string; resistantTo: string; immuneTo: string; normal: string };
  typeChart: { title: string; subtitle: string; attacker: string; defender: string };
  loading: string;
  error: string;
  retry: string;
  offline: string;
  sync: { title: string; desc: string; start: string; progress: string; of: string; done: string };
  about: { title: string; body: string; data: string; built: string };
  backHome: string;
};

export const translations: Record<Lang, Dict> = {
  ar: {
    appName: "موسوعة البوكيمون",
    tagline: "دليلك الكامل لعالم البوكيمون",
    nav: {
      pokedex: "البوكيدكس",
      items: "الأدوات",
      types: "الأنواع",
      about: "حول",
    },
    search: {
      placeholder: "ابحث بالاسم أو الرقم...",
      noResults: "لا توجد نتائج",
    },
    filters: {
      type: "النوع",
      generation: "الجيل",
      all: "الكل",
      reset: "مسح الفلاتر",
    },
    pokemon: {
      number: "رقم",
      height: "الطول",
      weight: "الوزن",
      types: "الأنواع",
      abilities: "القدرات",
      stats: "الإحصائيات",
      description: "الوصف",
      evolution: "سلسلة التطور",
      effectiveness: "فعالية الأنواع ضده",
      noEvolution: "هذا البوكيمون لا يتطور",
      meters: "م",
      kilograms: "كغ",
    },
    stats: {
      hp: "نقاط الحياة",
      attack: "الهجوم",
      defense: "الدفاع",
      "special-attack": "هجوم خاص",
      "special-defense": "دفاع خاص",
      speed: "السرعة",
      total: "المجموع",
    },
    effectiveness: {
      weakTo: "ضعيف ضد",
      resistantTo: "مقاوم لـ",
      immuneTo: "محصّن ضد",
      normal: "عادي",
    },
    typeChart: {
      title: "جدول فعالية الأنواع",
      subtitle: "اختر نوعاً مهاجماً لرؤية فعاليته ضد كل نوع",
      attacker: "المهاجم",
      defender: "المدافع",
    },
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    retry: "إعادة المحاولة",
    offline: "أنت غير متصل بالإنترنت — البيانات من الكاش",
    sync: {
      title: "تجهيز قاعدة البيانات",
      desc: "نقوم بمزامنة بيانات البوكيمون من PokéAPI لأول مرة. قد يستغرق هذا دقيقة أو اثنتين.",
      start: "بدء المزامنة",
      progress: "تمت مزامنة",
      of: "من",
      done: "اكتملت المزامنة!",
    },
    about: {
      title: "حول التطبيق",
      body: "تطبيق مرجعي شامل لجميع البوكيمون من الجيل الأول حتى الثالث (1–386). يدعم العربية والإنجليزية مع وضع RTL، ويعمل بدون إنترنت بفضل التخزين المحلي.",
      data: "البيانات مأخوذة من PokéAPI",
      built: "مبني بـ Lovable",
    },
    backHome: "العودة للرئيسية",
  },
  en: {
    appName: "Pokémon Guide",
    tagline: "Your complete guide to the world of Pokémon",
    nav: {
      pokedex: "Pokédex",
      items: "Items",
      types: "Types",
      about: "About",
    },
    search: {
      placeholder: "Search by name or number...",
      noResults: "No results found",
    },
    filters: {
      type: "Type",
      generation: "Generation",
      all: "All",
      reset: "Clear filters",
    },
    pokemon: {
      number: "No.",
      height: "Height",
      weight: "Weight",
      types: "Types",
      abilities: "Abilities",
      stats: "Stats",
      description: "Description",
      evolution: "Evolution Chain",
      effectiveness: "Type Effectiveness",
      noEvolution: "This Pokémon does not evolve",
      meters: "m",
      kilograms: "kg",
    },
    stats: {
      hp: "HP",
      attack: "Attack",
      defense: "Defense",
      "special-attack": "Sp. Atk",
      "special-defense": "Sp. Def",
      speed: "Speed",
      total: "Total",
    },
    effectiveness: {
      weakTo: "Weak to",
      resistantTo: "Resistant to",
      immuneTo: "Immune to",
      normal: "Normal damage",
    },
    typeChart: {
      title: "Type Effectiveness Chart",
      subtitle: "Choose an attacking type to see its effectiveness against every type",
      attacker: "Attacker",
      defender: "Defender",
    },
    loading: "Loading...",
    error: "An error occurred",
    retry: "Retry",
    offline: "You are offline — showing cached data",
    sync: {
      title: "Setting up the database",
      desc: "Syncing Pokémon data from PokéAPI for the first time. This may take a minute or two.",
      start: "Start sync",
      progress: "Synced",
      of: "of",
      done: "Sync complete!",
    },
    about: {
      title: "About",
      body: "A complete reference app for all Pokémon from generation 1 to 3 (1–386). Supports Arabic and English with full RTL, and works offline thanks to local caching.",
      data: "Data from PokéAPI",
      built: "Built with Lovable",
    },
    backHome: "Back to home",
  },
};

export const typeNames: Record<string, { ar: string; en: string }> = {
  normal: { ar: "عادي", en: "Normal" },
  fire: { ar: "نار", en: "Fire" },
  water: { ar: "ماء", en: "Water" },
  electric: { ar: "كهرباء", en: "Electric" },
  grass: { ar: "نبات", en: "Grass" },
  ice: { ar: "جليد", en: "Ice" },
  fighting: { ar: "قتال", en: "Fighting" },
  poison: { ar: "سم", en: "Poison" },
  ground: { ar: "أرض", en: "Ground" },
  flying: { ar: "طيران", en: "Flying" },
  psychic: { ar: "نفسي", en: "Psychic" },
  bug: { ar: "حشرة", en: "Bug" },
  rock: { ar: "صخر", en: "Rock" },
  ghost: { ar: "شبح", en: "Ghost" },
  dragon: { ar: "تنين", en: "Dragon" },
  dark: { ar: "ظلام", en: "Dark" },
  steel: { ar: "فولاذ", en: "Steel" },
  fairy: { ar: "جنية", en: "Fairy" },
};
