import { useLanguage } from "@/original/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/original/components/ui/card";
import { Badge } from "@/original/components/ui/badge";
import { Clock, Sun, Moon, CloudRain, Snowflake, CloudSun } from "lucide-react";
import { cn } from "@/original/lib/utils";

interface Encounter {
  time_of_day: string | null;
  weather: string | null;
  pokemon_id: number;
  chance: number | null;
}

interface BestCatchingTimesProps {
  encounters: Encounter[];
}

const timeIcons: Record<string, React.ElementType> = {
  day: Sun,
  night: Moon,
  morning: CloudSun,
  evening: CloudSun,
};

const weatherIcons: Record<string, React.ElementType> = {
  rain: CloudRain,
  snow: Snowflake,
  sunny: Sun,
  cloudy: CloudSun,
};

const timeLabels: Record<string, { en: string; ar: string }> = {
  day: { en: "Day", ar: "نهاراً" },
  night: { en: "Night", ar: "ليلاً" },
  morning: { en: "Morning", ar: "صباحاً" },
  evening: { en: "Evening", ar: "مساءً" },
};

const weatherLabels: Record<string, { en: string; ar: string }> = {
  rain: { en: "Rain", ar: "مطر" },
  snow: { en: "Snow", ar: "ثلج" },
  sunny: { en: "Sunny", ar: "مشمس" },
  cloudy: { en: "Cloudy", ar: "غائم" },
  sandstorm: { en: "Sandstorm", ar: "عاصفة رملية" },
  fog: { en: "Fog", ar: "ضباب" },
};

export function BestCatchingTimes({ encounters }: BestCatchingTimesProps) {
  const { language } = useLanguage();

  // Analyze encounters to find best times
  const timeStats: Record<string, number> = {};
  const weatherStats: Record<string, number> = {};

  encounters.forEach((enc) => {
    if (enc.time_of_day) {
      timeStats[enc.time_of_day] = (timeStats[enc.time_of_day] || 0) + 1;
    }
    if (enc.weather) {
      weatherStats[enc.weather] = (weatherStats[enc.weather] || 0) + 1;
    }
  });

  const sortedTimes = Object.entries(timeStats).sort((a, b) => b[1] - a[1]);
  const sortedWeathers = Object.entries(weatherStats).sort((a, b) => b[1] - a[1]);

  const hasTimeData = sortedTimes.length > 0;
  const hasWeatherData = sortedWeathers.length > 0;

  if (!hasTimeData && !hasWeatherData) {
    return (
      <Card className="border-muted/30">
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {language === "ar" ? "البوكيمون متاح في أي وقت" : "Pokémon available any time"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          {language === "ar" ? "أفضل أوقات الصيد" : "Best Catching Times"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Time of Day */}
        {hasTimeData && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {language === "ar" ? "الوقت" : "Time of Day"}
            </p>
            <div className="flex flex-wrap gap-2">
              {sortedTimes.slice(0, 3).map(([time, count], idx) => {
                const Icon = timeIcons[time] || Clock;
                const label = timeLabels[time] || { en: time, ar: time };
                return (
                  <Badge
                    key={time}
                    variant="outline"
                    className={cn(
                      "gap-1",
                      idx === 0 ? "bg-accent/20 border-accent/40" : "bg-muted/30",
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {language === "ar" ? label.ar : label.en}
                    <span className="text-muted-foreground">({count})</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Weather */}
        {hasWeatherData && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {language === "ar" ? "الطقس" : "Weather"}
            </p>
            <div className="flex flex-wrap gap-2">
              {sortedWeathers.slice(0, 3).map(([weather, count], idx) => {
                const Icon = weatherIcons[weather] || CloudSun;
                const label = weatherLabels[weather] || { en: weather, ar: weather };
                return (
                  <Badge
                    key={weather}
                    variant="outline"
                    className={cn(
                      "gap-1",
                      idx === 0 ? "bg-chart-2/20 border-chart-2/40" : "bg-muted/30",
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {language === "ar" ? label.ar : label.en}
                    <span className="text-muted-foreground">({count})</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Tip */}
        <p className="text-xs text-muted-foreground italic mt-2">
          {language === "ar"
            ? "💡 الأرقام تشير لعدد البوكيمون المتاحين في كل وقت"
            : "💡 Numbers show available Pokémon count per condition"}
        </p>
      </CardContent>
    </Card>
  );
}
