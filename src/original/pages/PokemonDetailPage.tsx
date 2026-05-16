import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { Pokemon, Encounter, Location, PokemonHeldItem, Item } from "@/original/types/pokemon";
import { Layout } from "@/original/components/layout/Layout";
import { CollapsibleSection } from "@/original/components/layout/CollapsibleSection";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { EmptyState } from "@/original/components/ui/empty-state";
import { Button } from "@/original/components/ui/button";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Textarea } from "@/original/components/ui/textarea";
import { NotAvailableBanner } from "@/original/components/NotAvailableBanner";
import { EvolutionChain } from "@/original/components/pokemon/EvolutionChain";
import { MovesTabs } from "@/original/components/pokemon/MovesTabs";
import { AbilitiesSection } from "@/original/components/pokemon/AbilitiesSection";
import {
  TypeEffectivenessSection,
  calculateDefensiveMatchups,
} from "@/original/components/pokemon/TypeEffectivenessSection";
import { QuickInsightCard } from "@/original/components/pokemon/QuickInsightCard";
import { QuickStatsSummary } from "@/original/components/pokemon/QuickStatsSummary";
import { NextStepsSection } from "@/original/components/pokemon/NextStepsSection";
import { CryPlayer } from "@/original/components/pokemon/CryPlayer";
import { AnimatedPokemonSprite } from "@/original/components/pokemon/AnimatedPokemonSprite";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Swords,
  Shield,
  Zap,
  Heart,
  Brain,
  Wind,
  Sparkles,
  Eye,
  Star,
  Map,
  TreePine,
  Mountain,
  Building,
  Waves,
  Package,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { playPokemonCry } from "@/original/lib/audioCache";
import { cn } from "@/original/lib/utils";
import { getPokemonArtwork } from "@/original/services/pokeApiService";
import { pokemonNamesArabic, abilityNamesArabic } from "@/original/data/arabicTranslations";
import { getStatLabel, getPokemonSummary } from "@/original/lib/pokemonAnalysis";
import { QuickSummary } from "@/original/components/layout/QuickSummary";
import { PokemonFunFacts } from "@/original/components/pokemon/PokemonFunFacts";
import { TrainingGuide } from "@/original/components/pokemon/TrainingGuide";
import {
  toggleFavoritePokemon,
  isPokemonFavorite,
  markPokemonViewed,
  getPokemonNote,
  savePokemonNote,
} from "@/original/lib/pokemonUtils";

// Get Pokemon name with fallback to local translations
const getPokemonName = (pokemon: Pokemon, language: string): string => {
  if (language === "ar") {
    if (pokemon.name_ar && pokemon.name_ar !== pokemon.name_en) {
      return pokemon.name_ar;
    }
    return pokemonNamesArabic[pokemon.id] || "الاسم قيد الإضافة";
  }
  return pokemon.name_en;
};

// Get ability name with fallback
const getAbilityName = (abilityKey: string, language: string): string => {
  // Convert ability key to Title Case format to match abilityNamesArabic keys
  const titleCaseName = abilityKey
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  if (language === "ar") {
    return abilityNamesArabic[titleCaseName] || titleCaseName;
  }
  return titleCaseName;
};

