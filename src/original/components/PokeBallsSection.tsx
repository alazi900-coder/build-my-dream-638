import { Circle, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { pokeBalls } from "@/original/data/pokemon";

const PokeBallsSection = () => {
  return (
    <section id="pokeballs" className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Target className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">كرات البوكي</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اكتشف جميع أنواع الكرات وأفضل استخداماتها وأماكن الحصول عليها
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pokeBalls.map((ball, index) => (
            <Card
              key={index}
              className="border-2 border-border hover:border-destructive transition-all duration-300 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <img src={ball.image} alt={ball.name} className="w-12 h-12 object-contain" />
                  <div>
                    <CardTitle className="text-lg text-foreground">{ball.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{ball.nameAr}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-primary" />
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    نسبة الإمساك: {ball.catchRate}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{ball.description}</p>
                <div>
                  <span className="text-xs font-semibold text-foreground block mb-2">
                    أماكن الحصول:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {ball.whereToFind.map((location, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PokeBallsSection;
