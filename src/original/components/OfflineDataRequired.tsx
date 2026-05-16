import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { WifiOff, Download, RefreshCw, AlertCircle } from "lucide-react";

interface OfflineDataRequiredProps {
  onRetry?: () => void;
  showDownloadButton?: boolean;
}

export function OfflineDataRequired({
  onRetry,
  showDownloadButton = true,
}: OfflineDataRequiredProps) {
  const { tr, language } = useLanguage();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();

  return (
    <Card className="border-border bg-card max-w-md mx-auto mt-8">
      <CardContent className="p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          {isOnline ? (
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          ) : (
            <WifiOff className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {isOnline
              ? language === "ar"
                ? "لا توجد بيانات"
                : "No Data Available"
              : language === "ar"
                ? "غير متصل بالإنترنت"
                : "You are Offline"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isOnline
              ? language === "ar"
                ? "لا توجد بيانات محمّلة. قم بتحميل الحزمة للاستخدام بدون إنترنت."
                : "No offline data yet. Download the pack to use without internet."
              : language === "ar"
                ? "لا توجد بيانات محمّلة. اتصل بالإنترنت مرة واحدة لتحميل الحزمة."
                : "No offline data yet. Connect once to download the pack."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {isOnline && onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {language === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          )}

          {showDownloadButton && (
            <Button
              variant={isOnline && onRetry ? "outline" : "default"}
              onClick={() => navigate("/settings")}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {language === "ar" ? "تحميل الحزمة الكاملة" : "Download Offline Pack"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