// Ability descriptions in Arabic/English
const abilityDescriptions: Record<string, { en: string; ar: string }> = {
  // Generation 1-3 Abilities
  overgrow: {
    en: "Powers up Grass-type moves when HP is low.",
    ar: "يعزز حركات العشب عندما تكون الصحة منخفضة.",
  },
  chlorophyll: { en: "Boosts Speed in sunny weather.", ar: "يزيد السرعة في الطقس المشمس." },
  blaze: {
    en: "Powers up Fire-type moves when HP is low.",
    ar: "يعزز حركات النار عندما تكون الصحة منخفضة.",
  },
  "solar-power": {
    en: "In sunshine, Sp. Atk is boosted but HP decreases.",
    ar: "في الشمس، يزيد الهجوم الخاص لكن تنخفض الصحة.",
  },
  torrent: {
    en: "Powers up Water-type moves when HP is low.",
    ar: "يعزز حركات الماء عندما تكون الصحة منخفضة.",
  },
  "rain-dish": { en: "Restores HP in rain.", ar: "يستعيد الصحة في المطر." },
  "shield-dust": {
    en: "Blocks additional effects of attacks.",
    ar: "يمنع التأثيرات الإضافية للهجمات.",
  },
  "run-away": {
    en: "Enables a sure getaway from wild Pokémon.",
    ar: "يمكّن من الهروب المضمون من البوكيمون البري.",
  },
  "compound-eyes": { en: "Boosts the Pokémon's accuracy.", ar: "يزيد دقة البوكيمون." },
  "tinted-lens": { en: "Powers up not very effective moves.", ar: "يعزز الحركات غير الفعالة." },
  swarm: {
    en: "Powers up Bug-type moves when HP is low.",
    ar: "يعزز حركات الحشرات عندما تكون الصحة منخفضة.",
  },
  sniper: { en: "Powers up critical hits.", ar: "يعزز الضربات الحاسمة." },
  "keen-eye": { en: "Prevents accuracy loss.", ar: "يمنع فقدان الدقة." },
  "tangled-feet": { en: "Raises evasion when confused.", ar: "يزيد التفادي عند الارتباك." },
  "big-pecks": { en: "Protects against Defense lowering.", ar: "يحمي من خفض الدفاع." },
  guts: { en: "Boosts Attack when afflicted by status.", ar: "يزيد الهجوم عند الإصابة بحالة." },
  hustle: { en: "Boosts Attack but lowers accuracy.", ar: "يزيد الهجوم لكن يخفض الدقة." },
  intimidate: { en: "Lowers opposing Pokémon's Attack.", ar: "يخفض هجوم البوكيمون المعادي." },
  "shed-skin": { en: "May heal own status conditions.", ar: "قد يشفي حالاته الخاصة." },
  "arena-trap": {
    en: "Prevents opposing Pokémon from fleeing.",
    ar: "يمنع البوكيمون المعادي من الهروب.",
  },
  "sand-veil": { en: "Boosts evasion in sandstorm.", ar: "يزيد التفادي في العاصفة الرملية." },
  "sand-force": {
    en: "Boosts certain moves in sandstorm.",
    ar: "يعزز حركات معينة في العاصفة الرملية.",
  },
  static: { en: "May paralyze on contact.", ar: "قد يشل عند الاتصال." },
  "lightning-rod": {
    en: "Draws in Electric moves to boost Sp. Atk.",
    ar: "يجذب حركات الكهرباء لزيادة الهجوم الخاص.",
  },
  pickup: { en: "May pick up items.", ar: "قد يلتقط أغراضاً." },
  technician: { en: "Powers up weaker moves.", ar: "يعزز الحركات الضعيفة." },
  unnerve: { en: "Makes opposing Pokémon nervous.", ar: "يجعل البوكيمون المعادي متوتراً." },
  limber: { en: "Protects against paralysis.", ar: "يحمي من الشلل." },
  damp: { en: "Prevents explosion moves.", ar: "يمنع حركات الانفجار." },
  "cloud-nine": { en: "Negates weather effects.", ar: "يلغي تأثيرات الطقس." },
  "swift-swim": { en: "Boosts Speed in rain.", ar: "يزيد السرعة في المطر." },
  "vital-spirit": { en: "Prevents sleep.", ar: "يمنع النوم." },
  "anger-point": {
    en: "Maxes Attack after a critical hit.",
    ar: "يرفع الهجوم للحد الأقصى بعد ضربة حاسمة.",
  },
  defiant: { en: "Boosts Attack when stats are lowered.", ar: "يزيد الهجوم عند خفض الإحصائيات." },
  "flash-fire": {
    en: "Boosts Fire moves when hit by Fire.",
    ar: "يعزز حركات النار عند التعرض للنار.",
  },
  justified: {
    en: "Boosts Attack when hit by Dark moves.",
    ar: "يزيد الهجوم عند التعرض لحركات الظلام.",
  },
  "inner-focus": { en: "Prevents flinching.", ar: "يمنع الارتعاش." },
  synchronize: { en: "Passes on status conditions.", ar: "ينقل حالات الوضع." },
  trace: { en: "Copies opposing Ability.", ar: "ينسخ قدرة الخصم." },
  "magic-guard": { en: "Only takes damage from attacks.", ar: "يتلقى الضرر من الهجمات فقط." },
  "no-guard": { en: "All moves hit both sides.", ar: "كل الحركات تصيب كلا الطرفين." },
  steadfast: { en: "Boosts Speed when flinching.", ar: "يزيد السرعة عند الارتعاش." },
  gluttony: { en: "Eats held Berries early.", ar: "يأكل التوت المحمول مبكراً." },
  "poison-point": { en: "May poison on contact.", ar: "قد يسمم عند الاتصال." },
  rivalry: { en: "More damage to same gender.", ar: "ضرر أكبر لنفس الجنس." },
  "sheer-force": {
    en: "Boosts moves that have extra effects.",
    ar: "يعزز الحركات ذات التأثيرات الإضافية.",
  },
  "cute-charm": { en: "May cause infatuation on contact.", ar: "قد يسبب الافتتان عند الاتصال." },
  "magic-bounce": { en: "Reflects status moves.", ar: "يعكس حركات الحالة." },
  "friend-guard": { en: "Reduces damage to allies.", ar: "يقلل الضرر للحلفاء." },
  competitive: {
    en: "Boosts Sp. Atk when stats lowered.",
    ar: "يزيد الهجوم الخاص عند خفض الإحصائيات.",
  },
  frisk: { en: "Checks opposing Pokémon's held item.", ar: "يتفحص غرض البوكيمون المعادي." },
  levitate: { en: "Immune to Ground moves.", ar: "محصن ضد حركات الأرض." },
  "cursed-body": { en: "May disable a move on contact.", ar: "قد يعطل حركة عند الاتصال." },
  "weak-armor": {
    en: "Physical hits lower Defense, raise Speed.",
    ar: "الضربات الفيزيائية تخفض الدفاع وترفع السرعة.",
  },
  insomnia: { en: "Prevents sleep.", ar: "يمنع النوم." },
  forewarn: { en: "Reveals opposing Pokémon's strongest move.", ar: "يكشف أقوى حركة للخصم." },
  telepathy: { en: "Avoids damage from allies.", ar: "يتفادى ضرر الحلفاء." },
  "hyper-cutter": { en: "Prevents Attack lowering.", ar: "يمنع خفض الهجوم." },
  "shell-armor": { en: "Blocks critical hits.", ar: "يمنع الضربات الحاسمة." },
  "skill-link": { en: "Multi-hit moves hit 5 times.", ar: "الحركات المتعددة تضرب 5 مرات." },
  overcoat: { en: "Protects against weather and powder.", ar: "يحمي من الطقس والمساحيق." },
  sturdy: {
    en: "Survives one-hit KO moves with 1 HP.",
    ar: "ينجو من الضربة القاضية بنقطة صحة واحدة.",
  },
  "rock-head": { en: "Prevents recoil damage.", ar: "يمنع ضرر الارتداد." },
  "flame-body": { en: "May burn on contact.", ar: "قد يحرق عند الاتصال." },
  "own-tempo": { en: "Prevents confusion.", ar: "يمنع الارتباك." },
  oblivious: { en: "Prevents infatuation and Taunt.", ar: "يمنع الافتتان والاستفزاز." },
  regenerator: { en: "Restores HP when switching out.", ar: "يستعيد الصحة عند التبديل." },
  "magnet-pull": { en: "Traps Steel-type Pokémon.", ar: "يحتجز بوكيمون الصلب." },
  analytic: { en: "Boosts move power when moving last.", ar: "يعزز الحركة عند التحرك أخيراً." },
  "thick-fat": { en: "Halves Fire and Ice damage.", ar: "يخفض ضرر النار والجليد للنصف." },
  "early-bird": { en: "Wakes up quickly from sleep.", ar: "يستيقظ بسرعة من النوم." },
  scrappy: { en: "Can hit Ghost types with Normal moves.", ar: "يمكنه ضرب الأشباح بحركات عادية." },
  "super-luck": { en: "Heightens critical-hit ratio.", ar: "يزيد نسبة الضربات الحاسمة." },
  "water-absorb": { en: "Heals when hit by Water moves.", ar: "يشفى عند التعرض لحركات الماء." },
  "volt-absorb": {
    en: "Heals when hit by Electric moves.",
    ar: "يشفى عند التعرض لحركات الكهرباء.",
  },
  "quick-feet": {
    en: "Boosts Speed when afflicted by status.",
    ar: "يزيد السرعة عند الإصابة بحالة.",
  },
  adaptability: { en: "Powers up same-type moves.", ar: "يعزز حركات نفس النوع." },
  anticipation: { en: "Senses dangerous moves.", ar: "يستشعر الحركات الخطيرة." },
  hydration: { en: "Heals status in rain.", ar: "يشفي الحالات في المطر." },
  "ice-body": { en: "Heals in hail.", ar: "يشفى في البَرَد." },
  "snow-cloak": { en: "Boosts evasion in hail.", ar: "يزيد التفادي في البَرَد." },
  pressure: { en: "Foe uses more PP.", ar: "يجعل الخصم يستخدم PP أكثر." },
  "natural-cure": { en: "Heals status when switching out.", ar: "يشفي الحالات عند التبديل." },
  "serene-grace": { en: "Boosts extra effect chance.", ar: "يزيد فرصة التأثيرات الإضافية." },
  "marvel-scale": { en: "Boosts Defense with status.", ar: "يزيد الدفاع مع الحالات." },
  multiscale: { en: "Reduces damage at full HP.", ar: "يقلل الضرر عند الصحة الكاملة." },
  drizzle: { en: "Summons rain.", ar: "يستدعي المطر." },
  drought: { en: "Summons sunshine.", ar: "يستدعي الشمس." },
  "sand-stream": { en: "Summons sandstorm.", ar: "يستدعي العاصفة الرملية." },
  "snow-warning": { en: "Summons hail.", ar: "يستدعي البَرَد." },
  "mold-breaker": { en: "Ignores Abilities.", ar: "يتجاهل القدرات." },
  prankster: { en: "Status moves get priority.", ar: "حركات الحالة تحصل على الأولوية." },
  immunity: { en: "Prevents poison.", ar: "يمنع التسمم." },
  "battle-armor": { en: "Blocks critical hits.", ar: "يمنع الضربات الحاسمة." },
  soundproof: { en: "Immune to sound moves.", ar: "محصن ضد حركات الصوت." },
  "effect-spore": { en: "May inflict status on contact.", ar: "قد يسبب حالة عند الاتصال." },
  "dry-skin": { en: "Healed by Water, hurt by Fire.", ar: "يشفى بالماء، يتأذى بالنار." },
  // Generation 4 Abilities
  aftermath: { en: "Damages attacker when knocked out.", ar: "يلحق ضرراً بالمهاجم عند الإغماء." },
  "air-lock": { en: "Eliminates weather effects.", ar: "يزيل تأثيرات الطقس." },
  "bad-dreams": { en: "Damages sleeping foes.", ar: "يلحق ضرراً بالأعداء النائمين." },
  download: { en: "Adjusts power based on foe stats.", ar: "يضبط القوة حسب إحصائيات الخصم." },
  filter: { en: "Reduces super-effective damage.", ar: "يقلل الضرر الفائق الفعالية." },
  "flower-gift": { en: "Boosts team stats in sunshine.", ar: "يعزز إحصائيات الفريق في الشمس." },
  forecast: { en: "Changes form with weather.", ar: "يغير الشكل مع الطقس." },
  "honey-gather": { en: "May gather Honey.", ar: "قد يجمع العسل." },
  "iron-barbs": { en: "Damages attacker on contact.", ar: "يلحق ضرراً بالمهاجم عند الاتصال." },
  klutz: { en: "Cannot use held items.", ar: "لا يستطيع استخدام الأغراض المحمولة." },
  "leaf-guard": { en: "Prevents status in sunshine.", ar: "يمنع الحالات في الشمس." },
  minus: { en: "Boosts Sp. Atk with Plus ally.", ar: "يعزز الهجوم الخاص مع حليف موجب." },
  normalize: { en: "All moves become Normal type.", ar: "كل الحركات تصبح نوع عادي." },
  plus: { en: "Boosts Sp. Atk with Minus ally.", ar: "يعزز الهجوم الخاص مع حليف سالب." },
  "poison-heal": { en: "Heals HP when poisoned.", ar: "يشفي الصحة عند التسمم." },
  "pure-power": { en: "Doubles Attack.", ar: "يضاعف الهجوم." },
  "shadow-tag": { en: "Prevents foe from escaping.", ar: "يمنع الخصم من الهروب." },
  simple: { en: "Doubles stat changes.", ar: "يضاعف تغييرات الإحصائيات." },
  "slow-start": {
    en: "Halves Attack and Speed for 5 turns.",
    ar: "يخفض الهجوم والسرعة للنصف لـ5 أدوار.",
  },
  "solid-rock": { en: "Reduces super-effective damage.", ar: "يقلل الضرر الفائق الفعالية." },
  stall: { en: "Always moves last.", ar: "يتحرك دائماً أخيراً." },
  unaware: { en: "Ignores stat changes.", ar: "يتجاهل تغييرات الإحصائيات." },
  triage: { en: "Healing moves get priority.", ar: "حركات الشفاء تحصل على الأولوية." },
  // Generation 5 Abilities
  contrary: { en: "Stat changes are reversed.", ar: "تغييرات الإحصائيات معكوسة." },
  defeatist: { en: "Halves stats when HP is low.", ar: "يخفض الإحصائيات للنصف عند انخفاض الصحة." },
  harvest: { en: "May restore consumed Berry.", ar: "قد يستعيد التوت المستهلك." },
  healer: { en: "May heal ally status.", ar: "قد يشفي حالة الحليف." },
  "heavy-metal": { en: "Doubles weight.", ar: "يضاعف الوزن." },
  illusion: { en: "Appears as last party member.", ar: "يظهر كآخر عضو في الفريق." },
  imposter: { en: "Transforms into foe.", ar: "يتحول إلى الخصم." },
  "light-metal": { en: "Halves weight.", ar: "يخفض الوزن للنصف." },
  moody: { en: "Randomly raises and lowers stats.", ar: "يرفع ويخفض الإحصائيات عشوائياً." },
  moxie: { en: "Boosts Attack after KO.", ar: "يزيد الهجوم بعد الضربة القاضية." },
  mummy: { en: "Spreads Mummy on contact.", ar: "ينشر المومياء عند الاتصال." },
  pickpocket: { en: "Steals item on contact.", ar: "يسرق الغرض عند الاتصال." },
  "poison-touch": { en: "May poison on contact.", ar: "قد يسمم عند الاتصال." },
  rattled: {
    en: "Speed rises when hit by Dark, Ghost, Bug.",
    ar: "ترتفع السرعة عند التعرض للظلام أو الشبح أو الحشرات.",
  },
  "sap-sipper": {
    en: "Absorbs Grass moves to boost Attack.",
    ar: "يمتص حركات العشب لزيادة الهجوم.",
  },
  "sand-rush": { en: "Boosts Speed in sandstorm.", ar: "يزيد السرعة في العاصفة الرملية." },
  stench: { en: "May cause flinching.", ar: "قد يسبب الارتعاش." },
  "sticky-hold": { en: "Protects held item.", ar: "يحمي الغرض المحمول." },
  "storm-drain": {
    en: "Draws Water moves to boost Sp. Atk.",
    ar: "يجذب حركات الماء لزيادة الهجوم الخاص.",
  },
  unburden: { en: "Doubles Speed when item is lost.", ar: "يضاعف السرعة عند فقدان الغرض." },
  "victory-star": { en: "Boosts team accuracy.", ar: "يزيد دقة الفريق." },
  "zen-mode": { en: "Changes form when HP is low.", ar: "يغير الشكل عند انخفاض الصحة." },
  // Generation 6 Abilities
  aerilate: { en: "Normal moves become Flying.", ar: "الحركات العادية تصبح طيران." },
  "aroma-veil": { en: "Protects team from Taunt, etc.", ar: "يحمي الفريق من الاستفزاز وغيره." },
  "aura-break": { en: "Reverses Aura effects.", ar: "يعكس تأثيرات الهالة." },
  bulletproof: { en: "Blocks ball and bomb moves.", ar: "يحجب حركات الكرة والقنبلة." },
  "cheek-pouch": { en: "Heals HP when eating Berry.", ar: "يشفي الصحة عند أكل التوت." },
  "dark-aura": { en: "Powers up Dark moves.", ar: "يعزز حركات الظلام." },
  "fairy-aura": { en: "Powers up Fairy moves.", ar: "يعزز حركات الجن." },
  "flower-veil": {
    en: "Protects Grass allies from stat drops.",
    ar: "يحمي حلفاء العشب من خفض الإحصائيات.",
  },
  "fur-coat": { en: "Halves physical damage.", ar: "يخفض الضرر الفيزيائي للنصف." },
  "gale-wings": {
    en: "Flying moves get priority at full HP.",
    ar: "حركات الطيران تحصل على الأولوية عند الصحة الكاملة.",
  },
  gooey: { en: "Lowers attacker Speed on contact.", ar: "يخفض سرعة المهاجم عند الاتصال." },
  "grass-pelt": { en: "Boosts Defense in Grassy Terrain.", ar: "يزيد الدفاع في أرض العشب." },
  magician: { en: "Steals item when hitting foe.", ar: "يسرق الغرض عند ضرب الخصم." },
  "mega-launcher": { en: "Powers up pulse moves.", ar: "يعزز حركات النبض." },
  "parental-bond": { en: "Attacks twice.", ar: "يهاجم مرتين." },
  pixilate: { en: "Normal moves become Fairy.", ar: "الحركات العادية تصبح جن." },
  protean: { en: "Changes type to match move.", ar: "يغير النوع ليطابق الحركة." },
  refrigerate: { en: "Normal moves become Ice.", ar: "الحركات العادية تصبح جليد." },
  "stance-change": { en: "Changes form based on move.", ar: "يغير الشكل حسب الحركة." },
  "strong-jaw": { en: "Powers up biting moves.", ar: "يعزز حركات العض." },
  "sweet-veil": { en: "Protects team from sleep.", ar: "يحمي الفريق من النوم." },
  symbiosis: { en: "Passes item to ally.", ar: "يمرر الغرض للحليف." },
  "tough-claws": { en: "Powers up contact moves.", ar: "يعزز حركات الاتصال." },
  // Generation 7 Abilities
  battery: { en: "Powers up ally special moves.", ar: "يعزز حركات الحليف الخاصة." },
  "beast-boost": {
    en: "Boosts highest stat after KO.",
    ar: "يعزز أعلى إحصائية بعد الضربة القاضية.",
  },
  berserk: {
    en: "Boosts Sp. Atk when HP falls below half.",
    ar: "يزيد الهجوم الخاص عند انخفاض الصحة لأقل من النصف.",
  },
  comatose: { en: "Always drowsy but can attack.", ar: "دائماً نعسان لكن يستطيع الهجوم." },
  corrosion: { en: "Can poison any type.", ar: "يستطيع تسميم أي نوع." },
  dancer: { en: "Copies dance moves.", ar: "ينسخ حركات الرقص." },
  dazzling: { en: "Blocks priority moves.", ar: "يحجب حركات الأولوية." },
  disguise: { en: "Avoids one hit.", ar: "يتفادى ضربة واحدة." },
  "electric-surge": { en: "Creates Electric Terrain.", ar: "يخلق أرض الكهرباء." },
  "emergency-exit": { en: "Switches out when HP is low.", ar: "يبدل عند انخفاض الصحة." },
  fluffy: {
    en: "Halves contact damage, doubles Fire damage.",
    ar: "يخفض ضرر الاتصال للنصف، يضاعف ضرر النار.",
  },
  "full-metal-body": { en: "Prevents stat lowering.", ar: "يمنع خفض الإحصائيات." },
  galvanize: { en: "Normal moves become Electric.", ar: "الحركات العادية تصبح كهرباء." },
  "grassy-surge": { en: "Creates Grassy Terrain.", ar: "يخلق أرض العشب." },
  "innards-out": {
    en: "Damages attacker when knocked out.",
    ar: "يلحق ضرراً بالمهاجم عند الإغماء.",
  },
  "liquid-voice": { en: "Sound moves become Water.", ar: "حركات الصوت تصبح ماء." },
  "long-reach": { en: "Uses moves without contact.", ar: "يستخدم الحركات بدون اتصال." },
  merciless: { en: "Critical hits on poisoned foes.", ar: "ضربات حاسمة على الأعداء المسمومين." },
  "misty-surge": { en: "Creates Misty Terrain.", ar: "يخلق أرض الضباب." },
  neuroforce: { en: "Powers up super-effective moves.", ar: "يعزز الحركات الفائقة الفعالية." },
  "power-construct": {
    en: "Changes to Complete Forme at low HP.",
    ar: "يتحول للشكل الكامل عند انخفاض الصحة.",
  },
  "power-of-alchemy": {
    en: "Copies ally Ability when knocked out.",
    ar: "ينسخ قدرة الحليف عند إغمائه.",
  },
  "prism-armor": { en: "Reduces super-effective damage.", ar: "يقلل الضرر الفائق الفعالية." },
  "psychic-surge": { en: "Creates Psychic Terrain.", ar: "يخلق أرض النفس." },
  "queenly-majesty": { en: "Blocks priority moves.", ar: "يحجب حركات الأولوية." },
  receiver: { en: "Copies ally Ability when knocked out.", ar: "ينسخ قدرة الحليف عند إغمائه." },
  "rks-system": { en: "Type matches held Memory.", ar: "النوع يطابق الذاكرة المحمولة." },
  schooling: { en: "Changes form based on HP.", ar: "يغير الشكل حسب الصحة." },
  "shadow-shield": { en: "Reduces damage at full HP.", ar: "يقلل الضرر عند الصحة الكاملة." },
  "shields-down": { en: "Changes form when HP is low.", ar: "يغير الشكل عند انخفاض الصحة." },
  "slush-rush": { en: "Boosts Speed in hail.", ar: "يزيد السرعة في البَرَد." },
  "soul-heart": {
    en: "Boosts Sp. Atk when ally faints.",
    ar: "يزيد الهجوم الخاص عند إغماء الحليف.",
  },
  stakeout: { en: "Doubles damage on switching foes.", ar: "يضاعف الضرر على الأعداء المبدلين." },
  stamina: { en: "Boosts Defense when hit.", ar: "يزيد الدفاع عند التعرض للضرب." },
  steelworker: { en: "Powers up Steel moves.", ar: "يعزز حركات الصلب." },
  "surge-surfer": { en: "Doubles Speed in Electric Terrain.", ar: "يضاعف السرعة في أرض الكهرباء." },
  "tangling-hair": {
    en: "Lowers attacker Speed on contact.",
    ar: "يخفض سرعة المهاجم عند الاتصال.",
  },
  "water-bubble": {
    en: "Halves Fire damage, powers up Water.",
    ar: "يخفض ضرر النار للنصف، يعزز الماء.",
  },
  "water-compaction": {
    en: "Boosts Defense when hit by Water.",
    ar: "يزيد الدفاع عند التعرض للماء.",
  },
  "wimp-out": { en: "Switches out when HP is low.", ar: "يبدل عند انخفاض الصحة." },
  // Generation 8 Abilities
  "ball-fetch": { en: "Retrieves failed Poké Ball.", ar: "يسترجع كرة البوكي الفاشلة." },
  "cotton-down": { en: "Lowers Speed of all when hit.", ar: "يخفض سرعة الجميع عند التعرض للضرب." },
  "curious-medicine": {
    en: "Resets ally stat changes.",
    ar: "يعيد تعيين تغييرات إحصائيات الحليف.",
  },
  "dragons-maw": { en: "Powers up Dragon moves.", ar: "يعزز حركات التنين." },
  "gorilla-tactics": { en: "Boosts Attack but locks move.", ar: "يزيد الهجوم لكن يقفل الحركة." },
  "gulp-missile": {
    en: "Attacks when hit after Surf/Dive.",
    ar: "يهاجم عند التعرض للضرب بعد الغوص.",
  },
  "hunger-switch": { en: "Changes form each turn.", ar: "يغير الشكل كل دور." },
  "ice-face": { en: "Blocks one physical hit.", ar: "يحجب ضربة فيزيائية واحدة." },
  "ice-scales": { en: "Halves special damage.", ar: "يخفض الضرر الخاص للنصف." },
  "intrepid-sword": { en: "Boosts Attack on entry.", ar: "يزيد الهجوم عند الدخول." },
  libero: { en: "Changes type to match move.", ar: "يغير النوع ليطابق الحركة." },
  mimicry: { en: "Type changes with terrain.", ar: "يتغير النوع مع الأرض." },
  "mirror-armor": { en: "Reflects stat lowering.", ar: "يعكس خفض الإحصائيات." },
  "neutralizing-gas": { en: "Nullifies all Abilities.", ar: "يلغي جميع القدرات." },
  "pastel-veil": { en: "Protects team from poison.", ar: "يحمي الفريق من التسمم." },
  "perish-body": {
    en: "Both faint in 3 turns on contact.",
    ar: "كلاهما يغمى عليه في 3 أدوار عند الاتصال.",
  },
  "power-spot": { en: "Powers up ally moves.", ar: "يعزز حركات الحليف." },
  "propeller-tail": { en: "Ignores redirection.", ar: "يتجاهل إعادة التوجيه." },
  "punk-rock": { en: "Powers up sound moves.", ar: "يعزز حركات الصوت." },
  "quick-draw": { en: "May move first.", ar: "قد يتحرك أولاً." },
  ripen: { en: "Doubles Berry effects.", ar: "يضاعف تأثيرات التوت." },
  "sand-spit": { en: "Creates sandstorm when hit.", ar: "يخلق عاصفة رملية عند التعرض للضرب." },
  "screen-cleaner": { en: "Clears barriers on entry.", ar: "يزيل الحواجز عند الدخول." },
  stalwart: { en: "Ignores redirection.", ar: "يتجاهل إعادة التوجيه." },
  "steam-engine": {
    en: "Maxes Speed when hit by Fire/Water.",
    ar: "يرفع السرعة للحد الأقصى عند التعرض للنار أو الماء.",
  },
  "steely-spirit": { en: "Powers up ally Steel moves.", ar: "يعزز حركات الصلب للحليف." },
  transistor: { en: "Powers up Electric moves.", ar: "يعزز حركات الكهرباء." },
  "unseen-fist": { en: "Contact moves bypass Protect.", ar: "حركات الاتصال تتجاوز الحماية." },
  "wandering-spirit": { en: "Swaps Ability on contact.", ar: "يبدل القدرة عند الاتصال." },
  // Generation 9 Abilities
  "anger-shell": {
    en: "Boosts stats when HP falls below half.",
    ar: "يعزز الإحصائيات عند انخفاض الصحة لأقل من النصف.",
  },
  "armor-tail": { en: "Blocks priority moves.", ar: "يحجب حركات الأولوية." },
  "beads-of-ruin": { en: "Lowers foe Sp. Def.", ar: "يخفض الدفاع الخاص للخصم." },
  commander: { en: "Commands Dondozo when swallowed.", ar: "يقود دوندوزو عند ابتلاعه." },
  costar: { en: "Copies ally stat changes.", ar: "ينسخ تغييرات إحصائيات الحليف." },
  "cud-chew": { en: "Eats Berry again next turn.", ar: "يأكل التوت مجدداً في الدور التالي." },
  "earth-eater": { en: "Heals when hit by Ground.", ar: "يشفى عند التعرض لحركات الأرض." },
  electromorphosis: { en: "Charges when hit.", ar: "يشحن عند التعرض للضرب." },
  "embody-aspect": { en: "Boosts stats based on mask.", ar: "يعزز الإحصائيات حسب القناع." },
  "good-as-gold": { en: "Immune to status moves.", ar: "محصن ضد حركات الحالة." },
  "guard-dog": { en: "Boosts Attack from Intimidate.", ar: "يزيد الهجوم من الترهيب." },
  "hadron-engine": {
    en: "Creates Electric Terrain, boosts Sp. Atk.",
    ar: "يخلق أرض الكهرباء، يزيد الهجوم الخاص.",
  },
  hospitality: { en: "Heals ally on entry.", ar: "يشفي الحليف عند الدخول." },
  "lingering-aroma": { en: "Spreads Ability on contact.", ar: "ينشر القدرة عند الاتصال." },
  "mind-s-eye": { en: "Ignores evasion and Ghost immunity.", ar: "يتجاهل التفادي وحصانة الأشباح." },
  "mycelium-might": {
    en: "Status moves ignore Abilities but move last.",
    ar: "حركات الحالة تتجاهل القدرات لكن تتحرك أخيراً.",
  },
  "orichalcum-pulse": { en: "Creates sunshine, boosts Attack.", ar: "يخلق الشمس، يزيد الهجوم." },
  opportunist: { en: "Copies foe stat boosts.", ar: "ينسخ تعزيزات إحصائيات الخصم." },
  protosynthesis: { en: "Boosts top stat in sunshine.", ar: "يعزز أعلى إحصائية في الشمس." },
  "purifying-salt": {
    en: "Immune to status, halves Ghost damage.",
    ar: "محصن من الحالات، يخفض ضرر الأشباح للنصف.",
  },
  "quark-drive": {
    en: "Boosts top stat in Electric Terrain.",
    ar: "يعزز أعلى إحصائية في أرض الكهرباء.",
  },
  "rocky-payload": { en: "Powers up Rock moves.", ar: "يعزز حركات الصخر." },
  "seed-sower": { en: "Creates Grassy Terrain when hit.", ar: "يخلق أرض العشب عند التعرض للضرب." },
  sharpness: { en: "Powers up slicing moves.", ar: "يعزز حركات القطع." },
  "supersweet-syrup": { en: "Lowers foe evasion on entry.", ar: "يخفض تفادي الخصم عند الدخول." },
  "supreme-overlord": {
    en: "Boosts stats for each fainted ally.",
    ar: "يعزز الإحصائيات لكل حليف مغشي عليه.",
  },
  "sword-of-ruin": { en: "Lowers foe Defense.", ar: "يخفض دفاع الخصم." },
  "tablets-of-ruin": { en: "Lowers foe Attack.", ar: "يخفض هجوم الخصم." },
  "tera-shell": {
    en: "Resists all types at full HP.",
    ar: "يقاوم جميع الأنواع عند الصحة الكاملة.",
  },
  "tera-shift": { en: "Changes to Terastal Form.", ar: "يتحول للشكل التيراستالي." },
  "teraform-zero": { en: "Removes weather and terrain.", ar: "يزيل الطقس والأرض." },
  "thermal-exchange": {
    en: "Boosts Attack from Fire, immune to burn.",
    ar: "يزيد الهجوم من النار، محصن من الحرق.",
  },
  "toxic-chain": { en: "May badly poison.", ar: "قد يسمم بشدة." },
  "toxic-debris": { en: "Sets Toxic Spikes when hit.", ar: "يضع أشواك سامة عند التعرض للضرب." },
  "vessel-of-ruin": { en: "Lowers foe Sp. Atk.", ar: "يخفض الهجوم الخاص للخصم." },
  "well-baked-body": { en: "Immune to Fire, boosts Defense.", ar: "محصن من النار، يزيد الدفاع." },
  "wind-power": { en: "Charges from wind moves.", ar: "يشحن من حركات الرياح." },
  "wind-rider": {
    en: "Boosts Attack from wind, immune to wind damage.",
    ar: "يزيد الهجوم من الرياح، محصن من ضرر الرياح.",
  },
  "zero-to-hero": {
    en: "Changes to Hero Form when switching.",
    ar: "يتحول لشكل البطل عند التبديل.",
  },
  "clear-body": { en: "Prevents stat lowering.", ar: "يمنع خفض الإحصائيات." },
  "liquid-ooze": { en: "Damages HP-draining foes.", ar: "يلحق ضرراً بالأعداء الممتصين للصحة." },
  "white-smoke": { en: "Prevents stat lowering.", ar: "يمنع خفض الإحصائيات." },
  "wonder-guard": {
    en: "Only super-effective moves hit.",
    ar: "فقط الحركات الفائقة الفعالية تصيب.",
  },
  "color-change": { en: "Changes type when hit.", ar: "يغير النوع عند التعرض للضرب." },
  "speed-boost": { en: "Raises Speed each turn.", ar: "يرفع السرعة كل دور." },
  truant: { en: "Only attacks every other turn.", ar: "يهاجم كل دورين فقط." },
  "wonder-skin": { en: "Resists status moves.", ar: "يقاوم حركات الحالة." },
  "huge-power": { en: "Doubles Attack.", ar: "يضاعف الهجوم." },
  "motor-drive": { en: "Boosts Speed from Electric moves.", ar: "يزيد السرعة من حركات الكهرباء." },
  // Additional abilities not already defined
  "iron-fist": { en: "Powers up punching moves.", ar: "يعزز حركات اللكم." },
  reckless: { en: "Powers up recoil moves.", ar: "يعزز حركات الارتداد." },
  "suction-cups": { en: "Prevents forced switching.", ar: "يمنع التبديل القسري." },
  illuminate: { en: "Raises encounter rate.", ar: "يزيد معدل اللقاءات." },
  teravolt: { en: "Ignores Abilities.", ar: "يتجاهل القدرات." },
  turboblaze: { en: "Ignores Abilities.", ar: "يتجاهل القدرات." },
  "flare-boost": {
    en: "Powers up special moves when burned.",
    ar: "يعزز الحركات الخاصة عند الحرق.",
  },
  "toxic-boost": {
    en: "Powers up physical moves when poisoned.",
    ar: "يعزز الحركات الفيزيائية عند التسمم.",
  },
  "primordial-sea": { en: "Creates heavy rain.", ar: "يخلق مطراً غزيراً." },
  "desolate-land": { en: "Creates harsh sunlight.", ar: "يخلق أشعة شمس قاسية." },
  "delta-stream": { en: "Creates strong winds.", ar: "يخلق رياحاً قوية." },
  "as-one": { en: "Combines two Abilities.", ar: "يجمع قدرتين." },
  "chilling-neigh": { en: "Boosts Attack after KO.", ar: "يزيد الهجوم بعد الضربة القاضية." },
  "grim-neigh": { en: "Boosts Sp. Atk after KO.", ar: "يزيد الهجوم الخاص بعد الضربة القاضية." },
  "dauntless-shield": { en: "Boosts Defense on entry.", ar: "يزيد الدفاع عند الدخول." },
  "poison-puppeteer": { en: "Poisoning causes confusion.", ar: "التسمم يسبب الارتباك." },
  mountaineer: { en: "Immune to Rock moves on entry.", ar: "محصن ضد حركات الصخر عند الدخول." },
  "magma-armor": { en: "Prevents freezing.", ar: "يمنع التجمد." },
  "water-veil": { en: "Prevents burning.", ar: "يمنع الحرق." },
  heatproof: { en: "Halves Fire damage.", ar: "يخفض ضرر النار للنصف." },
  "rough-skin": { en: "Damages attacker on contact.", ar: "يلحق ضرراً بالمهاجم عند الاتصال." },
};

