import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, hasSupabaseConfig } from "@/original/integrations/supabase/client";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Layout } from "@/original/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/original/components/ui/tabs";
import { Badge } from "@/original/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/original/components/ui/dialog";
import {
  BookOpen,
  Sparkles,
  RotateCcw,
  Loader2,
  ArrowRight,
  Save,
  FolderOpen,
  Trophy,
  Wand2,
  Eye,
  Clock,
  Zap,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import { HeroCustomizer } from "@/original/components/adventure/HeroCustomizer";
import { SavedAdventures } from "@/original/components/adventure/SavedAdventures";
import { AdventureProgress } from "@/original/components/adventure/AdventureProgress";
import { AchievementToast } from "@/original/components/adventure/AchievementToast";
import {
  SavedAdventure,
  saveAdventure,
  generateAdventureId,
  unlockAchievement,
  getTotalChoices,
  getUsedStoryTypes,
  getAllAdventures,
  ACHIEVEMENTS,
} from "@/original/lib/adventureStorage";
import { getAllPokemon } from "@/original/lib/store/dataStore";

interface HeroConfig {
  heroName: string;
  mainPokemonId: string;
  companionPokemonId: string;
  startingRegion: string;
}

interface StoryPokemon {
  id: number;
  name_en: string;
  name_ar: string;
  types: string[];
  is_legendary: boolean;
}

interface StoryGeneratorResult {
  story: string;
  choices: string[];
  error?: string;
}

// Enhanced story types with length and difficulty
const storyTypes = [
  {
    value: "adventure",
    labelEn: "Adventure",
    labelAr: "مغامرة",
    descEn: "Explore new routes, meet trainers, and discover hidden challenges.",
    descAr: "استكشاف وتحديات ومقابلة مدربين جدد.",
    lengthKey: "story.lengthShort",
    difficultyKey: "story.difficultyEasy",
    lengthIcon: Clock,
    difficultyIcon: Star,
    lengthLevel: 1,
    difficultyLevel: 1,
    recommended: true,
  },
  {
    value: "mystery",
    labelEn: "Mystery",
    labelAr: "غموض",
    descEn: "Follow clues and uncover a Pokémon mystery.",
    descAr: "تتبع الأدلة واكشف لغزًا في عالم البوكيمون.",
    lengthKey: "story.lengthMedium",
    difficultyKey: "story.difficultyMedium",
    lengthIcon: Clock,
    difficultyIcon: Star,
    lengthLevel: 2,
    difficultyLevel: 2,
    recommended: false,
  },
  {
    value: "comedy",
    labelEn: "Comedy",
    labelAr: "كوميديا",
    descEn: "A light adventure full of funny surprises.",
    descAr: "مغامرة خفيفة مليئة بالمواقف المضحكة.",
    lengthKey: "story.lengthShort",
    difficultyKey: "story.difficultyEasy",
    lengthIcon: Clock,
    difficultyIcon: Star,
    lengthLevel: 1,
    difficultyLevel: 1,
    recommended: true,
  },
  {
    value: "heroic",
    labelEn: "Heroic",
    labelAr: "بطولي",
    descEn: "Face a major threat and become the region's hero.",
    descAr: "واجه خطرًا كبيرًا وكن بطل المنطقة.",
    lengthKey: "story.lengthLong",
    difficultyKey: "story.difficultyHard",
    lengthIcon: Clock,
    difficultyIcon: Star,
    lengthLevel: 3,
    difficultyLevel: 3,
    recommended: false,
  },
];

const regions = [
  { id: "kanto", nameEn: "Kanto", nameAr: "كانتو" },
  { id: "galar", nameEn: "Galar", nameAr: "جالار" },
  { id: "johto", nameEn: "Johto", nameAr: "جوتو" },
  { id: "hoenn", nameEn: "Hoenn", nameAr: "هوين" },
  { id: "sinnoh", nameEn: "Sinnoh", nameAr: "سينو" },
  { id: "hisui", nameEn: "Hisui", nameAr: "هيسوي" },
];

const POINTS_PER_CHOICE = 10;
const POINTS_FOR_COMPLETION = 50;

export default function AdventureStoryPage() {
  const { t, language } = useLanguage();
  const [selectedStoryType, setSelectedStoryType] = useState("adventure");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAdventure, setCurrentAdventure] = useState<SavedAdventure | null>(null);
  const [heroConfig, setHeroConfig] = useState<HeroConfig>({
    heroName: "",
    mainPokemonId: "",
    companionPokemonId: "none",
    startingRegion: "kanto",
  });
  const [activeTab, setActiveTab] = useState<"new" | "saved">("new");
  const [showPreview, setShowPreview] = useState(false);

  const { data: pokemon = [] } = useQuery<StoryPokemon[]>({
    queryKey: ["pokemon-story-selector"],
    queryFn: async () => {
      if (hasSupabaseConfig) {
        try {
          const { data, error } = await supabase
            .from("pokemon")
            .select("id, name_en, name_ar, types, is_legendary")
            .order("id")
            .limit(151);
          if (!error && data && data.length > 0) {
            return data.map((p) => ({
              ...p,
              types: Array.isArray(p.types) ? (p.types as string[]) : [],
              is_legendary: p.is_legendary || false,
            }));
          }
        } catch {
          // Local Pokémon data powers story setup without network access.
        }
      }

      const localPokemon = await getAllPokemon();
      return localPokemon.slice(0, 151).map((p) => ({
        id: p.id,
        name_en: p.name_en,
        name_ar: p.name_ar,
        types: p.types,
        is_legendary: p.is_legendary,
      }));
    },
  });

  const selectedPokemonData = pokemon.find((p) => p.id.toString() === heroConfig.mainPokemonId);
  const companionPokemonData = pokemon.find(
    (p) => p.id.toString() === heroConfig.companionPokemonId,
  );

  // Suggest an adventure for beginners
  const suggestAdventure = () => {
    const starters = [1, 4, 7, 25, 133]; // Bulbasaur, Charmander, Squirtle, Pikachu, Eevee
    const randomPokemon = starters[Math.floor(Math.random() * starters.length)];

    setHeroConfig({
      heroName: language === "ar" ? "المغامر" : "Adventurer",
      mainPokemonId: randomPokemon.toString(),
      companionPokemonId: "none",
      startingRegion: "kanto",
    });
    setSelectedStoryType("adventure");
    toast.success(t("Adventure suggested!", "تم اقتراح المغامرة!"));
  };

  // Generate mock preview (offline-safe, no AI call)
  const getOfflineChoices = () =>
    language === "ar"
      ? ["استكشاف الطريق", "تدريب الفريق", "البحث عن دليل"]
      : ["Explore the path", "Train the team", "Search for a clue"];

  const generateMockPreview = () => {
    const pokemonData = pokemon.find((p) => p.id.toString() === heroConfig.mainPokemonId);
    const region = regions.find((r) => r.id === heroConfig.startingRegion);
    const heroName = heroConfig.heroName || (language === "ar" ? "المدرب" : "Trainer");
    const pokemonName = pokemonData
      ? language === "ar"
        ? pokemonData.name_ar
        : pokemonData.name_en
      : "";
    const regionName = region ? (language === "ar" ? region.nameAr : region.nameEn) : "";

    const templates: Record<string, { ar: string; en: string }> = {
      adventure: {
        ar: `في صباح مشرق في منطقة ${regionName}، يستيقظ ${heroName} على صوت ${pokemonName} المتحمس. اليوم هو بداية مغامرة جديدة مليئة بالتحديات والاكتشافات...`,
        en: `On a bright morning in ${regionName}, ${heroName} wakes up to the excited sounds of ${pokemonName}. Today marks the beginning of a new adventure filled with challenges and discoveries...`,
      },
      mystery: {
        ar: `غموض يلف منطقة ${regionName}. ${heroName} و${pokemonName} يتبعان آثاراً غريبة تقودهما نحو سر قديم مخفي في أعماق الغابة...`,
        en: `Mystery shrouds ${regionName}. ${heroName} and ${pokemonName} follow strange tracks leading to an ancient secret hidden deep in the forest...`,
      },
      comedy: {
        ar: `"أين وضعت كراتي؟!" صرخ ${heroName} بينما كان ${pokemonName} يختبئ ضاحكاً خلف الأريكة. يوم آخر مليء بالمفاجآت المضحكة...`,
        en: `"Where did I put my Poké Balls?!" shouted ${heroName} while ${pokemonName} hid laughing behind the couch. Another day full of funny surprises...`,
      },
      heroic: {
        ar: `معركة مصيرية تنتظر في أفق ${regionName}. ${heroName} و${pokemonName} يستعدان لمواجهة الخطر الأعظم الذي يهدد المنطقة بأكملها...`,
        en: `A fateful battle awaits on the horizon of ${regionName}. ${heroName} and ${pokemonName} prepare to face the greatest danger threatening the entire region...`,
      },
    };

    return templates[selectedStoryType]?.[language] || templates.adventure[language];
  };

  const generateOfflineContinuation = (choice: string) => {
    const pokemonData = pokemon.find((p) => p.id.toString() === heroConfig.mainPokemonId);
    const pokemonName = pokemonData
      ? language === "ar"
        ? pokemonData.name_ar
        : pokemonData.name_en
      : language === "ar"
        ? "البوكيمون"
        : "the Pokémon";

    if (language === "ar") {
      return `اختار الفريق "${choice}"، فانطلق ${pokemonName} بثقة نحو المرحلة التالية. ظهرت علامات جديدة في الطريق، وكل قرار قرّب المغامرة من نهايتها السعيدة.`;
    }

    return `The team chose "${choice}", and ${pokemonName} moved confidently into the next stage. New signs appeared along the path, and every decision brought the adventure closer to a happy ending.`;
  };

  // Check for achievements
  const checkAchievements = async (adventure: SavedAdventure) => {
    const achievementsToCheck: string[] = [];

    const allAdventures = await getAllAdventures();
    if (allAdventures.length === 0) {
      achievementsToCheck.push("first_adventure");
    }

    if (adventure.isComplete) {
      achievementsToCheck.push("story_complete");
    }

    const totalChoices = await getTotalChoices();
    if (totalChoices + adventure.choicesMade >= 10) {
      achievementsToCheck.push("choice_master");
    }

    const usedTypes = await getUsedStoryTypes();
    if (!usedTypes.includes(adventure.storyType)) {
      usedTypes.push(adventure.storyType);
    }
    if (usedTypes.length >= 4) {
      achievementsToCheck.push("explorer");
    }

    if (adventure.companionPokemonId) {
      achievementsToCheck.push("companion_bond");
    }

    if (allAdventures.length + 1 >= 5) {
      achievementsToCheck.push("story_collector");
    }

    const mainPokemon = pokemon.find((p) => p.id === adventure.pokemonId);
    if (mainPokemon?.is_legendary && adventure.isComplete) {
      achievementsToCheck.push("legend_tamer");
    }

    for (const id of achievementsToCheck) {
      const unlocked = await unlockAchievement(id);
      if (unlocked) {
        toast.custom(() => <AchievementToast achievement={unlocked} />, {
          duration: 4000,
        });
      }
    }
  };

  const handleStartStory = async () => {
    if (!selectedPokemonData) {
      toast.error(t("Please select a Pokémon", "الرجاء اختيار بوكيمون"));
      return;
    }

    setIsGenerating(true);
    try {
      const companionInfo =
        companionPokemonData && heroConfig.companionPokemonId !== "none"
          ? ` with companion ${companionPokemonData.name_en}`
          : "";

      let data: StoryGeneratorResult = {
        story: generateMockPreview(),
        choices: getOfflineChoices(),
      };

      if (hasSupabaseConfig) {
        const { data: generatedData, error } = await supabase.functions.invoke(
          "ai-story-generator",
          {
            body: {
              pokemon: selectedPokemonData,
              storyType: selectedStoryType,
              language,
              heroName: heroConfig.heroName || undefined,
              region: heroConfig.startingRegion,
              companionInfo,
            },
          },
        );

        if (error) throw error;
        data = generatedData as StoryGeneratorResult;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const newAdventure: SavedAdventure = {
        id: generateAdventureId(),
        heroName: heroConfig.heroName || t("Trainer", "مدرب"),
        pokemonId: selectedPokemonData.id,
        pokemonName: language === "ar" ? selectedPokemonData.name_ar : selectedPokemonData.name_en,
        companionPokemonId: companionPokemonData?.id,
        companionPokemonName: companionPokemonData
          ? language === "ar"
            ? companionPokemonData.name_ar
            : companionPokemonData.name_en
          : undefined,
        storyType: selectedStoryType,
        startingRegion: heroConfig.startingRegion,
        segments: [data.story],
        currentChoices: data.choices || [],
        isComplete: !data.choices || data.choices.length === 0,
        points: POINTS_PER_CHOICE,
        achievements: [],
        choicesMade: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setCurrentAdventure(newAdventure);
      await checkAchievements(newAdventure);
      toast.success(t("Story started!", "بدأت القصة!"));
    } catch (error) {
      console.error("Story generation error:", error);
      toast.error(t("Failed to start story", "فشل في بدء القصة"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChoice = async (choice: string) => {
    if (!selectedPokemonData || !currentAdventure) return;

    setIsGenerating(true);
    try {
      let data: StoryGeneratorResult = {
        story: generateOfflineContinuation(choice),
        choices: currentAdventure.choicesMade >= 2 ? [] : getOfflineChoices(),
      };

      if (hasSupabaseConfig) {
        const { data: generatedData, error } = await supabase.functions.invoke(
          "ai-story-generator",
          {
            body: {
              pokemon: selectedPokemonData,
              storyType: selectedStoryType,
              previousStory: currentAdventure.segments[currentAdventure.segments.length - 1],
              choice,
              language,
              heroName: currentAdventure.heroName,
            },
          },
        );

        if (error) throw error;
        data = generatedData as StoryGeneratorResult;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const isComplete = !data.choices || data.choices.length === 0;
      const updatedAdventure: SavedAdventure = {
        ...currentAdventure,
        segments: [...currentAdventure.segments, data.story],
        currentChoices: data.choices || [],
        isComplete,
        points:
          currentAdventure.points + POINTS_PER_CHOICE + (isComplete ? POINTS_FOR_COMPLETION : 0),
        choicesMade: currentAdventure.choicesMade + 1,
        updatedAt: Date.now(),
      };

      setCurrentAdventure(updatedAdventure);

      if (isComplete) {
        await checkAchievements(updatedAdventure);
      }
    } catch (error) {
      console.error("Story continuation error:", error);
      toast.error(t("Failed to continue story", "فشل في متابعة القصة"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAdventure = async () => {
    if (!currentAdventure) return;

    try {
      await saveAdventure(currentAdventure);
      toast.success(t("Adventure saved!", "تم حفظ المغامرة!"));
    } catch (error) {
      toast.error(t("Failed to save", "فشل في الحفظ"));
    }
  };

  const handleResumeAdventure = (adventure: SavedAdventure) => {
    setCurrentAdventure(adventure);
    setHeroConfig({
      heroName: adventure.heroName,
      mainPokemonId: adventure.pokemonId.toString(),
      companionPokemonId: adventure.companionPokemonId?.toString() || "none",
      startingRegion: adventure.startingRegion,
    });
    setSelectedStoryType(adventure.storyType);
  };

  const handleRestart = () => {
    setCurrentAdventure(null);
  };

  const getStoryTypeLabel = (value: string) => {
    const type = storyTypes.find((t) => t.value === value);
    return type ? (language === "ar" ? type.labelAr : type.labelEn) : value;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header with narrative intro */}
        <div className="text-center space-y-3 pb-2">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">{t("Adventure Stories", "قصص المغامرات")}</h1>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t(
              "Choose your hero, set the journey, and let the story react to your choices.",
              "اختر بطلك، وحدد رحلته، ودع القصة تتشكل حسب قراراتك.",
            )}
          </p>
        </div>

        {!currentAdventure ? (
          /* Story Setup */
          <Card className="max-w-lg mx-auto border-primary/10 bg-gradient-to-b from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "new" | "saved")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new" className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    {t("New Adventure", "مغامرة جديدة")}
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4" />
                    {t("Incomplete Adventures", "مغامرات غير مكتملة")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeTab === "new" ? (
                <>
                  {/* Suggest Adventure Button */}
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={suggestAdventure}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {t("Suggest a Quick Adventure", "اقترح مغامرة سريعة")}
                  </Button>

                  {/* Hero Customizer */}
                  <HeroCustomizer
                    config={heroConfig}
                    onChange={setHeroConfig}
                    pokemonList={pokemon}
                  />

                  {/* Story Type with enhanced cards */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{t("Story Type", "نوع القصة")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {storyTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setSelectedStoryType(type.value)}
                          className={`relative p-4 rounded-lg border text-start transition-all focus-visible:ring-2 focus-visible:ring-primary ${
                            selectedStoryType === type.value
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-card hover:bg-muted/50 border-border"
                          }`}
                        >
                          {type.recommended && (
                            <Badge
                              variant="secondary"
                              className={`absolute -top-2 ${language === "ar" ? "-left-1" : "-right-1"} text-[10px] px-1.5`}
                            >
                              {t("Beginner Friendly", "مناسب للمبتدئين")}
                            </Badge>
                          )}
                          <span className="font-semibold block">
                            {language === "ar" ? type.labelAr : type.labelEn}
                          </span>
                          <span
                            className={`text-xs block mt-1 ${selectedStoryType === type.value ? "opacity-80" : "text-muted-foreground"}`}
                          >
                            {t(type.descEn, type.descAr)}
                          </span>
                          <div
                            className={`flex items-center gap-3 mt-2 text-[10px] ${selectedStoryType === type.value ? "opacity-70" : "text-muted-foreground"}`}
                          >
                            <span className="flex items-center gap-1">
                              {Array.from({ length: type.lengthLevel }).map((_, i) => (
                                <Clock key={i} className="w-3 h-3" />
                              ))}
                            </span>
                            <span className="flex items-center gap-1">
                              {Array.from({ length: type.difficultyLevel }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview and Start Buttons */}
                  <div className="space-y-3">
                    {heroConfig.mainPokemonId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowPreview(true)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t("Preview Opening", "معاينة البداية")}
                      </Button>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleStartStory}
                      disabled={isGenerating || !heroConfig.mainPokemonId}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {t("Creating Story...", "جاري إنشاء القصة...")}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          {t("Begin Adventure", "ابدأ المغامرة")}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <SavedAdventures onResume={handleResumeAdventure} />
              )}
            </CardContent>
          </Card>
        ) : (
          /* Story Display */
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Progress Card */}
            <Card>
              <CardContent className="py-4">
                <AdventureProgress
                  points={currentAdventure.points}
                  choicesMade={currentAdventure.choicesMade}
                  achievements={currentAdventure.achievements}
                  isComplete={currentAdventure.isComplete}
                />
              </CardContent>
            </Card>

            {/* Pokemon Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getPokemonSprite(currentAdventure.pokemonId)}
                  alt={currentAdventure.pokemonName}
                  className="w-12 h-12"
                />
                {currentAdventure.companionPokemonId && (
                  <img
                    src={getPokemonSprite(currentAdventure.companionPokemonId)}
                    alt=""
                    className="w-10 h-10 -ml-4 opacity-80"
                  />
                )}
                <div>
                  <p className="font-bold">{currentAdventure.heroName}</p>
                  <p className="text-xs text-muted-foreground">
                    {getStoryTypeLabel(currentAdventure.storyType)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveAdventure}>
                  <Save className="w-4 h-4 mr-1" />
                  {t("Save", "حفظ")}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRestart}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  {t("New", "جديد")}
                </Button>
              </div>
            </div>

            {/* Story Content */}
            <Card>
              <CardContent className="py-6">
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-6 px-1">
                    {currentAdventure.segments.map((segment, idx) => (
                      <div key={idx} className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed">{segment}</p>
                        {idx < currentAdventure.segments.length - 1 && (
                          <hr className="my-4 border-border" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Choices */}
            {!currentAdventure.isComplete && currentAdventure.currentChoices.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-center text-muted-foreground">
                  {t("What will you do?", "ماذا ستفعل؟")}
                </p>
                <div className="space-y-2">
                  {currentAdventure.currentChoices.map((choice, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 px-4 text-start"
                      onClick={() => handleChoice(choice)}
                      disabled={isGenerating}
                    >
                      <ArrowRight className="w-4 h-4 mr-2 shrink-0" />
                      <span>{choice}</span>
                    </Button>
                  ))}
                </div>
                {isGenerating && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t("Continuing story...", "جاري المتابعة...")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Story Complete */}
            {currentAdventure.isComplete && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-4 text-center space-y-3">
                  <p className="font-medium">{t("The End", "النهاية")} ✨</p>
                  <p className="text-sm text-muted-foreground">
                    {t("Your adventure has concluded!", "انتهت مغامرتك!")}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold">
                      {currentAdventure.points} {t("points", "نقطة")}
                    </span>
                  </div>
                  <Button onClick={handleSaveAdventure} variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-1" />
                    {t("Save to Collection", "حفظ في المجموعة")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {t("Preview Opening", "معاينة البداية")}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-muted/50 rounded-lg border-s-4 border-primary italic leading-relaxed">
              {generateMockPreview()}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t(
                "This is an approximate preview. The actual story will be more detailed.",
                "هذه معاينة تقريبية. القصة الفعلية ستكون أكثر تفصيلاً.",
              )}
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
