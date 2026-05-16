import { useRef } from "react";
import Navbar from "@/original/components/Navbar";
import HeroSection from "@/original/components/HeroSection";
import PokemonGrid from "@/original/components/PokemonGrid";
import PokeBallsSection from "@/original/components/PokeBallsSection";
import LocationsSection from "@/original/components/LocationsSection";
import StorySection from "@/original/components/StorySection";
import Footer from "@/original/components/Footer";

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const pokemonRef = useRef<HTMLDivElement>(null);
  const pokeballsRef = useRef<HTMLDivElement>(null);
  const locationsRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement>> = {
      hero: heroRef,
      pokemon: pokemonRef,
      pokeballs: pokeballsRef,
      locations: locationsRef,
      story: storyRef,
    };

    const ref = refs[section];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-background" dir="rtl">
      <Navbar onNavigate={scrollToSection} />

      <div ref={heroRef}>
        <HeroSection onNavigate={scrollToSection} />
      </div>

      <div ref={pokemonRef}>
        <PokemonGrid />
      </div>

      <div ref={pokeballsRef}>
        <PokeBallsSection />
      </div>

      <div ref={locationsRef}>
        <LocationsSection />
      </div>

      <div ref={storyRef}>
        <StorySection />
      </div>

      <Footer />
    </main>
  );
};

export default Index;