// Evolution method translations
const evolutionMethodTranslations: Record<string, { en: string; ar: string }> = {
  level: { en: "Level Up", ar: "رفع المستوى" },
  trade: { en: "Trade", ar: "التبادل" },
  item: { en: "Use Item", ar: "استخدام غرض" },
  friendship: { en: "High Friendship", ar: "صداقة عالية" },
  stone: { en: "Evolution Stone", ar: "حجر التطور" },
};

// UI GUARDRAIL: Hero background uses neutral primary gradient (design system compliant)
// Type colors appear ONLY in type badges and small indicators, never full backgrounds
const HERO_GRADIENT = "from-primary/80 via-primary/60 to-secondary/40";

// Location icons based on type
const getLocationIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("cave") || lowerName.includes("كهف")) return Mountain;
  if (lowerName.includes("forest") || lowerName.includes("غابة")) return TreePine;
  if (lowerName.includes("city") || lowerName.includes("town") || lowerName.includes("مدينة"))
    return Building;
  if (lowerName.includes("sea") || lowerName.includes("lake") || lowerName.includes("بحر"))
    return Waves;
  return MapPin;
};

// Method translations
const methodTranslations: Record<string, string> = {
  walking: "المشي في العشب",
  surfing: "التصفح",
  fishing: "الصيد",
  headbutt: "ضرب الرأس",
  "rock-smash": "تحطيم الصخور",
  gift: "هدية",
  trade: "تبادل",
  evolution: "تطور",
};

