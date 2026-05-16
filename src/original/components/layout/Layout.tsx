import { ReactNode } from "react";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { OfflineIndicator } from "@/original/components/OfflineIndicator";
import { DownloadProgressBar } from "./DownloadProgressBar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <OfflineIndicator />
      <Header />
      <main className="flex-1 pb-20 overflow-auto">{children}</main>
      <DownloadProgressBar />
      <BottomNav />
    </div>
  );
}
