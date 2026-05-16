import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/original/integrations/supabase/client";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Layout } from "@/original/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Input } from "@/original/components/ui/input";
import { Label } from "@/original/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/original/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/original/components/ui/tabs";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { Palette, Sparkles, Download, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { getPokemonSprite } from "@/original/services/pokeApiService";

interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  pokemonName?: string;
  createdAt: number;
}

const STORAGE_KEY = "pokemon-generated-art";

const artStyles = [
  { value: "anime", labelEn: "Anime", labelAr: "أنمي" },
  { value: "realistic", labelEn: "Realistic", labelAr: "واقعي" },
  { value: "cartoon", labelEn: "Cartoon", labelAr: "كرتوني" },
  { value: "pixel", labelEn: "Pixel Art", labelAr: "بيكسل آرت" },
  { value: "watercolor", labelEn: "Watercolor", labelAr: "ألوان مائية" },
  { value: "cyberpunk", labelEn: "Cyberpunk", labelAr: "سايبربانك" },
];

export default function AIArtPage() {
  const { t, language } = useLanguage();
  const [selectedPokemon, setSelectedPokemon] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("anime");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const { data: pokemon = [] } = useQuery({
    queryKey: ["pokemon-art-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pokemon")
        .select("id, name_en, name_ar")
        .order("id")
        .limit(151);
      if (error) throw error;
      return data || [];
    },
  });

  const selectedPokemonData = pokemon.find((p) => p.id.toString() === selectedPokemon);

  const handleGenerate = async () => {
    if (!selectedPokemon && !customPrompt.trim()) {
      toast.error(
        t("Please select a Pokémon or enter a custom prompt", "الرجاء اختيار بوكيمون أو كتابة وصف"),
      );
      return;
    }

    setIsGenerating(true);
    try {
      const pokemonName = selectedPokemonData
        ? language === "ar"
          ? selectedPokemonData.name_ar
          : selectedPokemonData.name_en
        : undefined;

      const { data, error } = await supabase.functions.invoke("ai-image-generator", {
        body: {
          prompt: customPrompt || "",
          style: selectedStyle,
          pokemonName,
        },
      });

      if (error) throw error;
      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast.error(t("Too many requests. Please wait a moment.", "طلبات كثيرة. انتظر لحظة."));
        } else if (data.error.includes("Credits")) {
          toast.error(t("Credits exhausted. Please add more.", "نفدت الرصيد. أضف المزيد."));
        } else {
          throw new Error(data.error);
        }
        return;
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        imageUrl: data.imageUrl,
        prompt: customPrompt || pokemonName || "",
        style: selectedStyle,
        pokemonName,
        createdAt: Date.now(),
      };

      const updated = [newImage, ...generatedImages].slice(0, 20); // Keep last 20
      setGeneratedImages(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      toast.success(t("Image generated!", "تم إنشاء الصورة!"));
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(t("Failed to generate image", "فشل في إنشاء الصورة"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const link = document.createElement("a");
      link.href = image.imageUrl;
      link.download = `pokemon-art-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t("Image downloaded!", "تم تحميل الصورة!"));
    } catch {
      toast.error(t("Download failed", "فشل التحميل"));
    }
  };

  const handleDelete = (id: string) => {
    const updated = generatedImages.filter((img) => img.id !== id);
    setGeneratedImages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(t("Image deleted", "تم حذف الصورة"));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Palette className="w-7 h-7 text-primary" />
            {t("AI Art Generator", "مولد الفن بالذكاء الاصطناعي")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "Create unique Pokémon artwork with AI",
              "أنشئ أعمالًا فنية فريدة للبوكيمون بالذكاء الاصطناعي",
            )}
          </p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="generate">
              <Sparkles className="w-4 h-4 mr-1" />
              {t("Generate", "إنشاء")}
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <ImageIcon className="w-4 h-4 mr-1" />
              {t("Gallery", "المعرض")} ({generatedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Generator Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("Create New Art", "إنشاء فن جديد")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pokemon Selector */}
                  <div className="space-y-2">
                    <Label>{t("Select Pokémon", "اختر بوكيمون")}</Label>
                    <Select value={selectedPokemon} onValueChange={setSelectedPokemon}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Choose a Pokémon...", "اختر بوكيمون...")} />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {pokemon.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              #{p.id} - {language === "ar" ? p.name_ar : p.name_en}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Pokemon Preview */}
                  {selectedPokemonData && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <img
                        src={getPokemonSprite(selectedPokemonData.id)}
                        alt={selectedPokemonData.name_en}
                        className="w-16 h-16"
                      />
                      <div>
                        <p className="font-medium">
                          {language === "ar"
                            ? selectedPokemonData.name_ar
                            : selectedPokemonData.name_en}
                        </p>
                        <p className="text-sm text-muted-foreground">#{selectedPokemonData.id}</p>
                      </div>
                    </div>
                  )}

                  {/* Custom Prompt */}
                  <div className="space-y-2">
                    <Label>{t("Custom Description (optional)", "وصف مخصص (اختياري)")}</Label>
                    <Input
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={t(
                        "e.g., flying in a sunset sky...",
                        "مثال: يطير في سماء الغروب...",
                      )}
                    />
                  </div>

                  {/* Style Selector */}
                  <div className="space-y-2">
                    <Label>{t("Art Style", "نمط الفن")}</Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {artStyles.map((style) => (
                          <SelectItem key={style.value} value={style.value}>
                            {language === "ar" ? style.labelAr : style.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Generate Button */}
                  <Button
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={isGenerating || (!selectedPokemon && !customPrompt.trim())}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("Generating...", "جاري الإنشاء...")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t("Generate Art", "إنشاء الفن")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Latest Generated */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("Latest Creation", "آخر إبداع")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedImages.length > 0 ? (
                    <div className="space-y-4">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={generatedImages[0].imageUrl}
                          alt="Generated art"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDownload(generatedImages[0])}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          {t("Download", "تحميل")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{t("No images yet", "لا توجد صور بعد")}</p>
                        <p className="text-sm">
                          {t("Generate your first artwork!", "أنشئ أول عمل فني!")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            {generatedImages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium mb-2">{t("Your gallery is empty", "معرضك فارغ")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("Generated images will appear here", "ستظهر الصور المولدة هنا")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generatedImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden group">
                    <div className="aspect-square relative">
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => handleDownload(image)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(image.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {image.pokemonName || image.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {
                          artStyles.find((s) => s.value === image.style)?.[
                            language === "ar" ? "labelAr" : "labelEn"
                          ]
                        }
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
