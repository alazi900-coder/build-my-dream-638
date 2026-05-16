import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/original/components/ui/toaster";
import { Toaster as Sonner } from "@/original/components/ui/sonner";
import { TooltipProvider } from "@/original/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/original/contexts/LanguageContext";
import { GameFilterProvider } from "@/original/contexts/GameFilterContext";
import { DownloadProvider } from "@/original/contexts/DownloadContext";
import { ThemeCustomizationProvider } from "@/original/contexts/ThemeCustomizationContext";
import { SectionSpeechHandler } from "@/original/components/SectionSpeechHandler";
import { PageLoading, DetailPageLoading } from "@/original/components/ui/page-loading";
import "@/original/App.css";
import "@/original/styles/battle-animations.css";
import "@/original/styles/item-animations.css";
import "@/original/styles/move-animations.css";

// Lazy load all pages for better performance
const DexPage = lazy(() => import("./pages/DexPage"));
const PokemonDetailPage = lazy(() => import("./pages/PokemonDetailPage"));
const MovesPage = lazy(() => import("./pages/MovesPage"));
const ItemsPage = lazy(() => import("./pages/ItemsPage"));
const ItemDetailPage = lazy(() => import("./pages/ItemDetailPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const GymsPage = lazy(() => import("./pages/GymsPage"));
const GymDetailPage = lazy(() => import("./pages/GymDetailPage"));
const NPCsPage = lazy(() => import("./pages/NPCsPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const TeamBuilderPage = lazy(() => import("./pages/TeamBuilderPage"));
const BattlePage = lazy(() => import("./pages/BattlePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AICoachPage = lazy(() => import("./pages/AICoachPage"));
const AIArtPage = lazy(() => import("./pages/AIArtPage"));
const ChatGPTPage = lazy(() => import("./pages/ChatGPTPage"));
const AdventureStoryPage = lazy(() => import("./pages/AdventureStoryPage"));
const ExplorationDashboardPage = lazy(() => import("./pages/ExplorationDashboardPage"));
const MiniGamesPage = lazy(() => import("./pages/MiniGamesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("light", "dark", "system");
    document.documentElement.classList.add(savedTheme);
  }, []);

  return (
    <LanguageProvider>
      <ThemeCustomizationProvider>
        <GameFilterProvider>
          <DownloadProvider>
            <TooltipProvider>
              <div>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <SectionSpeechHandler />
                  <Routes>
                    {/* Main list pages */}
                    <Route
                      path="/"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <DexPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/moves"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <MovesPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/items"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <ItemsPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/map"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <MapPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/gyms"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <GymsPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/npcs"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <NPCsPage />
                        </Suspense>
                      }
                    />

                    {/* Detail pages */}
                    <Route
                      path="/pokemon/:id"
                      element={
                        <Suspense fallback={<DetailPageLoading />}>
                          <PokemonDetailPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/items/:id"
                      element={
                        <Suspense fallback={<DetailPageLoading />}>
                          <ItemDetailPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/gyms/:id"
                      element={
                        <Suspense fallback={<DetailPageLoading />}>
                          <GymDetailPage />
                        </Suspense>
                      }
                    />

                    {/* Tools pages */}
                    <Route
                      path="/compare"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <ComparePage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/team-builder"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <TeamBuilderPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/battle"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <BattlePage />
                        </Suspense>
                      }
                    />

                    {/* AI pages */}
                    <Route
                      path="/coach"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <AICoachPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/chatgpt"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <ChatGPTPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/art"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <AIArtPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/story"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <AdventureStoryPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/explore"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <ExplorationDashboardPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/minigames"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <MiniGamesPage />
                        </Suspense>
                      }
                    />

                    {/* Settings & Admin */}
                    <Route
                      path="/settings"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <SettingsPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <AdminPage />
                        </Suspense>
                      }
                    />

                    {/* 404 */}
                    <Route
                      path="*"
                      element={
                        <Suspense fallback={<PageLoading />}>
                          <NotFound />
                        </Suspense>
                      }
                    />
                  </Routes>
                </BrowserRouter>
              </div>
            </TooltipProvider>
          </DownloadProvider>
        </GameFilterProvider>
      </ThemeCustomizationProvider>
    </LanguageProvider>
  );
};

export default App;
