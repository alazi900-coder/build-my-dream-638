import { createContext, useContext, useState, ReactNode } from "react";

export interface OverallProgress {
  currentPhase: "tables" | "images" | "sounds";
  phaseName: string;
  phaseNameAr: string;
  completedPhases: number;
  totalPhases: number;
  currentItemDone: number;
  currentItemTotal: number;
  overallPercentage: number;
}

interface DownloadProgress {
  isActive: boolean;
  section: string;
  done: number;
  total: number;
  overallProgress?: OverallProgress;
}

interface DownloadContextType {
  progress: DownloadProgress;
  setProgress: (progress: DownloadProgress) => void;
  lastSyncTime: Date | null;
  setLastSyncTime: (time: Date | null) => void;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<DownloadProgress>({
    isActive: false,
    section: "",
    done: 0,
    total: 0,
  });

  // Try to load last sync time from localStorage
  const [lastSyncTime, setLastSyncTimeState] = useState<Date | null>(() => {
    const stored = localStorage.getItem("lastSyncTime");
    return stored ? new Date(stored) : null;
  });

  const setLastSyncTime = (time: Date | null) => {
    setLastSyncTimeState(time);
    if (time) {
      localStorage.setItem("lastSyncTime", time.toISOString());
    } else {
      localStorage.removeItem("lastSyncTime");
    }
  };

  return (
    <DownloadContext.Provider value={{ progress, setProgress, lastSyncTime, setLastSyncTime }}>
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return context;
}
