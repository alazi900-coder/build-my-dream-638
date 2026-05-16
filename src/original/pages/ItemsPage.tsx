import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { Item } from "@/original/types/pokemon";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { SearchBar } from "@/original/components/ui/search-bar";
import { LoadingSkeleton } from "@/original/components/ui/loading-skeleton";
import { EmptyState } from "@/original/components/ui/empty-state";
import { Button } from "@/original/components/ui/button";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/original/components/ui/dialog";
import { OfflineImage } from "@/original/components/ui/OfflineImage";
import {
  Pill,
  Sparkles,
  Circle,
  Cherry,
  Package,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  FlaskConical,
  Disc,
  Key,
  X,
} from "lucide-react";
import { itemNamesArabic } from "@/original/data/arabicTranslations";

// Categories based on actual database values
const categoryFilters = [
  "all",
  "healing",
  "medicine",
  "revival",
  "status-cures",
  "pp-recovery",
  "evolution",
  "standard-balls",
  "special-balls",
  "apricorn-balls",
  "berries",
  "held-items",
  "type-enhancement",
  "stat-boosts",
  "all-machines",
  "vitamins",
  "plot-advancement",
  "other",
] as const;

const ITEMS_PER_PAGE = 24;

// Arabic translations for items (by name_en key)
const itemTranslations: Record<string, { name: string; effect: string }> = {
  // Healing
  potion: { name: "جرعة", effect: "تستعيد 20 نقطة صحة" },
  "super-potion": { name: "جرعة فائقة", effect: "تستعيد 60 نقطة صحة" },
  "hyper-potion": { name: "جرعة خارقة", effect: "تستعيد 120 نقطة صحة" },
  "max-potion": { name: "جرعة قصوى", effect: "تستعيد كل نقاط الصحة" },
  "full-restore": { name: "استعادة كاملة", effect: "تستعيد كل الصحة وتشفي جميع الحالات" },
  "fresh-water": { name: "ماء عذب", effect: "يستعيد 50 نقطة صحة" },
  "soda-pop": { name: "مياه الصودا", effect: "تستعيد 60 نقطة صحة" },
  lemonade: { name: "ليموناضة", effect: "تستعيد 80 نقطة صحة" },
  "moomoo-milk": { name: "حليب موموو", effect: "يستعيد 100 نقطة صحة" },
  "berry-juice": { name: "عصير التوت", effect: "يستعيد 20 نقطة صحة" },
  "energy-powder": { name: "مسحوق الطاقة", effect: "يستعيد 50 صحة لكن مر المذاق" },
  "energy-root": { name: "جذر الطاقة", effect: "يستعيد 200 صحة لكن مر المذاق" },
  // Revival
  revive: { name: "إحياء", effect: "يُحيي بوكيمون مغشياً عليه بنصف صحته" },
  "max-revive": { name: "إحياء أقصى", effect: "يُحيي بوكيمون مغشياً عليه بكامل صحته" },
  "revival-herb": { name: "عشبة الإحياء", effect: "تُحيي البوكيمون لكنها مرة" },
  // Status Cures
  antidote: { name: "ترياق", effect: "يشفي التسمم" },
  "burn-heal": { name: "شفاء الحروق", effect: "يشفي الحروق" },
  "ice-heal": { name: "شفاء التجمد", effect: "يشفي التجمد" },
  awakening: { name: "إيقاظ", effect: "يشفي النوم" },
  "paralyze-heal": { name: "شفاء الشلل", effect: "يشفي الشلل" },
  "full-heal": { name: "شفاء كامل", effect: "يشفي جميع حالات الضعف" },
  "heal-powder": { name: "مسحوق الشفاء", effect: "يشفي جميع حالات الضعف" },
  // PP Recovery
  ether: { name: "إثير", effect: "يستعيد 10 PP لحركة واحدة" },
  "max-ether": { name: "إثير أقصى", effect: "يستعيد كل PP لحركة واحدة" },
  elixir: { name: "إكسير", effect: "يستعيد 10 PP لكل الحركات" },
  "max-elixir": { name: "إكسير أقصى", effect: "يستعيد كل PP لكل الحركات" },
  "pp-up": { name: "رفع PP", effect: "يزيد الحد الأقصى لـ PP لحركة" },
  "pp-max": { name: "PP أقصى", effect: "يرفع PP للحد الأقصى" },
  // Poké Balls
  "poke-ball": { name: "كرة بوكيمون", effect: "كرة عادية لالتقاط البوكيمون" },
  "great-ball": { name: "كرة عظيمة", effect: "كرة بمعدل التقاط جيد" },
  "ultra-ball": { name: "كرة فائقة", effect: "كرة بمعدل التقاط جيد جداً" },
  "master-ball": { name: "كرة رئيسية", effect: "تلتقط أي بوكيمون بضمان" },
  "premier-ball": { name: "كرة مميزة", effect: "كرة خاصة تُمنح كهدية" },
  "safari-ball": { name: "كرة السفاري", effect: "كرة خاصة بمنطقة السفاري" },
  "quick-ball": { name: "كرة سريعة", effect: "فعالة جداً في بداية المعركة" },
  "timer-ball": { name: "كرة الوقت", effect: "تزداد فعاليتها مع مرور الأدوار" },
  "dusk-ball": { name: "كرة الغسق", effect: "فعالة في الليل والكهوف" },
  "heal-ball": { name: "كرة الشفاء", effect: "تشفي البوكيمون المصطاد" },
  "net-ball": { name: "كرة الشبكة", effect: "فعالة ضد بوكيمون الماء والحشرات" },
  "dive-ball": { name: "كرة الغوص", effect: "فعالة تحت الماء" },
  "luxury-ball": { name: "كرة الفخامة", effect: "تزيد من سعادة البوكيمون" },
  "repeat-ball": { name: "كرة التكرار", effect: "فعالة ضد بوكيمون مسجل في الديكس" },
  "nest-ball": { name: "كرة العش", effect: "فعالة ضد البوكيمونات ضعيفة المستوى" },
  "love-ball": { name: "كرة الحب", effect: "فعالة ضد البوكيمونات من الجنس المعاكس" },
  "moon-ball": { name: "كرة القمر", effect: "فعالة ضد البوكيمونات التي تتطور بحجر القمر" },
  "heavy-ball": { name: "كرة ثقيلة", effect: "فعالة ضد البوكيمونات الثقيلة" },
  "fast-ball": { name: "كرة سريعة", effect: "فعالة ضد البوكيمونات السريعة" },
  "level-ball": { name: "كرة المستوى", effect: "فعالة إذا كان مستواك أعلى" },
  "lure-ball": { name: "كرة الطُعم", effect: "فعالة ضد بوكيمونات الصيد" },
  "friend-ball": { name: "كرة الصداقة", effect: "تزيد الصداقة عند الإمساك" },
  "dream-ball": { name: "كرة الحلم", effect: "فعالة ضد البوكيمونات النائمة" },
  "beast-ball": { name: "كرة الوحش", effect: "فعالة ضد الوحوش الفائقة" },
  // Vitamins
  "rare-candy": { name: "حلوى نادرة", effect: "ترفع مستوى البوكيمون بواحد" },
  "hp-up": { name: "رفع الصحة", effect: "يزيد نقاط الجهد للصحة" },
  protein: { name: "بروتين", effect: "يزيد نقاط الجهد للهجوم" },
  iron: { name: "حديد", effect: "يزيد نقاط الجهد للدفاع" },
  calcium: { name: "كالسيوم", effect: "يزيد نقاط الجهد للهجوم الخاص" },
  zinc: { name: "زنك", effect: "يزيد نقاط الجهد للدفاع الخاص" },
  carbos: { name: "كاربوس", effect: "يزيد نقاط الجهد للسرعة" },
  // Battle Items
  "x-attack": { name: "X هجوم", effect: "يرفع الهجوم في المعركة" },
  "x-defense": { name: "X دفاع", effect: "يرفع الدفاع في المعركة" },
  "x-speed": { name: "X سرعة", effect: "يرفع السرعة في المعركة" },
  "x-sp-atk": { name: "X هجوم خاص", effect: "يرفع الهجوم الخاص في المعركة" },
  "x-sp-def": { name: "X دفاع خاص", effect: "يرفع الدفاع الخاص في المعركة" },
  "x-accuracy": { name: "X دقة", effect: "يرفع الدقة في المعركة" },
  "dire-hit": { name: "ضربة قاتلة", effect: "يزيد نسبة الضربات الحرجة" },
  "guard-spec": { name: "حارس خاص", effect: "يمنع خفض الإحصائيات" },
  // Evolution Stones
  "fire-stone": { name: "حجر النار", effect: "يُطور بعض بوكيمونات النار" },
  "water-stone": { name: "حجر الماء", effect: "يُطور بعض بوكيمونات الماء" },
  "thunder-stone": { name: "حجر الرعد", effect: "يُطور بعض بوكيمونات الكهرباء" },
  "leaf-stone": { name: "حجر الورق", effect: "يُطور بعض بوكيمونات العشب" },
  "moon-stone": { name: "حجر القمر", effect: "يُطور بعض البوكيمونات" },
  "sun-stone": { name: "حجر الشمس", effect: "يُطور بعض البوكيمونات" },
  "dusk-stone": { name: "حجر الغسق", effect: "يُطور بعض البوكيمونات" },
  "dawn-stone": { name: "حجر الفجر", effect: "يُطور بعض البوكيمونات" },
  "shiny-stone": { name: "حجر لامع", effect: "يُطور بعض البوكيمونات" },
  "ice-stone": { name: "حجر الجليد", effect: "يُطور بعض بوكيمونات الجليد" },
  "oval-stone": { name: "حجر بيضاوي", effect: "يُطور هابيني نهاراً" },
  // Held Items
  leftovers: { name: "بقايا", effect: "يستعيد الصحة تدريجياً في المعركة" },
  "life-orb": { name: "جوهرة الحياة", effect: "يزيد قوة الهجمات مقابل صحة" },
  "choice-band": { name: "شريط الاختيار", effect: "يزيد الهجوم لكن يحصر في حركة واحدة" },
  "choice-specs": { name: "نظارات الاختيار", effect: "يزيد الهجوم الخاص لكن يحصر في حركة واحدة" },
  "choice-scarf": { name: "وشاح الاختيار", effect: "يزيد السرعة لكن يحصر في حركة واحدة" },
  "focus-sash": { name: "حزام التركيز", effect: "يمنع الإغماء من ضربة واحدة قاتلة" },
  "assault-vest": {
    name: "سترة الهجوم",
    effect: "يزيد الدفاع الخاص لكن يمنع الحركات غير الهجومية",
  },
  eviolite: { name: "إيفيولايت", effect: "يزيد دفاع البوكيمون غير المكتمل التطور" },
  "rocky-helmet": { name: "خوذة صخرية", effect: "يُلحق ضرراً بالمهاجم عند التلامس" },
  "black-sludge": { name: "وحل أسود", effect: "يشفي السم، يضر غيره" },
  "toxic-orb": { name: "كرة السم", effect: "يُسمم حامله" },
  "flame-orb": { name: "كرة اللهب", effect: "يُحرق حامله" },
  "exp-share": { name: "مشاركة الخبرة", effect: "يشارك نقاط الخبرة مع الفريق" },
  "lucky-egg": { name: "بيضة الحظ", effect: "يزيد نقاط الخبرة المكتسبة" },
  "amulet-coin": { name: "عملة التميمة", effect: "يُضاعف المال المكتسب" },
  "soothe-bell": { name: "جرس التهدئة", effect: "يزيد الصداقة بشكل أسرع" },
  "destiny-knot": { name: "عقدة القدر", effect: "ينقل IVs عند التفريخ" },
  everstone: { name: "حجر دائم", effect: "يمنع التطور" },
  "power-herb": { name: "عشبة القوة", effect: "يسمح بهجوم من مرحلتين فوراً" },
  "white-herb": { name: "عشبة بيضاء", effect: "تستعيد الإحصائيات المخفوضة" },
  "mental-herb": { name: "عشبة عقلية", effect: "تشفي حالات مثل الجذب والتعطيل" },
  "focus-band": { name: "شريط التركيز", effect: "قد يمنع الإغماء بفرصة" },
  "kings-rock": { name: "صخرة الملك", effect: "قد يجعل الخصم يتراجع" },
  "scope-lens": { name: "عدسة نطاق", effect: "يزيد نسبة الضربات الحرجة" },
  "razor-claw": { name: "مخلب حاد", effect: "يزيد نسبة الضربات الحرجة" },
  "wide-lens": { name: "عدسة واسعة", effect: "يزيد الدقة قليلاً" },
  "zoom-lens": { name: "عدسة تكبير", effect: "يزيد الدقة إذا تحركت ثانياً" },
  "shell-bell": { name: "جرس صدفة", effect: "يستعيد صحة من الضرر المُلحق" },
  "big-root": { name: "جذر كبير", effect: "يزيد فعالية الحركات الماصة" },
  "black-belt": { name: "حزام أسود", effect: "يعزز حركات القتال" },
  "black-glasses": { name: "نظارات سوداء", effect: "يعزز حركات الظلام" },
  charcoal: { name: "فحم", effect: "يعزز حركات النار" },
  "dragon-fang": { name: "ناب التنين", effect: "يعزز حركات التنين" },
  "hard-stone": { name: "حجر صلب", effect: "يعزز حركات الصخر" },
  magnet: { name: "مغناطيس", effect: "يعزز حركات الكهرباء" },
  "metal-coat": { name: "طلاء معدني", effect: "يعزز حركات الفولاذ" },
  "miracle-seed": { name: "بذرة معجزة", effect: "يعزز حركات العشب" },
  "mystic-water": { name: "ماء غامض", effect: "يعزز حركات الماء" },
  "never-melt-ice": { name: "جليد لا يذوب", effect: "يعزز حركات الجليد" },
  "poison-barb": { name: "شوكة السم", effect: "يعزز حركات السم" },
  "sharp-beak": { name: "منقار حاد", effect: "يعزز حركات الطيران" },
  "silk-scarf": { name: "وشاح حريري", effect: "يعزز حركات العادي" },
  "silver-powder": { name: "مسحوق فضي", effect: "يعزز حركات الحشرات" },
  "soft-sand": { name: "رمل ناعم", effect: "يعزز حركات الأرض" },
  "spell-tag": { name: "بطاقة سحرية", effect: "يعزز حركات الشبح" },
  "twisted-spoon": { name: "ملعقة ملتوية", effect: "يعزز حركات النفسي" },
  // Berries
  "oran-berry": { name: "توت أوران", effect: "يستعيد 10 صحة عند الضعف" },
  "sitrus-berry": { name: "توت سيتروس", effect: "يستعيد 25% صحة عند الضعف" },
  "lum-berry": { name: "توت لوم", effect: "يشفي أي حالة ضعف" },
  "cheri-berry": { name: "توت شيري", effect: "يشفي الشلل" },
  "chesto-berry": { name: "توت تشيستو", effect: "يشفي النوم" },
  "pecha-berry": { name: "توت بيتشا", effect: "يشفي التسمم" },
  "rawst-berry": { name: "توت راوست", effect: "يشفي الحروق" },
  "aspear-berry": { name: "توت أسبير", effect: "يشفي التجمد" },
  "leppa-berry": { name: "توت ليبا", effect: "يستعيد 10 PP لحركة" },
  "persim-berry": { name: "توت بيرسيم", effect: "يشفي الارتباك" },
  "razz-berry": { name: "توت راز", effect: "يستخدم لصنع الحلوى" },
  "bluk-berry": { name: "توت بلوك", effect: "يستخدم لصنع الحلوى" },
  "nanab-berry": { name: "توت ناناب", effect: "يستخدم لصنع الحلوى" },
  "wepear-berry": { name: "توت ويبير", effect: "يستخدم لصنع الحلوى" },
  "pinap-berry": { name: "توت بيناب", effect: "يستخدم لصنع الحلوى" },
  "pomeg-berry": { name: "توت بوميج", effect: "يخفض نقاط جهد الصحة" },
  "kelpsy-berry": { name: "توت كيلبسي", effect: "يخفض نقاط جهد الهجوم" },
  "qualot-berry": { name: "توت كوالوت", effect: "يخفض نقاط جهد الدفاع" },
  "hondew-berry": { name: "توت هونديو", effect: "يخفض نقاط جهد الهجوم الخاص" },
  "grepa-berry": { name: "توت جريبا", effect: "يخفض نقاط جهد الدفاع الخاص" },
  "tamato-berry": { name: "توت تاماتو", effect: "يخفض نقاط جهد السرعة" },
  "cornn-berry": { name: "توت كورن", effect: "يستخدم لصنع الحلوى" },
  "magost-berry": { name: "توت ماجوست", effect: "يستخدم لصنع الحلوى" },
  "rabuta-berry": { name: "توت رابوتا", effect: "يستخدم لصنع الحلوى" },
  "nomel-berry": { name: "توت نوميل", effect: "يستخدم لصنع الحلوى" },
  "spelon-berry": { name: "توت سبيلون", effect: "يستخدم لصنع الحلوى" },
  "pamtre-berry": { name: "توت بامتري", effect: "يستخدم لصنع الحلوى" },
  "watmel-berry": { name: "توت واتميل", effect: "يستخدم لصنع الحلوى" },
  "durin-berry": { name: "توت دورين", effect: "يستخدم لصنع الحلوى" },
  "belue-berry": { name: "توت بيليو", effect: "يستخدم لصنع الحلوى" },
  // Key Items
  bicycle: { name: "دراجة", effect: "وسيلة تنقل سريعة" },
  "fishing-rod": { name: "صنارة صيد", effect: "لصيد البوكيمون من الماء" },
  "town-map": { name: "خريطة المدينة", effect: "تعرض خريطة المنطقة" },
  pokedex: { name: "بوكيديكس", effect: "موسوعة البوكيمون" },
  "vs-seeker": { name: "باحث المعارك", effect: "للبحث عن معارك المدربين" },
  "coin-case": { name: "حافظة العملات", effect: "لتخزين عملات الكازينو" },
};

