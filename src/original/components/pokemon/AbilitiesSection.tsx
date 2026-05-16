/**
 * AbilitiesSection Component
 * Displays Pokemon abilities with explanations and contextual battle tips
 */

import { useMemo } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import {
  Star,
  Eye,
  Lightbulb,
  Swords,
  Shield,
  Zap,
  Sun,
  Cloud,
  Droplets,
  Flame,
} from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Ability {
  name_en: string;
  name_ar?: string;
  is_hidden: boolean;
}

interface Props {
  abilities: Ability[];
  pokemonTypes: string[];
}

// Battle tips based on ability category
interface AbilityData {
  en: string;
  ar: string;
  category: "offensive" | "defensive" | "utility" | "weather" | "terrain" | "status";
  battleTip: { en: string; ar: string };
}

const abilityDatabase: Record<string, AbilityData> = {
  // Offensive abilities
  overgrow: {
    en: "Powers up Grass-type moves when HP is low.",
    ar: "يعزز حركات العشب عندما تكون الصحة منخفضة.",
    category: "offensive",
    battleTip: {
      en: "Stay in battle at low HP to maximize Grass damage!",
      ar: "ابقَ في المعركة عند الصحة المنخفضة لتعظيم ضرر العشب!",
    },
  },
  blaze: {
    en: "Powers up Fire-type moves when HP is low.",
    ar: "يعزز حركات النار عندما تكون الصحة منخفضة.",
    category: "offensive",
    battleTip: {
      en: "Use Fire moves when HP drops below 1/3 for 1.5x power!",
      ar: "استخدم حركات النار عندما تنخفض الصحة لأقل من الثلث لقوة 1.5 ضعف!",
    },
  },
  torrent: {
    en: "Powers up Water-type moves when HP is low.",
    ar: "يعزز حركات الماء عندما تكون الصحة منخفضة.",
    category: "offensive",
    battleTip: {
      en: "Water moves get a boost at low HP - time your attacks!",
      ar: "حركات الماء تحصل على تعزيز عند الصحة المنخفضة - وقّت هجماتك!",
    },
  },
  swarm: {
    en: "Powers up Bug-type moves when HP is low.",
    ar: "يعزز حركات الحشرات عندما تكون الصحة منخفضة.",
    category: "offensive",
    battleTip: {
      en: "Bug moves become 1.5x stronger below 1/3 HP!",
      ar: "حركات الحشرات تصبح أقوى 1.5 مرة عند أقل من ثلث الصحة!",
    },
  },
  technician: {
    en: "Powers up weaker moves (60 power or less).",
    ar: "يعزز الحركات الضعيفة (60 قوة أو أقل).",
    category: "offensive",
    battleTip: {
      en: "Use multi-hit moves like Bullet Seed for massive damage!",
      ar: "استخدم الحركات متعددة الضربات مثل رصاصة البذور لضرر هائل!",
    },
  },
  "tough-claws": {
    en: "Powers up contact moves by 30%.",
    ar: "يعزز حركات الاتصال بنسبة 30%.",
    category: "offensive",
    battleTip: {
      en: "Prioritize contact moves like Slash and Crunch!",
      ar: "أعطِ الأولوية لحركات الاتصال مثل القطع والعضّ!",
    },
  },
  "huge-power": {
    en: "Doubles Attack stat.",
    ar: "يضاعف إحصائية الهجوم.",
    category: "offensive",
    battleTip: {
      en: "Your physical attacks hit like a truck - abuse it!",
      ar: "هجماتك الفيزيائية قوية جداً - استغل ذلك!",
    },
  },
  adaptability: {
    en: "STAB bonus is 2x instead of 1.5x.",
    ar: "مكافأة نفس النوع 2 ضعف بدلاً من 1.5 ضعف.",
    category: "offensive",
    battleTip: {
      en: "Always use moves matching your type for maximum damage!",
      ar: "استخدم دائماً حركات تطابق نوعك لأقصى ضرر!",
    },
  },
  "sheer-force": {
    en: "Powers up moves with secondary effects by 30%, but removes those effects.",
    ar: "يعزز الحركات ذات التأثيرات الثانوية بنسبة 30%، لكن يزيل تلك التأثيرات.",
    category: "offensive",
    battleTip: {
      en: "Use moves like Iron Head and Flamethrower for boosted damage!",
      ar: "استخدم حركات مثل رأس الحديد ولهب النار لضرر معزز!",
    },
  },

  // Defensive abilities
  intimidate: {
    en: "Lowers opposing Pokémon's Attack on entry.",
    ar: "يخفض هجوم البوكيمون المعادي عند الدخول.",
    category: "defensive",
    battleTip: {
      en: "Switch in against physical attackers to weaken them!",
      ar: "بدّل للدخول ضد المهاجمين الفيزيائيين لإضعافهم!",
    },
  },
  sturdy: {
    en: "Survives any hit with 1 HP if at full health.",
    ar: "ينجو من أي ضربة بـ1 صحة إذا كان بصحة كاملة.",
    category: "defensive",
    battleTip: {
      en: "Guaranteed to survive one hit - use it to set up!",
      ar: "مضمون البقاء لضربة واحدة - استخدمها للتجهيز!",
    },
  },
  multiscale: {
    en: "Halves damage when at full HP.",
    ar: "ينصّف الضرر عند الصحة الكاملة.",
    category: "defensive",
    battleTip: {
      en: "Use Roost to heal back to full and reactivate!",
      ar: "استخدم الاستراحة للشفاء الكامل وإعادة التفعيل!",
    },
  },
  levitate: {
    en: "Immune to Ground-type moves.",
    ar: "محصن ضد حركات الأرض.",
    category: "defensive",
    battleTip: {
      en: "Switch in freely against Earthquake and Earth Power!",
      ar: "بدّل بحرية ضد الزلزال وقوة الأرض!",
    },
  },
  "wonder-guard": {
    en: "Only super effective moves deal damage.",
    ar: "فقط الحركات فائقة الفعالية تسبب ضرراً.",
    category: "defensive",
    battleTip: {
      en: "Avoid super effective types at all costs!",
      ar: "تجنب الأنواع فائقة الفعالية بأي ثمن!",
    },
  },
  "magic-bounce": {
    en: "Reflects status moves back at the user.",
    ar: "يعكس حركات الحالة للمستخدم.",
    category: "defensive",
    battleTip: {
      en: "Great counter to Stealth Rock and status setters!",
      ar: "رد ممتاز على الصخور الخفية ومضعي الحالات!",
    },
  },
  regenerator: {
    en: "Heals 1/3 HP when switching out.",
    ar: "يشفي ثلث الصحة عند التبديل.",
    category: "defensive",
    battleTip: {
      en: "Switch out often to stay healthy throughout the battle!",
      ar: "بدّل كثيراً للبقاء بصحة جيدة طوال المعركة!",
    },
  },

  // Speed/Utility abilities
  chlorophyll: {
    en: "Doubles Speed in sunny weather.",
    ar: "يضاعف السرعة في الطقس المشمس.",
    category: "weather",
    battleTip: {
      en: "Pair with Sunny Day or Drought for insane speed!",
      ar: "اقرنه مع يوم مشمس أو الجفاف لسرعة جنونية!",
    },
  },
  "swift-swim": {
    en: "Doubles Speed in rain.",
    ar: "يضاعف السرعة في المطر.",
    category: "weather",
    battleTip: {
      en: "Set up Rain Dance to outspeed everything!",
      ar: "فعّل رقصة المطر لتفوق الجميع سرعة!",
    },
  },
  "sand-rush": {
    en: "Doubles Speed in sandstorm.",
    ar: "يضاعف السرعة في العاصفة الرملية.",
    category: "weather",
    battleTip: {
      en: "Combine with Sand Stream or Sandstorm for a speed sweep!",
      ar: "اجمعه مع تيار الرمال أو العاصفة الرملية للاكتساح السريع!",
    },
  },
  "slush-rush": {
    en: "Doubles Speed in hail.",
    ar: "يضاعف السرعة في البَرَد.",
    category: "weather",
    battleTip: {
      en: "Use with Snow Warning for instant speed boost!",
      ar: "استخدمه مع تحذير الثلج لتعزيز سرعة فوري!",
    },
  },
  "speed-boost": {
    en: "Raises Speed each turn.",
    ar: "يزيد السرعة كل دور.",
    category: "utility",
    battleTip: {
      en: "Protect first turn to gain a speed boost safely!",
      ar: "احمِ في الدور الأول للحصول على تعزيز السرعة بأمان!",
    },
  },
  prankster: {
    en: "Status moves get +1 priority.",
    ar: "حركات الحالة تحصل على +1 أولوية.",
    category: "utility",
    battleTip: {
      en: "Thunder Wave and Taunt before the opponent can act!",
      ar: "موجة الرعد والاستفزاز قبل أن يتصرف الخصم!",
    },
  },
  guts: {
    en: "Attack is boosted by 50% when affected by status.",
    ar: "يزداد الهجوم بنسبة 50% عند التأثر بحالة.",
    category: "offensive",
    battleTip: {
      en: "Hold a Flame Orb to activate Guts every battle!",
      ar: "احمل جرم اللهب لتفعيل الشجاعة في كل معركة!",
    },
  },
  moxie: {
    en: "Attack rises after knocking out an opponent.",
    ar: "يرتفع الهجوم بعد هزيمة خصم.",
    category: "offensive",
    battleTip: {
      en: "Sweep weakened teams to snowball into unstoppable power!",
      ar: "اكتسح الفرق الضعيفة لتتراكم قوتك بشكل لا يمكن إيقافه!",
    },
  },

  // Weather setters
  drought: {
    en: "Summons harsh sunlight on entry.",
    ar: "يستدعي شمساً حارقة عند الدخول.",
    category: "weather",
    battleTip: {
      en: "Boosts Fire moves and enables Chlorophyll sweepers!",
      ar: "يعزز حركات النار ويمكّن المكتسحين بالكلوروفيل!",
    },
  },
  drizzle: {
    en: "Summons rain on entry.",
    ar: "يستدعي المطر عند الدخول.",
    category: "weather",
    battleTip: {
      en: "Boosts Water moves and enables Swift Swim sweepers!",
      ar: "يعزز حركات الماء ويمكّن المكتسحين بالسباحة السريعة!",
    },
  },
  "sand-stream": {
    en: "Summons sandstorm on entry.",
    ar: "يستدعي العاصفة الرملية عند الدخول.",
    category: "weather",
    battleTip: {
      en: "Boosts Rock-types SpD and chips non-Ground/Rock/Steel foes!",
      ar: "يعزز دفاع الصخور الخاص ويؤذي الأعداء غير الأرض/الصخر/الفولاذ!",
    },
  },
  "snow-warning": {
    en: "Summons hail on entry.",
    ar: "يستدعي البَرَد عند الدخول.",
    category: "weather",
    battleTip: {
      en: "Chips non-Ice foes and enables Blizzard 100% accuracy!",
      ar: "يؤذي الأعداء غير الجليد ويمكّن العاصفة الثلجية بدقة 100%!",
    },
  },

  // Status abilities
  static: {
    en: "May paralyze on contact (30% chance).",
    ar: "قد يشل عند الاتصال (فرصة 30%).",
    category: "status",
    battleTip: {
      en: "Let physical attackers hit you to potentially paralyze them!",
      ar: "دع المهاجمين الفيزيائيين يضربونك لاحتمال شلّهم!",
    },
  },
  "flame-body": {
    en: "May burn on contact (30% chance).",
    ar: "قد يحرق عند الاتصال (فرصة 30%).",
    category: "status",
    battleTip: {
      en: "Physical attackers risk getting burned when hitting you!",
      ar: "المهاجمون الفيزيائيون يخاطرون بالحرق عند ضربك!",
    },
  },
  "poison-point": {
    en: "May poison on contact (30% chance).",
    ar: "قد يسمم عند الاتصال (فرصة 30%).",
    category: "status",
    battleTip: {
      en: "Contact moves risk poisoning the attacker!",
      ar: "حركات الاتصال تخاطر بتسميم المهاجم!",
    },
  },
  "natural-cure": {
    en: "Heals status conditions when switching out.",
    ar: "يشفي حالات الوضع عند التبديل.",
    category: "utility",
    battleTip: {
      en: "Switch out to cure status instead of using items!",
      ar: "بدّل للشفاء من الحالة بدلاً من استخدام العناصر!",
    },
  },
  immunity: {
    en: "Cannot be poisoned.",
    ar: "لا يمكن تسميمه.",
    category: "defensive",
    battleTip: {
      en: "Safe switch-in against Toxic and Poison moves!",
      ar: "تبديل آمن ضد السام وحركات السم!",
    },
  },
  "water-absorb": {
    en: "Heals 25% HP when hit by Water moves.",
    ar: "يشفي 25% صحة عند التعرض لحركات الماء.",
    category: "defensive",
    battleTip: {
      en: "Switch in on predicted Water moves for free healing!",
      ar: "بدّل عند توقع حركات الماء للشفاء المجاني!",
    },
  },
  "volt-absorb": {
    en: "Heals 25% HP when hit by Electric moves.",
    ar: "يشفي 25% صحة عند التعرض لحركات الكهرباء.",
    category: "defensive",
    battleTip: {
      en: "Great for absorbing Thunder Wave and Thunderbolt!",
      ar: "ممتاز لامتصاص موجة الرعد والصاعقة!",
    },
  },
  "flash-fire": {
    en: "Immune to Fire; Fire moves get 1.5x boost after being hit.",
    ar: "محصن ضد النار؛ حركات النار تحصل على تعزيز 1.5 ضعف بعد التعرض للضرب.",
    category: "defensive",
    battleTip: {
      en: "Switch in on Fire moves to power up your own Fire attacks!",
      ar: "بدّل ضد حركات النار لتعزيز هجماتك النارية!",
    },
  },
};

