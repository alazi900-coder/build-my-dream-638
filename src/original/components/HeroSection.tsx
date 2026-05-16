import { Shield, Sparkles } from "lucide-react";
import { Button } from "@/original/components/ui/button";

interface HeroSectionProps {
  onNavigate: (section: string) => void;
}

const HeroSection = ({ onNavigate }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 bg-accent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-primary-foreground rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="flex justify-center mb-6">
          <Shield className="w-24 h-24 text-accent drop-shadow-lg" strokeWidth={1.5} />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-4 tracking-tight">
          Pokémon Shield
        </h1>

        <p className="text-xl md:text-2xl text-primary-foreground/90 mb-2 font-medium">
          دليلك الشامل للعبة
        </p>

        <p className="text-lg text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
          اكتشف البوكيمونات، أفضل الحركات، أماكن الاصطياد، وقصة اللعبة الكاملة
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 border-2 border-accent-foreground/20 shadow-md font-semibold px-8"
            onClick={() => onNavigate("pokemon")}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            البوكيمونات
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-primary-foreground/10 text-primary-foreground border-2 border-primary-foreground/50 hover:bg-primary-foreground/20 font-semibold px-8"
            onClick={() => onNavigate("story")}
          >
            قصة اللعبة
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