export default function ItemsPage() {
  const { tr, trFormat, language } = useLanguage();
  const { isAvailableInGame } = useGameFilter();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<
    | (Item & {
        available_in?: string[];
        obtain?: {
          location_en?: string;
          location_ar?: string;
          method_en?: string;
          method_ar?: string;
        }[];
      })
    | null
  >(null);

  const {
    data: items,
    loading,
    error,
  } = useOfflineData<
    Item & {
      available_in?: string[];
      obtain?: {
        location_en?: string;
        location_ar?: string;
        method_en?: string;
        method_ar?: string;
      }[];
    }
  >({ table: "items" });

  // Map database categories to filter categories
  const mapCategoryToFilter = (dbCategory: string): string => {
    const categoryMap: Record<string, string> = {
      healing: "healing",
      medicine: "medicine",
      revival: "revival",
      "status-cures": "status-cures",
      "pp-recovery": "pp-recovery",
      "picky-healing": "healing",
      evolution: "evolution",
      "standard-balls": "standard-balls",
      "special-balls": "special-balls",
      "apricorn-balls": "apricorn-balls",
      "held-items": "held-items",
      "bad-held-items": "held-items",
      choice: "held-items",
      "type-enhancement": "type-enhancement",
      "type-protection": "type-enhancement",
      "stat-boosts": "stat-boosts",
      "effort-training": "stat-boosts",
      "effort-drop": "stat-boosts",
      vitamins: "vitamins",
      "all-machines": "all-machines",
      "plot-advancement": "plot-advancement",
      gameplay: "plot-advancement",
      "event-items": "plot-advancement",
      plates: "held-items",
      "species-specific": "held-items",
      scarves: "held-items",
      "in-a-pinch": "held-items",
      training: "stat-boosts",
      flutes: "other",
      collectibles: "other",
      loot: "other",
      mulch: "berries",
      spelunking: "other",
      "baking-only": "berries",
      "dex-completion": "other",
      "data-cards": "other",
      "all-mail": "other",
      "apricorn-box": "other",
      unused: "other",
    };
    return categoryMap[dbCategory] || "other";
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        search === "" ||
        item.name_en.toLowerCase().includes(search.toLowerCase()) ||
        item.name_ar.includes(search);

      const mappedCategory = mapCategoryToFilter(item.category);
      const matchesCategory = selectedCategory === "all" || mappedCategory === selectedCategory;
      const matchesGame = isAvailableInGame(item.available_in);

      return matchesSearch && matchesCategory && matchesGame;
    });
  }, [items, search, selectedCategory, isAvailableInGame]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const getCategoryIcon = (category: string) => {
    const mapped = mapCategoryToFilter(category);
    switch (mapped) {
      case "healing":
      case "medicine":
      case "revival":
      case "status-cures":
      case "pp-recovery":
        return Pill;
      case "evolution":
        return Sparkles;
      case "standard-balls":
      case "special-balls":
      case "apricorn-balls":
        return Circle;
      case "berries":
        return Cherry;
      case "held-items":
        return Shield;
      case "type-enhancement":
        return Zap;
      case "stat-boosts":
      case "vitamins":
        return FlaskConical;
      case "all-machines":
        return Disc;
      case "plot-advancement":
        return Key;
      default:
        return Package;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categoryKeys: Record<string, string> = {
      all: "item.category.all",
      healing: "item.category.healing",
      medicine: "item.category.medicine",
      revival: "item.category.revival",
      "status-cures": "item.category.statusCures",
      "pp-recovery": "item.category.ppRecovery",
      evolution: "item.category.evolution",
      "standard-balls": "item.category.standardBalls",
      "special-balls": "item.category.specialBalls",
      "apricorn-balls": "item.category.apricornBalls",
      berries: "item.category.berries",
      "held-items": "item.category.heldItems",
      "type-enhancement": "item.category.typeEnhancement",
      "stat-boosts": "item.category.statBoosts",
      vitamins: "item.category.vitamins",
      "all-machines": "item.category.machines",
      "plot-advancement": "item.category.keyItems",
      other: "item.category.other",
    };
    const key = categoryKeys[category] || "item.category.other";
    return tr(key as Parameters<typeof tr>[0]);
  };

  const getCategoryColor = (category: string) => {
    const mapped = mapCategoryToFilter(category);
    const colors: Record<string, string> = {
      healing: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      medicine: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      revival: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      "status-cures": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      "pp-recovery": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      evolution: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      "standard-balls": "bg-red-500/20 text-red-300 border-red-500/30",
      "special-balls": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "apricorn-balls": "bg-lime-500/20 text-lime-300 border-lime-500/30",
      berries: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      "held-items": "bg-sky-500/20 text-sky-300 border-sky-500/30",
      "type-enhancement": "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "stat-boosts": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      vitamins: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      "all-machines": "bg-violet-500/20 text-violet-300 border-violet-500/30",
      "plot-advancement": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      other: "bg-muted text-muted-foreground border-border",
    };
    return colors[mapped] || colors.other;
  };

  // Get localized text - use local translations as fallback
  const getItemTranslation = (item: Item & { id?: number }) => {
    if (language === "ar") {
      const key = item.name_en.toLowerCase().replace(/\s+/g, "-");
      // Check local itemTranslations first (string key)
      const localTranslation = itemTranslations[key];
      if (localTranslation) {
        return { name: localTranslation.name, effect: localTranslation.effect };
      }
      // Then check centralized translations file (numeric id)
      if (item.id) {
        const centralTranslation = itemNamesArabic[item.id];
        if (centralTranslation) {
          return { name: centralTranslation.name, effect: centralTranslation.effect };
        }
      }
      // Finally use database values with fallback
      return {
        name: item.name_ar && item.name_ar !== item.name_en ? item.name_ar : "الاسم قيد الإضافة",
        effect:
          item.effect_ar && item.effect_ar !== item.effect_en
            ? item.effect_ar
            : "الوصف العربي قيد الإضافة",
      };
    }
    return {
      name: item.name_en,
      effect: item.effect_en || "",
    };
  };

  if (error) {
    return (
      <Layout>
        <EmptyState type="error" message={error} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <PageHeader
          title={tr("page.items.title")}
          description={trFormat("page.items.available", { count: filteredItems.length })}
          icon={Package}
        />

        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={{ en: "Search items...", ar: "بحث عن أدوات..." }}
        />

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categoryFilters.map((cat) => {
            const Icon = getCategoryIcon(cat);
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="gap-1.5 whitespace-nowrap shrink-0"
              >
                <Icon className="w-4 h-4" />
                {getCategoryLabel(cat)}
              </Button>
            );
          })}
        </div>

        {/* Items Grid */}
        {loading ? (
          <LoadingSkeleton count={10} type="list" />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            type={items.length === 0 ? "empty" : "no-results"}
            message={items.length === 0 ? tr("item.noData") : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {paginatedItems.map((item) => {
                const CategoryIcon = getCategoryIcon(item.category);
                // Better sprite name generation for PokeAPI
                const getItemSpriteUrl = (name: string) => {
                  const normalized = name
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/['']/g, "")
                    .replace(/[^a-z0-9-]/g, "")
                    .replace(/--+/g, "-");
                  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${normalized}.png`;
                };
                const itemSpriteUrl = getItemSpriteUrl(item.name_en);
                const translation = getItemTranslation(item);

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:border-primary transition-colors cursor-pointer"
                    onClick={() => navigate(`/items/${item.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center text-center gap-2">
                        {/* Item Image */}
                        <div className="w-14 h-14 bg-muted/50 rounded-xl flex items-center justify-center border-2 border-border">
                          <OfflineImage
                            src={itemSpriteUrl}
                            alt={item.name_en}
                            className="w-10 h-10 object-contain"
                            placeholderType="item"
                          />
                        </div>

                        {/* Item Name */}
                        <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2">
                          {language === "ar" ? translation.name : item.name_en}
                        </h3>

                        {/* Category Badge */}
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${getCategoryColor(item.category)}`}
                        >
                          {getCategoryLabel(mapCategoryToFilter(item.category))}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label={tr("pagination.previous")}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-h-[44px] min-w-[44px] p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label={tr("pagination.next")}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Page Info */}
            <p className="text-center text-sm text-muted-foreground">
              {tr("pagination.page")} <span dir="ltr">{currentPage}</span> {tr("pagination.of")}{" "}
              <span dir="ltr">{totalPages}</span>
            </p>
          </>
        )}

        {/* Item Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-md">
            {selectedItem &&
              (() => {
                const CategoryIcon = getCategoryIcon(selectedItem.category);
                const itemSpriteName = selectedItem.name_en
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "");
                const itemSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemSpriteName}.png`;
                const translation = getItemTranslation(selectedItem);

                return (
                  <div className="space-y-4">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center border-2 border-border">
                          <img
                            src={itemSpriteUrl}
                            alt={selectedItem.name_en}
                            className="w-12 h-12 object-contain"
                            style={{ imageRendering: "pixelated" }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                          <CategoryIcon className="w-8 h-8 text-muted-foreground hidden" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">
                            {language === "ar" ? translation.name : selectedItem.name_en}
                          </h2>
                          <Badge
                            variant="outline"
                            className={`mt-1 ${getCategoryColor(selectedItem.category)}`}
                          >
                            {getCategoryLabel(mapCategoryToFilter(selectedItem.category))}
                          </Badge>
                        </div>
                      </DialogTitle>
                    </DialogHeader>

                    {/* Description */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                          {tr("move.effect")}
                        </h4>
                        <p className="text-foreground">
                          {language === "ar" ? translation.effect : selectedItem.effect_en}
                        </p>
                      </div>

                      {/* Usage if available */}
                      {(selectedItem.usage_en || selectedItem.usage_ar) && (
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                            {tr("item.usage")}
                          </h4>
                          <p className="text-primary">
                            {language === "ar"
                              ? selectedItem.usage_ar || selectedItem.usage_en
                              : selectedItem.usage_en}
                          </p>
                        </div>
                      )}

                      {/* Obtain locations */}
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {tr("item.whereToFind")}
                        </h4>
                        {selectedItem.obtain &&
                        Array.isArray(selectedItem.obtain) &&
                        selectedItem.obtain.length > 0 ? (
                          <ul className="space-y-1.5">
                            {selectedItem.obtain.map((o: any, i: number) => (
                              <li
                                key={i}
                                className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2"
                              >
                                {o.location || o.method || tr("item.pokeMart")}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                            {tr("item.buyFromMart")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
