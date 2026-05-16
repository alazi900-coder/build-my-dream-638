import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "pokemon-minigames-db";
const DB_VERSION = 1;

export interface MiniGameScore {
  id: string;
  gameType: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  streak: number;
  difficulty: "easy" | "medium" | "hard";
  playedAt: number;
}

export interface MiniGameStats {
  gameType: string;
  totalGames: number;
  highScore: number;
  bestStreak: number;
  totalCorrect: number;
  totalQuestions: number;
  lastPlayed: number;
}

export interface EmulatorPlayStats {
  romId: string;
  totalPlayTime: number;
  sessionsCount: number;
  lastSession: number;
  savesCount: number;
}

export interface Achievement {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  unlockedAt?: number;
  category: "emulator" | "minigame";
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("scores")) {
          const scoresStore = db.createObjectStore("scores", { keyPath: "id" });
          scoresStore.createIndex("gameType", "gameType");
          scoresStore.createIndex("playedAt", "playedAt");
        }

        if (!db.objectStoreNames.contains("stats")) {
          db.createObjectStore("stats", { keyPath: "gameType" });
        }

        if (!db.objectStoreNames.contains("playStats")) {
          db.createObjectStore("playStats", { keyPath: "romId" });
        }

        if (!db.objectStoreNames.contains("achievements")) {
          db.createObjectStore("achievements", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// Mini Game Scores
export async function saveScore(score: Omit<MiniGameScore, "id">): Promise<string> {
  const db = await getDB();
  const id = `score-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const record: MiniGameScore = { id, ...score };
  await db.put("scores", record);

  // Update stats
  await updateStats(score.gameType, score);

  return id;
}

export async function getScores(gameType?: string): Promise<MiniGameScore[]> {
  const db = await getDB();
  const scores = await db.getAll("scores");
  if (gameType) {
    return scores.filter((s) => s.gameType === gameType).sort((a, b) => b.score - a.score);
  }
  return scores.sort((a, b) => b.playedAt - a.playedAt);
}

export async function getHighScore(gameType: string): Promise<number> {
  const db = await getDB();
  const stats = await db.get("stats", gameType);
  return stats?.highScore || 0;
}

// Stats Management
async function updateStats(gameType: string, score: Omit<MiniGameScore, "id">): Promise<void> {
  const db = await getDB();
  const existing = (await db.get("stats", gameType)) as MiniGameStats | undefined;

  const stats: MiniGameStats = {
    gameType,
    totalGames: (existing?.totalGames || 0) + 1,
    highScore: Math.max(existing?.highScore || 0, score.score),
    bestStreak: Math.max(existing?.bestStreak || 0, score.streak),
    totalCorrect: (existing?.totalCorrect || 0) + score.correctAnswers,
    totalQuestions: (existing?.totalQuestions || 0) + score.totalQuestions,
    lastPlayed: Date.now(),
  };

  await db.put("stats", stats);
}

export async function getStats(gameType: string): Promise<MiniGameStats | undefined> {
  const db = await getDB();
  return db.get("stats", gameType);
}

export async function getAllStats(): Promise<MiniGameStats[]> {
  const db = await getDB();
  return db.getAll("stats");
}

// Play Stats for Emulator
export async function savePlayStats(stats: EmulatorPlayStats): Promise<void> {
  const db = await getDB();
  await db.put("playStats", stats);
}

export async function getPlayStats(romId: string): Promise<EmulatorPlayStats | undefined> {
  const db = await getDB();
  return db.get("playStats", romId);
}

export async function updatePlayTime(romId: string, sessionTime: number): Promise<void> {
  const db = await getDB();
  const existing = (await db.get("playStats", romId)) as EmulatorPlayStats | undefined;

  const stats: EmulatorPlayStats = {
    romId,
    totalPlayTime: (existing?.totalPlayTime || 0) + sessionTime,
    sessionsCount: (existing?.sessionsCount || 0) + 1,
    lastSession: Date.now(),
    savesCount: existing?.savesCount || 0,
  };

  await db.put("playStats", stats);
}

export async function incrementSaveCount(romId: string): Promise<void> {
  const db = await getDB();
  const existing = (await db.get("playStats", romId)) as EmulatorPlayStats | undefined;

  if (existing) {
    existing.savesCount += 1;
    await db.put("playStats", existing);
  }
}

// Achievements
export const ACHIEVEMENTS: Achievement[] = [
  // Emulator Achievements
  {
    id: "first_game",
    name: "First Game",
    nameAr: "أول لعبة",
    description: "Start your first game",
    descriptionAr: "شغّل أول لعبة",
    icon: "🎮",
    category: "emulator",
  },
  {
    id: "save_master",
    name: "Save Master",
    nameAr: "خبير الحفظ",
    description: "Save 10 times",
    descriptionAr: "احفظ 10 مرات",
    icon: "💾",
    category: "emulator",
  },
  {
    id: "marathon",
    name: "Marathon",
    nameAr: "ماراثون",
    description: "Play for 5 hours",
    descriptionAr: "العب 5 ساعات",
    icon: "⏰",
    category: "emulator",
  },
  {
    id: "collector",
    name: "Collector",
    nameAr: "جامع",
    description: "Add 5 games",
    descriptionAr: "أضف 5 ألعاب",
    icon: "📚",
    category: "emulator",
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    nameAr: "شيطان السرعة",
    description: "Use 4x speed",
    descriptionAr: "استخدم 4x سرعة",
    icon: "⚡",
    category: "emulator",
  },

  // Mini Game Achievements
  {
    id: "first_minigame",
    name: "Beginner",
    nameAr: "المبتدئ",
    description: "Complete first mini game",
    descriptionAr: "أكمل أول لعبة صغيرة",
    icon: "⭐",
    category: "minigame",
  },
  {
    id: "type_expert",
    name: "Type Expert",
    nameAr: "خبير الأنواع",
    description: "Get 100% in Type Quiz",
    descriptionAr: "100% في اختبار الأنواع",
    icon: "🔥",
    category: "minigame",
  },
  {
    id: "eagle_eye",
    name: "Eagle Eye",
    nameAr: "عين الصقر",
    description: "10 correct streak",
    descriptionAr: "10 سلسلة صحيحة",
    icon: "👁️",
    category: "minigame",
  },
  {
    id: "lightning_fast",
    name: "Lightning Fast",
    nameAr: "سريع البرق",
    description: "30 correct in Speed Run",
    descriptionAr: "30 صحيحة في سباق السرعة",
    icon: "⚡",
    category: "minigame",
  },
  {
    id: "hearing_master",
    name: "Hearing Master",
    nameAr: "ماستر السمع",
    description: "20 correct in Sound Match",
    descriptionAr: "20 صحيحة في الأصوات",
    icon: "👂",
    category: "minigame",
  },
  {
    id: "silhouette_expert",
    name: "Silhouette Expert",
    nameAr: "خبير الظلال",
    description: "50 correct in Who's That",
    descriptionAr: "50 صحيحة في من هذا",
    icon: "🎭",
    category: "minigame",
  },
  {
    id: "evolution_master",
    name: "Evolution Master",
    nameAr: "خبير التطور",
    description: "Complete 20 evolution puzzles",
    descriptionAr: "أكمل 20 لغز تطور",
    icon: "🧩",
    category: "minigame",
  },
];

export async function unlockAchievement(achievementId: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get("achievements", achievementId);

  if (!existing) {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (achievement) {
      await db.put("achievements", { ...achievement, unlockedAt: Date.now() });
      return true;
    }
  }
  return false;
}

export async function getUnlockedAchievements(): Promise<Achievement[]> {
  const db = await getDB();
  return db.getAll("achievements");
}

export async function checkAndUnlockAchievements(context: {
  totalGames?: number;
  totalSaves?: number;
  totalPlayTime?: number;
  romsCount?: number;
  usedSpeed4x?: boolean;
  streak?: number;
  gameType?: string;
  score?: number;
  correctAnswers?: number;
}): Promise<string[]> {
  const unlocked: string[] = [];

  if (context.totalGames === 1) {
    if (await unlockAchievement("first_minigame")) unlocked.push("first_minigame");
  }

  if (context.romsCount && context.romsCount >= 1) {
    if (await unlockAchievement("first_game")) unlocked.push("first_game");
  }

  if (context.totalSaves && context.totalSaves >= 10) {
    if (await unlockAchievement("save_master")) unlocked.push("save_master");
  }

  if (context.totalPlayTime && context.totalPlayTime >= 5 * 60 * 60) {
    if (await unlockAchievement("marathon")) unlocked.push("marathon");
  }

  if (context.romsCount && context.romsCount >= 5) {
    if (await unlockAchievement("collector")) unlocked.push("collector");
  }

  if (context.usedSpeed4x) {
    if (await unlockAchievement("speed_demon")) unlocked.push("speed_demon");
  }

  if (context.streak && context.streak >= 10) {
    if (await unlockAchievement("eagle_eye")) unlocked.push("eagle_eye");
  }

  if (context.gameType === "type-quiz" && context.score === 100) {
    if (await unlockAchievement("type_expert")) unlocked.push("type_expert");
  }

  if (context.gameType === "speed-run" && context.correctAnswers && context.correctAnswers >= 30) {
    if (await unlockAchievement("lightning_fast")) unlocked.push("lightning_fast");
  }

  if (
    context.gameType === "sound-match" &&
    context.correctAnswers &&
    context.correctAnswers >= 20
  ) {
    if (await unlockAchievement("hearing_master")) unlocked.push("hearing_master");
  }

  return unlocked;
}

export async function clearAllMiniGameData(): Promise<void> {
  const db = await getDB();
  await db.clear("scores");
  await db.clear("stats");
  await db.clear("achievements");
}