export default function PokemonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tr, language } = useLanguage();
  const isArabic = language === "ar";
  const { isAvailableInGame } = useGameFilter();
  const [isPlayingCry, setIsPlayingCry] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [note, setNote] = useState("");

  const { data: allPokemon, loading: pokemonLoading } = useOfflineData<
    Pokemon & { available_in?: string[] }
  >({ table: "pokemon" });
  const { data: encounters } = useOfflineData<Encounter>({ table: "encounters" });
  const { data: locations } = useOfflineData<Location>({ table: "locations" });
  const { data: pokemonHeldItems } = useOfflineData<PokemonHeldItem>({
    table: "pokemon_held_items",
  });
  const { data: allItems } = useOfflineData<Item & { available_in?: string[] }>({ table: "items" });

  // Mark as viewed and load favorites/notes when page loads
  useEffect(() => {
    if (id) {
      const pokemonId = Number(id);
      markPokemonViewed(pokemonId);
      setIsFavorite(isPokemonFavorite(pokemonId));
      setNote(getPokemonNote(pokemonId));
    }
  }, [id]);

  // Handle favorite toggle
  const handleToggleFavorite = () => {
    if (id) {
      const newState = toggleFavoritePokemon(Number(id));
      setIsFavorite(newState);
    }
  };

  // Handle save note
  const handleSaveNote = () => {
    if (id) {
      savePokemonNote(Number(id), note);
      toast.success(tr("page.dex.noteSaved"));
    }
  };

  const handleArtworkClick = async () => {
    if (isPlayingCry || !pokemon) return;
    setIsPlayingCry(true);
    try {
      const audio = await playPokemonCry(pokemon.id, "latest", 0.5);
      if (audio) {
        audio.onended = () => setIsPlayingCry(false);
      } else {
        setIsPlayingCry(false);
      }
    } catch {
      setIsPlayingCry(false);
    }
  };

  const pokemon = allPokemon.find((p) => p.id === Number(id));
  const pokemonEncounters = encounters.filter((e) => e.pokemon_id === Number(id));
  const encounterLocations = pokemonEncounters
    .map((e) => {
      const location = locations.find((l) => l.id === e.location_id);
      if (location) {
        return { ...location, encounter: e };
      }
      return null;
    })
    .filter(Boolean) as (Location & { encounter: Encounter })[];

  // Get held items for this Pokemon
  const heldItemsForPokemon = pokemonHeldItems
    .filter((phi) => phi.pokemon_id === Number(id))
    .map((phi) => {
      const item = allItems.find((i) => i.id === phi.item_id);
      if (item) {
        return { ...phi, item };
      }
      return null;
    })
    .filter(Boolean) as (PokemonHeldItem & { item: Item & { available_in?: string[] } })[];

  // Dev-only debug logging
  if (import.meta.env.DEV && pokemon) {
    console.log(`[Pokemon Detail Debug] Pokemon ${id}:`, {
      name: pokemon.name_en,
      encountersCount: pokemonEncounters.length,
      locationsCount: encounterLocations.length,
      totalLocationsInDB: locations.length,
      heldItemsCount: heldItemsForPokemon.length,
    });
  }

  const isAvailable = pokemon ? isAvailableInGame(pokemon.available_in) : true;

  if (pokemonLoading) {
    return (
      <Layout>
        <LoadingSkeleton type="detail" />
      </Layout>
    );
  }

  if (!pokemon) {
    return (
      <Layout>
        <EmptyState type="error" message={tr("pokemon.notFoundError")} />
      </Layout>
    );
  }

  const primaryType = pokemon.types?.[0] || "normal";
  const gradientClass = HERO_GRADIENT; // UI guardrail: neutral hero, type colors only in badges

  const statIcons = {
    hp: Heart,
    atk: Swords,
    def: Shield,
    spa: Brain,
    spd: Zap,
    spe: Wind,
  };

  const statLabels = {
    hp: { en: "HP", ar: "ص.ح", enFull: "HP", arFull: "نقاط الصحة" },
    atk: { en: "ATK", ar: "هجوم", enFull: "Attack", arFull: "الهجوم" },
    def: { en: "DEF", ar: "دفاع", enFull: "Defense", arFull: "الدفاع" },
    spa: { en: "SP.A", ar: "هـ.خ", enFull: "Special Attack", arFull: "الهجوم الخاص" },
    spd: { en: "SP.D", ar: "د.خ", enFull: "Special Defense", arFull: "الدفاع الخاص" },
    spe: { en: "SPE", ar: "سرعة", enFull: "Speed", arFull: "السرعة" },
  };

  const statColors = {
    hp: "bg-red-500",
    atk: "bg-orange-500",
    def: "bg-yellow-500",
    spa: "bg-blue-500",
    spd: "bg-green-500",
    spe: "bg-pink-500",
  };

  // Calculate total stats
  const totalStats = Object.values(pokemon.stats || {}).reduce(
    (sum: number, val) => sum + (val as number),
    0,
  );

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section with Gradient Background */}
        <div className={cn("relative bg-gradient-to-br", gradientClass, "pb-20 pt-4 px-4")}>
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-1 text-white/90 hover:text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4" />
              {tr("action.back")}
            </Button>

            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className={cn(
                "gap-1 hover:bg-white/20",
                isFavorite ? "text-amber-400" : "text-white/90 hover:text-white",
              )}
            >
              <Star className={cn("w-5 h-5", isFavorite && "fill-current")} />
              {isFavorite
                ? isArabic
                  ? "مفضل"
                  : "Favorited"
                : isArabic
                  ? "أضف للمفضلة"
                  : "Favorite"}
            </Button>
          </div>

          {/* Not Available Banner */}
          {!isAvailable && (
            <div className="mb-4">
              <NotAvailableBanner
                entityName={language === "ar" ? pokemon.name_ar : pokemon.name_en}
              />
            </div>
          )}

          {/* Pokemon Header */}
          <div className="text-center relative z-10">
            {/* Pokemon ID */}
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30 text-lg px-3 py-1 mb-2"
            >
              #{pokemon.id.toString().padStart(3, "0")}
            </Badge>

            {/* Pokemon Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 drop-shadow-lg">
              {getPokemonName(pokemon, language)}
            </h1>
            {language !== "ar" && (
              <p className="text-white/80 text-lg mb-4">
                {pokemonNamesArabic[pokemon.id] || pokemon.name_ar || ""}
              </p>
            )}
            {language === "ar" && <p className="text-white/80 text-lg mb-4">{pokemon.name_en}</p>}

            {/* Types */}
            <div className="flex justify-center gap-2 mb-4">
              {pokemon.types?.map((type) => (
                <TypeBadge key={type} type={type} size="md" />
              ))}
            </div>

            {/* Pokemon Artwork - Click to play cry */}
            <div
              className={cn(
                "relative mx-auto w-48 h-48 md:w-64 md:h-64 cursor-pointer",
                isPlayingCry && "animate-pulse",
              )}
              onClick={handleArtworkClick}
              role="button"
              tabIndex={0}
              aria-label={tr("pokemon.clickToPlayCry")}
              onKeyDown={(e) => e.key === "Enter" && handleArtworkClick()}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl animate-pulse" />
              <OfflineImage
                src={getPokemonArtwork(pokemon.id)}
                alt={language === "ar" ? pokemon.name_ar : pokemon.name_en}
                className={cn(
                  "relative w-full h-full object-contain drop-shadow-2xl transition-all duration-300",
                  isPlayingCry
                    ? "scale-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                    : "hover:scale-105",
                )}
                placeholderType="pokemon"
              />
            </div>

            {/* Animated Sprite */}
            <div className="mt-4 flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <AnimatedPokemonSprite
                  pokemonId={pokemon.id}
                  pokemonName={pokemon.name_en}
                  size="2xl"
                  className="drop-shadow-lg"
                />
              </div>
            </div>

            {/* Compact Cry Player Button */}
            <div className="mt-4">
              <CryPlayer
                pokemonId={pokemon.id}
                pokemonName={getPokemonName(pokemon, language)}
                compact
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-background -mt-16 rounded-t-3xl relative z-20 p-4 space-y-6">
          {/* TL;DR Quick Summary */}
          <QuickSummary>
            {getPokemonSummary(
              pokemon.stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
              pokemon.types || [],
              calculateDefensiveMatchups(pokemon.types || []).weaknesses.length,
              language as "en" | "ar",
              pokemon.is_starter,
              pokemon.is_legendary,
            )}
          </QuickSummary>

          {/* Full Cry Player Card */}
          <CryPlayer pokemonId={pokemon.id} pokemonName={getPokemonName(pokemon, language)} />

          {/* Quick Insight Card - NEW */}
          <QuickInsightCard
            stats={pokemon.stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }}
            types={pokemon.types || []}
            isStarter={pokemon.is_starter}
            isLegendary={pokemon.is_legendary}
            weaknesses={calculateDefensiveMatchups(pokemon.types || []).weaknesses}
          />

          {/* Stats Section - Collapsible for progressive disclosure */}
          <CollapsibleSection
            title={language === "ar" ? "إحصائيات القوة" : "Base Stats"}
            icon={BarChart3}
            subtitle={language === "ar" ? `إجمالي: ${totalStats}` : `Total: ${totalStats}`}
            defaultOpen={false}
          >
            <div className="space-y-3">
              {Object.entries(pokemon.stats || {}).map(([key, value]) => {
                const Icon = statIcons[key as keyof typeof statIcons];
                const label = statLabels[key as keyof typeof statLabels];
                const color = statColors[key as keyof typeof statColors];
                const percentage = Math.min((value / 255) * 100, 100);
                const statInterpretation = getStatLabel(value);

                return (
                  <div
                    key={key}
                    className="flex items-center gap-3"
                    title={language === "ar" ? label.arFull : label.enFull}
                  >
                    <div className="flex items-center gap-2 w-20 shrink-0">
                      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {language === "ar" ? label.ar : label.en}
                      </span>
                    </div>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-bold text-foreground w-10 text-right">{value}</span>
                    <span className={cn("text-xs w-14 text-right", statInterpretation.color)}>
                      {language === "ar" ? statInterpretation.ar : statInterpretation.en}
                    </span>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* Full Evolution Chain Section */}
          <EvolutionChain
            pokemonId={pokemon.id}
            currentPokemon={{ id: pokemon.id, name_en: pokemon.name_en, name_ar: pokemon.name_ar }}
            showFullDetails
          />

          {/* Quick Stats Summary - Key info at a glance */}
          {(() => {
            const matchups = calculateDefensiveMatchups(pokemon.types || []);
            return (
              <QuickStatsSummary
                totalStats={totalStats}
                weaknessCount={matchups.weaknesses.length}
                resistanceCount={matchups.resistances.length + matchups.immunities.length}
                locationCount={encounterLocations.length}
              />
            );
          })()}

          {/* Type Effectiveness - Collapsible for progressive disclosure */}
          <CollapsibleSection
            title={language === "ar" ? "تحليل النوع والضعف" : "Type Effectiveness Analysis"}
            icon={Shield}
            subtitle={
              language === "ar"
                ? "نقاط الضعف والمقاومة التفصيلية"
                : "Detailed weaknesses and resistances"
            }
            defaultOpen={false}
          >
            <TypeEffectivenessSection types={pokemon.types || []} />
          </CollapsibleSection>

          {/* Abilities Section - Collapsible for progressive disclosure */}
          {pokemon.abilities && pokemon.abilities.length > 0 && (
            <CollapsibleSection
              title={language === "ar" ? "القدرات ونصائح المعركة" : "Abilities & Battle Tips"}
              icon={Sparkles}
              subtitle={
                language === "ar"
                  ? "كيفية استخدام قدرات هذا البوكيمون"
                  : "How to use this Pokémon's abilities"
              }
              defaultOpen={false}
            >
              <AbilitiesSection abilities={pokemon.abilities} pokemonTypes={pokemon.types || []} />
            </CollapsibleSection>
          )}

          {/* Moves Tabs - Collapsible for progressive disclosure */}
          <CollapsibleSection
            title={language === "ar" ? "الحركات والتقنيات" : "Moves & Techniques"}
            icon={BookOpen}
            subtitle={
              language === "ar"
                ? "أفضل الحركات وقائمة التعلم الكاملة"
                : "Best moves and full learnset"
            }
            defaultOpen={false}
          >
            <MovesTabs
              pokemonId={pokemon.id}
              pokemonName={pokemon.name_en}
              pokemonTypes={pokemon.types || []}
              stats={pokemon.stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }}
              evolutionInfo={{
                hasEvolution: !!pokemon.evolution,
                evolutionIds:
                  pokemon.evolution?.chain
                    ?.map((e: any) => e.pokemon_id)
                    .filter((id: number) => id !== pokemon.id) || [],
              }}
            />
          </CollapsibleSection>

          {/* Held Items in Wild - Collapsible */}
          {heldItemsForPokemon.length > 0 && (
            <CollapsibleSection
              title={language === "ar" ? "الأدوات المحمولة في البرية" : "Held Items in Wild"}
              icon={Package}
              subtitle={
                language === "ar"
                  ? `${heldItemsForPokemon.length} أداة متاحة`
                  : `${heldItemsForPokemon.length} item${heldItemsForPokemon.length > 1 ? "s" : ""} available`
              }
              defaultOpen={false}
            >
              <div className="grid gap-3">
                {heldItemsForPokemon.map((heldItem) => (
                  <div
                    key={heldItem.id}
                    onClick={() => navigate(`/items/${heldItem.item.id}`)}
                    className="bg-gradient-to-r from-muted/80 to-muted/40 rounded-xl p-4 border border-border hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <OfflineImage
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${heldItem.item.name_en.toLowerCase().replace(/ /g, "-").replace(/'/g, "")}.png`}
                          alt={heldItem.item.name_en}
                          className="w-8 h-8"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {language === "ar" ? heldItem.item.name_ar : heldItem.item.name_en}
                        </h3>
                        {language !== "ar" && heldItem.item.name_ar && (
                          <p className="text-sm text-muted-foreground">{heldItem.item.name_ar}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          heldItem.hold_chance >= 50
                            ? "text-green-400 border-green-500/30 bg-green-500/10"
                            : heldItem.hold_chance >= 10
                              ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                              : "text-muted-foreground border-border",
                        )}
                      >
                        {language === "ar"
                          ? `${heldItem.hold_chance}% فرصة`
                          : `${heldItem.hold_chance}% chance`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Locations - Collapsible */}
          {encounterLocations.length > 0 && (
            <CollapsibleSection
              title={tr("pokemon.whereToFind")}
              icon={Map}
              subtitle={
                language === "ar"
                  ? `${encounterLocations.length} موقع`
                  : `${encounterLocations.length} location${encounterLocations.length > 1 ? "s" : ""}`
              }
              defaultOpen={false}
            >
              <div className="flex justify-end mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/map", { state: { highlightPokemon: pokemon.id } })}
                  className="gap-1"
                >
                  <MapPin className="w-4 h-4" />
                  {tr("action.viewMap")}
                </Button>
              </div>

              <div className="grid gap-3">
                {encounterLocations.map((location, idx) => {
                  const LocationIcon = getLocationIcon(location.name_en);
                  const encounter = location.encounter;

                  return (
                    <div
                      key={`${location.id}-${idx}`}
                      className="bg-gradient-to-r from-muted/80 to-muted/40 rounded-xl p-4 border border-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                          <LocationIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">
                            {language === "ar"
                              ? location.name_ar || "الموقع قيد الإضافة"
                              : location.name_en}
                          </h3>
                          {language !== "ar" && location.name_ar && (
                            <p className="text-sm text-muted-foreground">{location.name_ar}</p>
                          )}

                          {/* Encounter Details */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {language === "ar"
                                ? `م. ${encounter.min_lvl}-${encounter.max_lvl}`
                                : `Lv. ${encounter.min_lvl}-${encounter.max_lvl}`}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs text-foreground border-border"
                            >
                              {language === "ar"
                                ? methodTranslations[encounter.method] || encounter.method
                                : encounter.method}
                            </Badge>
                            {encounter.chance && (
                              <Badge
                                variant="outline"
                                className="text-xs text-green-400 border-green-500/30 bg-green-500/10"
                              >
                                {encounter.chance}%
                              </Badge>
                            )}
                            {encounter.time_of_day && (
                              <Badge
                                variant="outline"
                                className="text-xs text-amber-400 border-amber-500/30 bg-amber-500/10"
                              >
                                {encounter.time_of_day}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* Notes */}
          {(language === "ar" ? pokemon.notes_ar : pokemon.notes_en) && (
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                  📝 {tr("pokemon.notes")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {language === "ar"
                    ? pokemon.notes_ar || tr("pokemon.notesBeingAdded")
                    : pokemon.notes_en}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Personal Notes */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <h2 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {tr("page.dex.yourNotes")}
              </h2>
              <Textarea
                placeholder={tr("page.dex.addNote")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleSaveNote}
                className="min-h-[80px] text-sm"
              />
            </CardContent>
          </Card>

          {/* Fun Facts */}
          <PokemonFunFacts pokemonId={pokemon.id} types={pokemon.types as string[]} />

          {/* Training Guide */}
          <TrainingGuide stats={pokemon.stats as any} />

          {/* Next Steps Section */}
          <NextStepsSection
            pokemonId={pokemon.id}
            primaryType={primaryType}
            nextEvolutionId={(() => {
              // Find next evolution from evolution data
              const evo = pokemon.evolution;
              if (evo && Array.isArray(evo.chain)) {
                const currentIndex = evo.chain.findIndex((e: any) => e.pokemon_id === pokemon.id);
                if (currentIndex >= 0 && currentIndex < evo.chain.length - 1) {
                  return evo.chain[currentIndex + 1]?.pokemon_id;
                }
              }
              return undefined;
            })()}
            hasLocations={encounterLocations.length > 0}
          />

          {/* Empty State for No Locations */}
          {encounterLocations.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-foreground mb-1">
                  {tr("location.notAvailableYet")}
                </h3>
                <p className="text-sm text-muted-foreground">{tr("location.dataNotAdded")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