// Category icons and colors
const categoryStyles: Record<string, { icon: typeof Swords; color: string; bgColor: string }> = {
  offensive: { icon: Swords, color: "text-red-400", bgColor: "bg-red-500/10" },
  defensive: { icon: Shield, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  utility: { icon: Zap, color: "text-amber-400", bgColor: "bg-amber-500/10" },
  weather: { icon: Sun, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  terrain: { icon: Cloud, color: "text-green-400", bgColor: "bg-green-500/10" },
  status: { icon: Droplets, color: "text-purple-400", bgColor: "bg-purple-500/10" },
};

export function AbilitiesSection({ abilities, pokemonTypes }: Props) {
  const { tr, language } = useLanguage();

  // Get ability name in selected language
  const getAbilityName = (ability: Ability): string => {
    if (language === "ar" && ability.name_ar && ability.name_ar !== ability.name_en) {
      return ability.name_ar;
    }
    return ability.name_en;
  };

  // Get ability data with fallback
  const getAbilityData = (abilityKey: string): AbilityData | null => {
    return abilityDatabase[abilityKey] || null;
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <h2 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          {tr("pokemon.abilities")}
        </h2>

        <div className="grid gap-3">
          {abilities.map((ability, index) => {
            const abilityKey = ability.name_en?.toLowerCase().replace(/\s+/g, "-");
            const abilityData = getAbilityData(abilityKey);
            const CategoryIcon = abilityData ? categoryStyles[abilityData.category]?.icon : Zap;
            const categoryColor = abilityData
              ? categoryStyles[abilityData.category]?.color
              : "text-muted-foreground";
            const categoryBg = abilityData
              ? categoryStyles[abilityData.category]?.bgColor
              : "bg-muted/50";

            return (
              <div
                key={index}
                className={cn(
                  "rounded-xl p-4 border transition-all",
                  ability.is_hidden
                    ? "bg-purple-500/10 border-purple-500/30"
                    : "bg-muted/50 border-border",
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{getAbilityName(ability)}</p>
                    {abilityData && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] gap-1",
                          categoryColor,
                          categoryBg,
                          "border-transparent",
                        )}
                      >
                        <CategoryIcon className="w-2.5 h-2.5" />
                        {abilityData.category === "offensive" &&
                          (language === "ar" ? "هجومي" : "Offensive")}
                        {abilityData.category === "defensive" &&
                          (language === "ar" ? "دفاعي" : "Defensive")}
                        {abilityData.category === "utility" &&
                          (language === "ar" ? "مساعد" : "Utility")}
                        {abilityData.category === "weather" &&
                          (language === "ar" ? "طقس" : "Weather")}
                        {abilityData.category === "status" &&
                          (language === "ar" ? "حالة" : "Status")}
                      </Badge>
                    )}
                  </div>
                  {ability.is_hidden && (
                    <Badge
                      variant="outline"
                      className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {tr("pokemon.hidden")}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">
                  {abilityData
                    ? language === "ar"
                      ? abilityData.ar
                      : abilityData.en
                    : tr("fallback.descBeingAdded")}
                </p>

                {/* Battle Tip */}
                {abilityData && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary">
                      {language === "ar" ? abilityData.battleTip.ar : abilityData.battleTip.en}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
