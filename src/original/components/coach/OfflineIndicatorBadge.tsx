import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/original/components/ui/badge";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { cn } from "@/original/lib/utils";

interface OfflineIndicatorBadgeProps {
  isOnline: boolean;
}

export const OfflineIndicatorBadge = ({ isOnline }: OfflineIndicatorBadgeProps) => {
  const { language } = useLanguage();

  return (
    <Badge
      variant={isOnline ? "secondary" : "outline"}
      className={cn(
        "flex items-center gap-1 text-xs",
        !isOnline && "bg-muted text-muted-foreground border-dashed",
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>{language === "ar" ? "متصل" : "Online"}</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>{language === "ar" ? "غير متصل" : "Offline"}</span>
        </>
      )}
    </Badge>
  );
};
