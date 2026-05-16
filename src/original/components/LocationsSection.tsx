import { MapPin, Trees } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { locations } from "@/original/data/pokemon";

const LocationsSection = () => {
  return (
    <section id="locations" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Trees className="w-12 h-12 text-secondary" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">أماكن الاصطياد</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اكتشف أفضل المواقع للعثور على البوكيمونات النادرة في غالار
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {locations.map((location, index) => (
            <Card
              key={index}
              className="border-2 border-border hover:border-secondary transition-all duration-300 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="w-5 h-5 text-secondary" />
                  <span>{location.name}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{location.nameAr}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{location.description}</p>
                <div>
                  <span className="text-xs font-semibold text-foreground block mb-2">
                    البوكيمونات المتاحة:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {location.pokemon.map((poke) => (
                      <Badge
                        key={poke}
                        variant="secondary"
                        className="bg-secondary text-secondary-foreground"
                      >
                        {poke}
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

export default LocationsSection;
