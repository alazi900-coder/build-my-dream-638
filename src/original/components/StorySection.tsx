import { BookOpen, ChevronRight } from "lucide-react";
import { gameStory } from "@/original/data/pokemon";

const StorySection = () => {
  return (
    <section id="story" className="py-20 bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">{gameStory.title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            انغمس في عالم غالار المذهل واكتشف أسراره
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {gameStory.chapters.map((chapter, index) => (
            <div
              key={index}
              className="group bg-card border-2 border-border hover:border-primary p-6 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                    {chapter.title}
                    <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{chapter.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StorySection;
