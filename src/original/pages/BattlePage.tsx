import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/original/contexts/LanguageContext";
import { useGameFilter } from "@/original/contexts/GameFilterContext";
import { useOfflineData } from "@/original/hooks/useOfflineData";
import { useOnlineStatus } from "@/original/hooks/useOnlineStatus";
import { useBattleStats } from "@/original/hooks/useBattleStats";
import { useBattleProgress } from "@/original/hooks/useBattleProgress";
import { Layout } from "@/original/components/layout/Layout";
import { PageHeader } from "@/original/components/layout/PageHeader";
import { Card, CardContent } from "@/original/components/ui/card";
import { Button } from "@/original/components/ui/button";
import { Badge } from "@/original/components/ui/badge";
import { Progress } from "@/original/components/ui/progress";
import { ScrollArea } from "@/original/components/ui/scroll-area";
import { TypeBadge } from "@/original/components/ui/type-badge";
import { toast } from "sonner";
import {
  Swords,
  RefreshCw,
  ArrowLeft,
  Trophy,
  Frown,
  ChevronRight,
  Repeat,
  WifiOff,
  AlertCircle,
  Shuffle,
  Users,
  BarChart3,
  Trash2,
  Star,
  Zap,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";
import { cn } from "@/original/lib/utils";
import { getPokemonSprite } from "@/original/services/pokeApiService";
import {
  BattlePokemon,
  BattleMove,
  BattleLogEntry,
  calculateDamage,
  determineTurnOrder,
  createAttackLog,
  createFaintLog,
  BATTLE_LABELS,
  STRUGGLE_MOVE,
} from "@/original/lib/battleUtils";
import { BattleTeamBuilder } from "@/original/components/battle/BattleTeamBuilder";
import { BattleArena } from "@/original/components/battle/BattleArena";
import { BattleLog } from "@/original/components/battle/BattleLog";
import { MoveButton } from "@/original/components/battle/MoveButton";
import { DifficultySelector } from "@/original/components/battle/DifficultySelector";
import { AttackAnimation, AttackType } from "@/original/components/battle/AttackAnimation";
import { Difficulty, aiSelectMoveAdvanced, DIFFICULTY_MULTIPLIERS } from "@/original/lib/battleAI";
import { useBattleSounds } from "@/original/lib/battleSounds";
import {
  StatusState,
  applyStatusEffect,
  updateStatusState,
  createStatus,
  getMoveStatusChance,
  STATUS_INFO,
} from "@/original/lib/statusEffects";
import { StatusEffectIcon } from "@/original/components/battle/StatusEffectIcon";
import { DailyChallenge } from "@/original/components/battle/DailyChallenge";
import { TrainingMode, generateTrainingTips } from "@/original/components/battle/TrainingMode";
import "@/original/styles/battle-animations.css";

// Extended BattlePokemon with status
interface BattlePokemonWithStatus extends BattlePokemon {
  status?: StatusState;
}

interface BattleState {
  status: "idle" | "setup" | "battle" | "victory" | "defeat";
  turn: "player" | "enemy";
  playerTeam: BattlePokemonWithStatus[];
  enemyTeam: BattlePokemonWithStatus[];
  playerActiveIndex: number;
  enemyActiveIndex: number;
  log: BattleLogEntry[];
}

type BattleMode = "quick" | "custom";

const DEFAULT_STATS = { hp: 100, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 };

const safeNumber = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const safeString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() !== "" ? value : fallback;

const normalizeStatus = (status: StatusState | null | undefined): StatusState | undefined =>
  status ?? undefined;

// Helper function to format relative time
function getTimeAgo(timestamp: number, language: "en" | "ar"): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return language === "ar" ? "الآن" : "Just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return language === "ar" ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return language === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return language === "ar" ? `منذ ${days} يوم` : `${days}d ago`;
  }

  const date = new Date(timestamp);
  return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function BattlePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { selectedGame } = useGameFilter();
  const isOnline = useOnlineStatus();
  const { stats, recordBattle, clearStats, getTopPokemon } = useBattleStats();
  const { progress, recordBattleResult, newAchievements, clearNewAchievements, getLevelInfo } =
    useBattleProgress();

  // Battle sounds
  const {
    playAttack,
    playCritical,
    playSuperEffective,
    playNotEffective,
    playVictory,
    playDefeat,
    startMusic,
    stopMusic,
    isMuted,
    musicEnabled,
    toggleMute,
    toggleMusic,
  } = useBattleSounds();

  // Load data from IndexedDB for offline support
  const { data: pokemon, loading: pokemonLoading } = useOfflineData<any>({ table: "pokemon" });
  const { data: moves, loading: movesLoading } = useOfflineData<any>({ table: "moves" });

  const [format, setFormat] = useState<"1v1" | "3v3" | "6v6">("1v1");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [battleMode, setBattleMode] = useState<BattleMode>("quick");
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [trainingModeEnabled, setTrainingModeEnabled] = useState(true);

  // Animation states
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [enemyAttacking, setEnemyAttacking] = useState(false);

  // Attack animation states
  const [showAttackAnimation, setShowAttackAnimation] = useState(false);
  const [attackAnimationType, setAttackAnimationType] = useState<AttackType>("normal");
  const [attackIsCritical, setAttackIsCritical] = useState(false);
  const [attackEffectiveness, setAttackEffectiveness] = useState(1);
  const [screenShakeActive, setScreenShakeActive] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState<"light" | "normal" | "heavy">("normal");

  // PP tracking
  const [movePP, setMovePP] = useState<Record<string, number>>({});
  const [xpGained, setXpGained] = useState(0);

  const battleRecordedRef = useRef(false);
  const progressRecordedRef = useRef(false);
  const [battleState, setBattleState] = useState<BattleState>({
    status: "idle",
    turn: "player",
    playerTeam: [],
    enemyTeam: [],
    playerActiveIndex: 0,
    enemyActiveIndex: 0,
    log: [],
  });

  const isLoading = pokemonLoading || movesLoading;
  const safePokemon = Array.isArray(pokemon) ? pokemon : [];
  const safeMoves = Array.isArray(moves) ? moves : [];
  const hasData = safePokemon.length > 0 && safeMoves.length > 0;
  const canBattle = hasData;

  // Generate training tips based on current battle state
  const trainingTips = useMemo(() => {
    if (battleState.status !== "battle") return [];

    const playerActive = battleState.playerTeam[battleState.playerActiveIndex];
    const enemyActive = battleState.enemyTeam[battleState.enemyActiveIndex];

    if (!playerActive || !enemyActive) return [];

    return generateTrainingTips({
      playerTypes: playerActive.types.length > 0 ? playerActive.types : ["normal"],
      enemyTypes: enemyActive.types.length > 0 ? enemyActive.types : ["normal"],
      playerHpPercent: (playerActive.currentHp / Math.max(1, playerActive.maxHp)) * 100,
      enemyHpPercent: (enemyActive.currentHp / Math.max(1, enemyActive.maxHp)) * 100,
      availableMoveTypes: playerActive.moves.map((m) => m.type || "normal"),
    });
  }, [
    battleState.status,
    battleState.playerTeam,
    battleState.enemyTeam,
    battleState.playerActiveIndex,
    battleState.enemyActiveIndex,
  ]);

  // Show achievement toasts
  useEffect(() => {
    if (newAchievements.length > 0) {
      newAchievements.forEach((achievement, index) => {
        setTimeout(() => {
          toast.success(language === "ar" ? "إنجاز جديد!" : "Achievement Unlocked!", {
            description: `${achievement.icon} ${language === "ar" ? achievement.name_ar : achievement.name_en}`,
            duration: 5000,
          });
        }, index * 1000);
      });
      clearNewAchievements();
    }
  }, [newAchievements, language, clearNewAchievements]);

  // Record battle result when status changes to victory/defeat
  useEffect(() => {
    if (
      (battleState.status === "victory" || battleState.status === "defeat") &&
      !battleRecordedRef.current
    ) {
      battleRecordedRef.current = true;
      recordBattle(
        battleState.status === "victory" ? "win" : "loss",
        format,
        battleState.playerTeam.map((p) => ({ id: p.id, name_en: p.name_en, name_ar: p.name_ar })),
        battleState.enemyTeam.map((p) => ({ id: p.id, name_en: p.name_en, name_ar: p.name_ar })),
      );
    }
  }, [battleState.status, format, battleState.playerTeam, battleState.enemyTeam, recordBattle]);

  // Record progress when battle ends
  useEffect(() => {
    if (
      (battleState.status === "victory" || battleState.status === "defeat") &&
      !progressRecordedRef.current
    ) {
      progressRecordedRef.current = true;
      const playerFainted = battleState.playerTeam.filter((p) => p.isFainted).length;
      const won = battleState.status === "victory";

      // Stop battle music and play victory/defeat sound
      stopMusic();
      if (won) {
        playVictory();
      } else {
        playDefeat();
      }

      // Calculate XP locally for display
      const difficultyMultiplier = { easy: 1, normal: 1.5, hard: 2, expert: 3 };
      let calculatedXp = won ? 20 : 5;
      calculatedXp = Math.round(calculatedXp * difficultyMultiplier[difficulty]);
      if (won && progress.currentStreak > 0) {
        calculatedXp += Math.min((progress.currentStreak + 1) * 2, 20);
      }
      setXpGained(calculatedXp);

      recordBattleResult(won, difficulty, turnCount, playerFainted, stats.totalBattles + 1);
    }
  }, [
    battleState.status,
    difficulty,
    turnCount,
    battleState.playerTeam,
    stats.totalBattles,
    recordBattleResult,
    progress.currentStreak,
    stopMusic,
    playVictory,
    playDefeat,
  ]);

  // Create a battle Pokemon from data
  const createBattlePokemon = useCallback((poke: any, selectedMoves: any[]): BattlePokemon => {
    const rawStats = poke?.stats ?? DEFAULT_STATS;
    const pokemonStats = {
      hp: safeNumber(rawStats.hp, DEFAULT_STATS.hp),
      atk: safeNumber(rawStats.atk, DEFAULT_STATS.atk),
      def: safeNumber(rawStats.def, DEFAULT_STATS.def),
      spa: safeNumber(rawStats.spa, DEFAULT_STATS.spa),
      spd: safeNumber(rawStats.spd, DEFAULT_STATS.spd),
      spe: safeNumber(rawStats.spe, DEFAULT_STATS.spe),
    };
    const maxHp = Math.max(50, pokemonStats.hp * 2 + 50);

    const battleMoves = selectedMoves
      .filter(Boolean)
      .slice(0, 4)
      .map((m): BattleMove => {
        const nameEn = safeString(m.name_en, "Tackle");
        return {
          id: safeNumber(m.id, -1),
          name_en: nameEn,
          name_ar: safeString(m.name_ar, nameEn),
          type: safeString(m.type, "normal"),
          power: m.power == null ? null : safeNumber(m.power, 40),
          accuracy: m.accuracy == null ? null : safeNumber(m.accuracy, 100),
          pp: Math.max(1, safeNumber(m.pp, 10)),
          category: safeString(m.category, "physical"),
        };
      });

    if (battleMoves.length === 0) {
      battleMoves.push(STRUGGLE_MOVE as BattleMove);
    }

    // Initialize PP for moves
    const ppMap: Record<string, number> = {};
    const pokemonId = safeNumber(poke?.id, 0);
    battleMoves.forEach((m) => {
      ppMap[`${pokemonId}-${m.id}`] = m.pp;
    });
    setMovePP((prev) => ({ ...prev, ...ppMap }));

    return {
      id: pokemonId,
      name_en: safeString(poke?.name_en, "Unknown"),
      name_ar: safeString(poke?.name_ar, safeString(poke?.name_en, "غير معروف")),
      types: Array.isArray(poke?.types) && poke.types.length > 0 ? poke.types.filter(Boolean) : ["normal"],
      stats: pokemonStats,
      currentHp: maxHp,
      maxHp,
      moves: battleMoves,
      isFainted: false,
    };
  }, []);

  // Generate random team for quick battle
  const generateRandomTeam = useCallback(
    (count: number): BattlePokemon[] => {
      if (safePokemon.length === 0 || safeMoves.length === 0) return [];

      const shuffled = [...safePokemon].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      return selected.map((poke) => {
        const pokeMoves = [...safeMoves].sort(() => Math.random() - 0.5).slice(0, 4);
        return createBattlePokemon(poke, pokeMoves);
      });
    },
    [safePokemon, safeMoves, createBattlePokemon],
  );

  // Start quick battle
  const startQuickBattle = useCallback(() => {
    const teamSize = format === "1v1" ? 1 : format === "3v3" ? 3 : 6;
    const playerTeam = generateRandomTeam(teamSize);
    const enemyTeam = generateRandomTeam(teamSize);

    if (playerTeam.length === 0 || enemyTeam.length === 0) return;

    const firstPlayer = playerTeam[0];
    const firstEnemy = enemyTeam[0];
    if (!firstPlayer || !firstEnemy) return;

    const firstTurn = determineTurnOrder(firstPlayer, firstEnemy);

    battleRecordedRef.current = false;
    progressRecordedRef.current = false;
    setTurnCount(0);
    setXpGained(0);

    // Start battle music
    startMusic();

    setBattleState({
      status: "battle",
      turn: firstTurn,
      playerTeam,
      enemyTeam,
      playerActiveIndex: 0,
      enemyActiveIndex: 0,
      log: [
        {
          messageEn: "Battle started!",
          messageAr: "بدأت المعركة!",
          type: "action",
        },
      ],
    });
  }, [format, generateRandomTeam, startMusic]);

  // Start custom battle with selected team
  const startCustomBattle = useCallback(
    (team: { pokemon: any; moves: any[] }[]) => {
      const playerTeam = team.map((member) => {
        const validMoves = member.moves.filter((m): m is any => m !== null);
        return createBattlePokemon(member.pokemon, validMoves);
      });

      const enemyTeam = generateRandomTeam(team.length);

      if (playerTeam.length === 0 || enemyTeam.length === 0) return;

      const firstPlayer = playerTeam[0];
      const firstEnemy = enemyTeam[0];
      if (!firstPlayer || !firstEnemy) return;

      const firstTurn = determineTurnOrder(firstPlayer, firstEnemy);

      battleRecordedRef.current = false;
      progressRecordedRef.current = false;
      setTurnCount(0);
      setXpGained(0);

      setBattleState({
        status: "battle",
        turn: firstTurn,
        playerTeam,
        enemyTeam,
        playerActiveIndex: 0,
        enemyActiveIndex: 0,
        log: [
          {
            messageEn: "Battle started!",
            messageAr: "بدأت المعركة!",
            type: "action",
          },
        ],
      });

      // Start battle music
      startMusic();
    },
    [createBattlePokemon, generateRandomTeam, startMusic],
  );

  // Enter team setup mode
  const enterTeamSetup = useCallback(() => {
    setBattleState((prev) => ({ ...prev, status: "setup" }));
  }, []);

  // Get active Pokemon
  const playerActive = battleState.playerTeam[battleState.playerActiveIndex];
  const enemyActive = battleState.enemyTeam[battleState.enemyActiveIndex];

  // Execute player move
  const executePlayerMove = useCallback(
    (move: BattleMove) => {
      if (!playerActive || !enemyActive || battleState.status !== "battle") return;

      // Check PP
      const ppKey = `${playerActive.id}-${move.id}`;
      const currentPP = movePP[ppKey] ?? move.pp;
      if (currentPP <= 0) {
        toast.error(language === "ar" ? "لا يوجد PP متبقي!" : "No PP left!");
        return;
      }

      // Apply player's status effects first (burn damage, paralysis check, etc.)
      const playerStatusResult = applyStatusEffect(playerActive, language);

      if (playerStatusResult.message) {
        setBattleState((prev) => ({
          ...prev,
          log: [
            ...prev.log,
            {
              messageEn:
                language === "en" ? playerStatusResult.message! : playerStatusResult.message!,
              messageAr:
                language === "ar" ? playerStatusResult.message! : playerStatusResult.message!,
              type: "damage",
            },
          ],
        }));
      }

      // Apply status damage to player
      if (playerStatusResult.damage > 0) {
        setBattleState((prev) => {
          const updatedTeam = [...prev.playerTeam];
          const active = { ...updatedTeam[prev.playerActiveIndex] };
          active.currentHp = Math.max(0, active.currentHp - playerStatusResult.damage);
          if (active.currentHp === 0) {
            active.isFainted = true;
          }
          updatedTeam[prev.playerActiveIndex] = active;
          return { ...prev, playerTeam: updatedTeam };
        });
      }

      // Check if player can move
      if (!playerStatusResult.canMove) {
        // Update status state and end turn
        setBattleState((prev) => {
          const updatedTeam = [...prev.playerTeam];
          const active = { ...updatedTeam[prev.playerActiveIndex] };
          if (active.status) {
            active.status = updateStatusState(active.status);
          }
          updatedTeam[prev.playerActiveIndex] = active;
          return { ...prev, playerTeam: updatedTeam };
        });
        return;
      }

      // Decrease PP
      setMovePP((prev) => ({ ...prev, [ppKey]: currentPP - 1 }));

      // Calculate damage first to get effectiveness
      const {
        damage: rawDamage,
        effectiveness,
        isCritical,
      } = calculateDamage(playerActive, enemyActive, move);

      // Play attack sound based on move type
      playAttack(move.type);

      // Play critical hit sound
      if (isCritical) {
        setTimeout(() => playCritical(), 150);
      }

      // Play effectiveness sounds
      if (effectiveness >= 2) {
        setTimeout(() => playSuperEffective(), 200);
      } else if (effectiveness < 1 && effectiveness > 0) {
        setTimeout(() => playNotEffective(), 200);
      }

      // Trigger attack animation
      setAttackAnimationType(move.type as AttackType);
      setAttackIsCritical(isCritical || false);
      setAttackEffectiveness(effectiveness);
      setShowAttackAnimation(true);

      // Screen shake based on effectiveness and critical
      if (isCritical || effectiveness >= 2) {
        setShakeIntensity(isCritical ? "heavy" : "normal");
        setScreenShakeActive(true);
        setTimeout(() => setScreenShakeActive(false), 500);
      }

      // Player attack animation
      setPlayerAttacking(true);
      setTimeout(() => setPlayerAttacking(false), 400);

      // Hide attack animation after delay
      setTimeout(() => setShowAttackAnimation(false), 1000);

      // Increment turn
      setTurnCount((prev) => prev + 1);

      setBattleState((prev) => {
        const newLog = [...prev.log];
        let newEnemyTeam = [...prev.enemyTeam];
        let newPlayerTeam = [...prev.playerTeam];
        let newEnemyActiveIndex = prev.enemyActiveIndex;
        let newStatus = prev.status;

        // Apply difficulty multiplier to player damage
        const diffMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];

        // Player attacks - use pre-calculated values
        const damage = Math.round(rawDamage * (1 / diffMultiplier.damageMultiplier));
        newLog.push(
          ...createAttackLog(
            playerActive,
            enemyActive,
            move,
            damage,
            effectiveness,
            language,
            isCritical,
          ),
        );

        // Apply damage with animation
        const updatedEnemy = { ...newEnemyTeam[newEnemyActiveIndex] };
        updatedEnemy.currentHp = Math.max(0, updatedEnemy.currentHp - damage);

        // Check if move can inflict status on enemy
        if (!updatedEnemy.status && updatedEnemy.currentHp > 0) {
          const statusChance = getMoveStatusChance(move.name_en);
          if (statusChance && Math.random() < statusChance.chance) {
            updatedEnemy.status = createStatus(statusChance.effect);
            const statusInfo = STATUS_INFO[statusChance.effect];
            newLog.push({
              messageEn: `${updatedEnemy.name_en} was ${statusInfo.name_en.toLowerCase()}ed!`,
              messageAr: `${updatedEnemy.name_ar} أصيب بـ${statusInfo.name_ar}!`,
              type: "damage",
            });
          }
        }

        // Trigger enemy damaged animation
        setTimeout(() => {
          setEnemyDamaged(true);
          setTimeout(() => setEnemyDamaged(false), 400);
        }, 200);

        if (updatedEnemy.currentHp === 0) {
          updatedEnemy.isFainted = true;
          updatedEnemy.status = undefined; // Clear status on faint
          newLog.push(createFaintLog(updatedEnemy));

          const alivePokemon = newEnemyTeam.filter(
            (p, i) => i !== newEnemyActiveIndex && !p.isFainted,
          );
          if (alivePokemon.length === 0) {
            newStatus = "victory";
            newLog.push({
              messageEn: "You won the battle!",
              messageAr: "فزت بالمعركة!",
              type: "end",
            });
          } else {
            const nextIndex = newEnemyTeam.findIndex(
              (p, i) => i !== newEnemyActiveIndex && !p.isFainted,
            );
            if (nextIndex !== -1) {
              newEnemyActiveIndex = nextIndex;
              newLog.push({
                messageEn: `Enemy sent out ${newEnemyTeam[nextIndex].name_en}!`,
                messageAr: `الخصم أرسل ${newEnemyTeam[nextIndex].name_ar}!`,
                type: "switch",
              });
            }
          }
        } else {
          // Update enemy status state at end of turn
          if (updatedEnemy.status) {
            updatedEnemy.status = updateStatusState(updatedEnemy.status);
          }
        }

        newEnemyTeam[prev.enemyActiveIndex] = updatedEnemy;

        // Enemy turn (if battle not over and enemy alive)
        if (newStatus === "battle" && !newEnemyTeam[newEnemyActiveIndex].isFainted) {
          const enemyPokemon = newEnemyTeam[newEnemyActiveIndex];

          // Apply enemy's status effects first
          const enemyStatusResult = applyStatusEffect(enemyPokemon, language);

          if (enemyStatusResult.message) {
            newLog.push({
              messageEn: language === "en" ? enemyStatusResult.message : enemyStatusResult.message,
              messageAr: language === "ar" ? enemyStatusResult.message : enemyStatusResult.message,
              type: "damage",
            });
          }

          // Apply status damage to enemy
          if (enemyStatusResult.damage > 0) {
            enemyPokemon.currentHp = Math.max(0, enemyPokemon.currentHp - enemyStatusResult.damage);
            if (enemyPokemon.currentHp === 0) {
              enemyPokemon.isFainted = true;
              enemyPokemon.status = undefined;
              newLog.push(createFaintLog(enemyPokemon));
            }
          }

          // Check if enemy can move
          if (enemyStatusResult.canMove && !enemyPokemon.isFainted) {
            // Use advanced AI
            const enemyMove = aiSelectMoveAdvanced(
              enemyPokemon,
              newPlayerTeam[prev.playerActiveIndex],
              difficulty,
            );

            const playerTarget = newPlayerTeam[prev.playerActiveIndex];
            const { damage: rawEnemyDamage, effectiveness: enemyEff } = calculateDamage(
              enemyPokemon,
              playerTarget,
              enemyMove,
            );

            // Apply difficulty multiplier to enemy damage (burn reduces attack)
            let enemyDamage = Math.round(rawEnemyDamage * diffMultiplier.damageMultiplier);
            if (enemyPokemon.status?.effect === "burn" && enemyMove.category === "physical") {
              enemyDamage = Math.round(enemyDamage * 0.5); // Burn halves physical attack
            }

            newLog.push(
              ...createAttackLog(
                enemyPokemon,
                playerTarget,
                enemyMove,
                enemyDamage,
                enemyEff,
                language,
              ),
            );

            // Enemy attack animation
            setTimeout(() => {
              setEnemyAttacking(true);
              setTimeout(() => setEnemyAttacking(false), 400);
            }, 600);

            const updatedPlayer = { ...playerTarget };
            updatedPlayer.currentHp = Math.max(0, updatedPlayer.currentHp - enemyDamage);

            // Check if enemy move can inflict status on player
            if (!updatedPlayer.status && updatedPlayer.currentHp > 0) {
              const statusChance = getMoveStatusChance(enemyMove.name_en);
              if (statusChance && Math.random() < statusChance.chance) {
                updatedPlayer.status = createStatus(statusChance.effect);
                const statusInfo = STATUS_INFO[statusChance.effect];
                newLog.push({
                  messageEn: `${updatedPlayer.name_en} was ${statusInfo.name_en.toLowerCase()}ed!`,
                  messageAr: `${updatedPlayer.name_ar} أصيب بـ${statusInfo.name_ar}!`,
                  type: "damage",
                });
              }
            }

            // Trigger player damaged animation
            setTimeout(() => {
              setPlayerDamaged(true);
              setTimeout(() => setPlayerDamaged(false), 400);
            }, 800);

            if (updatedPlayer.currentHp === 0) {
              updatedPlayer.isFainted = true;
              updatedPlayer.status = undefined; // Clear status on faint
              newLog.push(createFaintLog(updatedPlayer));

              const alivePlayerPokemon = newPlayerTeam.filter(
                (p, i) => i !== prev.playerActiveIndex && !p.isFainted,
              );
              if (alivePlayerPokemon.length === 0) {
                newStatus = "defeat";
                newLog.push({
                  messageEn: "You lost the battle...",
                  messageAr: "خسرت المعركة...",
                  type: "end",
                });
              }
            } else {
              // Update player status state at end of turn
              if (updatedPlayer.status) {
                updatedPlayer.status = updateStatusState(updatedPlayer.status);
              }
            }

            newPlayerTeam[prev.playerActiveIndex] = updatedPlayer;
          }

          // Update enemy status state
          if (enemyPokemon.status) {
            enemyPokemon.status = updateStatusState(enemyPokemon.status);
          }
          newEnemyTeam[newEnemyActiveIndex] = enemyPokemon;
        }

        return {
          ...prev,
          playerTeam: newPlayerTeam,
          enemyTeam: newEnemyTeam,
          enemyActiveIndex: newEnemyActiveIndex,
          log: newLog,
          status: newStatus,
        };
      });
    },
    [
      playerActive,
      enemyActive,
      battleState.status,
      language,
      difficulty,
      movePP,
      playAttack,
      playCritical,
      playSuperEffective,
      playNotEffective,
    ],
  );

  // Switch Pokemon
  const switchPokemon = useCallback(
    (index: number) => {
      if (battleState.playerTeam[index].isFainted) return;

      setBattleState((prev) => ({
        ...prev,
        playerActiveIndex: index,
        log: [
          ...prev.log,
          {
            messageEn: `Go, ${prev.playerTeam[index].name_en}!`,
            messageAr: `اذهب، ${prev.playerTeam[index].name_ar}!`,
            type: "switch",
          },
        ],
      }));
      setShowSwitchModal(false);
    },
    [battleState.playerTeam],
  );

  // Reset battle
  const resetBattle = useCallback(() => {
    stopMusic();
    battleRecordedRef.current = false;
    progressRecordedRef.current = false;
    setTurnCount(0);
    setXpGained(0);
    setMovePP({});
    setBattleState({
      status: "idle",
      turn: "player",
      playerTeam: [],
      enemyTeam: [],
      playerActiveIndex: 0,
      enemyActiveIndex: 0,
      log: [],
    });
  }, [stopMusic]);

  // Check for player needing to switch after faint
  const needsSwitch =
    playerActive?.isFainted &&
    battleState.playerTeam.some((p) => !p.isFainted) &&
    battleState.status === "battle";

  // Check if 6v6 is unlocked
  const is6v6Unlocked = progress.unlockedModes.includes("6v6");

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">
            {t("Loading...", "جاري التحميل...")}
          </div>
        </div>
      </Layout>
    );
  }

  // Offline data not available
  if (!canBattle && !isOnline) {
    return (
      <Layout>
        <div className="p-4 space-y-4">
          <Button variant="ghost" onClick={() => navigate("/team-builder")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("Back to Team Builder", "العودة لبناء الفريق")}
          </Button>

          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <WifiOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-bold mb-2">
                {language === "ar" ? "البيانات غير متوفرة" : "Data Not Available"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {language === "ar"
                  ? BATTLE_LABELS.offlineDataRequired.ar
                  : BATTLE_LABELS.offlineDataRequired.en}
              </p>
              <Button onClick={() => navigate("/settings")}>
                {t("Go to Settings", "اذهب للإعدادات")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const levelInfo = getLevelInfo(progress.level);

  return (
    <Layout>
      <div className="p-3 sm:p-4 space-y-4 max-w-2xl mx-auto">
        {/* Header with Level */}
        <PageHeader
          title={language === "ar" ? BATTLE_LABELS.battle.ar : BATTLE_LABELS.battle.en}
          icon={Swords}
        >
          {/* Sound Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="min-h-[44px] w-9 p-0"
            title={
              isMuted
                ? language === "ar"
                  ? "تشغيل الصوت"
                  : "Unmute"
                : language === "ar"
                  ? "كتم الصوت"
                  : "Mute"
            }
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMusic}
            className={cn("min-h-[44px] w-9 p-0", !musicEnabled && "text-muted-foreground")}
            title={
              musicEnabled
                ? language === "ar"
                  ? "إيقاف الموسيقى"
                  : "Disable Music"
                : language === "ar"
                  ? "تشغيل الموسيقى"
                  : "Enable Music"
            }
          >
            <Music className="w-4 h-4" />
          </Button>

          {/* Level Badge */}
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
            <span className="text-sm">{levelInfo.icon}</span>
            <span className="text-xs font-bold">Lv.{progress.level}</span>
          </div>

          {battleState.status === "idle" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="min-h-[44px]"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          )}
          {battleState.status !== "idle" && (
            <Button variant="ghost" size="sm" onClick={resetBattle} className="min-h-[44px]">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </PageHeader>

        {/* XP Progress Bar (when idle) */}
        {battleState.status === "idle" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{levelInfo.icon}</span>
                  <div>
                    <p className="font-bold text-sm">
                      {language === "ar" ? levelInfo.name_ar : levelInfo.name_en}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("Level", "المستوى")} {progress.level}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">
                    {progress.xp}/{progress.xpToNextLevel} XP
                  </p>
                  {progress.currentStreak > 0 && (
                    <p className="text-xs text-orange-500 flex items-center gap-1 justify-end">
                      🔥 {progress.currentStreak} {t("streak", "سلسلة")}
                    </p>
                  )}
                </div>
              </div>
              <Progress value={(progress.xp / progress.xpToNextLevel) * 100} className="h-2" />

              {/* Recent Achievements */}
              {progress.achievements.filter((a) => a.unlocked).length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    {t("Achievements:", "الإنجازات:")}
                  </span>
                  {progress.achievements
                    .filter((a) => a.unlocked)
                    .slice(-6)
                    .map((achievement) => (
                      <span
                        key={achievement.id}
                        className="text-lg cursor-help"
                        title={language === "ar" ? achievement.name_ar : achievement.name_en}
                      >
                        {achievement.icon}
                      </span>
                    ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({progress.achievements.filter((a) => a.unlocked).length}/
                    {progress.achievements.length})
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Battle Stats Panel */}
        {showStats && battleState.status === "idle" && (
          <Card className="border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  {t("Battle Statistics", "إحصائيات المعركة")}
                </h2>
                {stats.totalBattles > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearStats}
                    className="text-destructive hover:text-destructive h-8 px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {stats.totalBattles === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t(
                    "No battles yet. Start battling to see your stats!",
                    "لا توجد معارك بعد. ابدأ المعركة لرؤية إحصائياتك!",
                  )}
                </p>
              ) : (
                <>
                  {/* Win/Loss Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-2xl font-bold">{stats.totalBattles}</p>
                      <p className="text-xs text-muted-foreground">{t("Total", "المجموع")}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-500">{stats.wins}</p>
                      <p className="text-xs text-muted-foreground">{t("Wins", "فوز")}</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-3">
                      <p className="text-2xl font-bold text-red-500">{stats.losses}</p>
                      <p className="text-xs text-muted-foreground">{t("Losses", "خسارة")}</p>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("Win Rate", "معدل الفوز")}</span>
                      <span className="font-medium">{stats.winRate}%</span>
                    </div>
                    <Progress value={stats.winRate} className="h-2" />
                  </div>

                  {/* Top Pokemon */}
                  {getTopPokemon(3).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {t("Favorite Pokémon", "البوكيمون المفضل")}
                      </h3>
                      <div className="space-y-1">
                        {getTopPokemon(3).map((poke, i) => (
                          <div
                            key={poke.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                          >
                            <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                            <img
                              src={getPokemonSprite(poke.id)}
                              alt=""
                              className="w-8 h-8"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span className="flex-1 text-sm truncate">
                              {language === "ar" ? poke.name_ar : poke.name_en}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {poke.count} {t("battles", "معارك")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pre-battle: Format & Difficulty Selection */}
        {battleState.status === "idle" && (
          <Card className="border-border">
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold text-center">{t("Battle Mode", "وضع المعركة")}</h2>

              {/* Format Selection */}
              <div className="flex gap-2 justify-center">
                <Button
                  variant={format === "1v1" ? "default" : "outline"}
                  onClick={() => setFormat("1v1")}
                  className="flex-1 max-w-[100px] min-h-[44px]"
                >
                  {BATTLE_LABELS.format1v1[language]}
                </Button>
                <Button
                  variant={format === "3v3" ? "default" : "outline"}
                  onClick={() => setFormat("3v3")}
                  className="flex-1 max-w-[100px] min-h-[44px]"
                >
                  {BATTLE_LABELS.format3v3[language]}
                </Button>
                <Button
                  variant={format === "6v6" ? "default" : "outline"}
                  onClick={() => is6v6Unlocked && setFormat("6v6")}
                  disabled={!is6v6Unlocked}
                  className={cn(
                    "flex-1 max-w-[100px] min-h-[44px]",
                    !is6v6Unlocked && "opacity-50",
                  )}
                >
                  6v6 {!is6v6Unlocked && "🔒"}
                </Button>
              </div>

              {!is6v6Unlocked && (
                <p className="text-xs text-center text-muted-foreground">
                  {language === "ar"
                    ? `افتح 6v6 عند المستوى 5 (حالياً: ${progress.level})`
                    : `Unlock 6v6 at Level 5 (Current: ${progress.level})`}
                </p>
              )}

              {/* Difficulty Selector */}
              <DifficultySelector
                selected={difficulty}
                onSelect={setDifficulty}
                language={language}
              />

              {/* Battle Mode Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={startQuickBattle}
                  className="min-h-[72px] flex-col gap-1"
                  disabled={!canBattle}
                >
                  <Shuffle className="w-6 h-6" />
                  <span className="font-medium">{t("Quick Battle", "معركة سريعة")}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("Random team", "فريق عشوائي")}
                  </span>
                </Button>

                <Button
                  variant="default"
                  onClick={enterTeamSetup}
                  className="min-h-[72px] flex-col gap-1"
                  disabled={!canBattle}
                >
                  <Users className="w-6 h-6" />
                  <span className="font-medium">{t("Custom Team", "فريق مخصص")}</span>
                  <span className="text-[10px] opacity-80">
                    {t("Choose your team", "اختر فريقك")}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Challenge & Training Mode (idle state) */}
        {battleState.status === "idle" && (
          <div className="grid gap-4 md:grid-cols-2">
            <DailyChallenge />
            <TrainingMode
              enabled={trainingModeEnabled}
              onToggle={setTrainingModeEnabled}
              tips={[]}
              playerType={undefined}
              enemyType={undefined}
            />
          </div>
        )}

        {/* Team Setup Mode */}
        {battleState.status === "setup" && (
          <BattleTeamBuilder
            format={format === "6v6" ? "6v6" : format}
            pokemon={pokemon.map((p: any) => ({
              id: p.id,
              name_en: p.name_en,
              name_ar: p.name_ar || p.name_en,
              types: Array.isArray(p.types) ? p.types : ["normal"],
              stats: p.stats,
            }))}
            moves={moves.map((m: any) => ({
              id: m.id,
              name_en: m.name_en,
              name_ar: m.name_ar || m.name_en,
              type: m.type || "normal",
              power: m.power,
              category: m.category || "physical",
            }))}
            onTeamReady={startCustomBattle}
            onCancel={resetBattle}
          />
        )}

        {/* Battle UI */}
        {(battleState.status === "battle" ||
          battleState.status === "victory" ||
          battleState.status === "defeat") && (
          <>
            {/* Battle Result */}
            {(battleState.status === "victory" || battleState.status === "defeat") && (
              <Card
                className={cn(
                  "border-2",
                  battleState.status === "victory"
                    ? "border-green-500 bg-green-500/10 animate-victory"
                    : "border-red-500 bg-red-500/10 animate-defeat",
                )}
              >
                <CardContent className="p-6 text-center">
                  {battleState.status === "victory" ? (
                    <>
                      <Trophy className="w-16 h-16 mx-auto mb-3 text-yellow-500 animate-bounce" />
                      <h2 className="text-2xl font-bold text-green-500">
                        {BATTLE_LABELS.victory[language]}
                      </h2>

                      {/* XP Gained */}
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-bold text-yellow-500 animate-xp-gain">
                          +{xpGained} XP
                        </span>
                      </div>

                      {/* Streak */}
                      {progress.currentStreak > 1 && (
                        <p className="text-orange-500 mt-2 font-medium">
                          🔥 {progress.currentStreak}{" "}
                          {language === "ar" ? "سلسلة فوز!" : "win streak!"}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Frown className="w-16 h-16 mx-auto mb-3 text-red-500" />
                      <h2 className="text-2xl font-bold text-red-500">
                        {BATTLE_LABELS.defeat[language]}
                      </h2>

                      {/* XP Still Gained */}
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5 text-muted-foreground" />
                        <span className="text-lg font-bold text-muted-foreground">
                          +{xpGained} XP
                        </span>
                      </div>
                    </>
                  )}
                  <Button onClick={resetBattle} className="mt-4 min-h-[44px]">
                    {t("Battle Again", "العب مجدداً")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Battle Arena */}
            {battleState.status === "battle" && playerActive && enemyActive && (
              <div
                className={cn(
                  "space-y-3 relative",
                  screenShakeActive &&
                    (shakeIntensity === "heavy"
                      ? "animate-shake-heavy"
                      : shakeIntensity === "light"
                        ? "animate-shake-light"
                        : "animate-shake"),
                )}
              >
                {/* Attack Animation Overlay */}
                <AttackAnimation
                  type={attackAnimationType}
                  isActive={showAttackAnimation}
                  isCritical={attackIsCritical}
                  effectiveness={attackEffectiveness}
                  targetPosition="enemy"
                />

                <BattleArena
                  playerPokemon={playerActive}
                  enemyPokemon={enemyActive}
                  language={language}
                  playerDamaged={playerDamaged}
                  enemyDamaged={enemyDamaged}
                  playerAttacking={playerAttacking}
                  enemyAttacking={enemyAttacking}
                  environmentType={enemyActive.types[0] || "normal"}
                />

                {/* Team indicators for 3v3/6v6 */}
                {format !== "1v1" && (
                  <div className="flex justify-between px-2">
                    <div className="flex gap-1">
                      {battleState.playerTeam.map((p, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-3 h-3 rounded-full transition-all",
                            p.isFainted ? "bg-red-500" : "bg-green-500",
                            i === battleState.playerActiveIndex &&
                              "ring-2 ring-primary ring-offset-1 ring-offset-background",
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {battleState.enemyTeam.map((p, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-3 h-3 rounded-full transition-all",
                            p.isFainted ? "bg-red-500" : "bg-green-500",
                            i === battleState.enemyActiveIndex &&
                              "ring-2 ring-primary ring-offset-1 ring-offset-background",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Move Buttons with PP */}
                {!needsSwitch && (
                  <div className="grid grid-cols-2 gap-2">
                    {playerActive.moves.map((move, i) => {
                      const ppKey = `${playerActive.id}-${move.id}`;
                      const currentPP = movePP[ppKey] ?? move.pp;

                      return (
                        <MoveButton
                          key={i}
                          move={move}
                          defenderTypes={enemyActive.types}
                          language={language}
                          onSelect={executePlayerMove}
                          currentPP={currentPP}
                          maxPP={move.pp}
                          disabled={battleState.status !== "battle" || currentPP <= 0}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Switch Button */}
                {format !== "1v1" && !needsSwitch && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowSwitchModal(true)}
                    className="w-full min-h-[44px]"
                  >
                    <Repeat className="w-4 h-4 mr-2" />
                    {BATTLE_LABELS.switchPokemon[language]}
                  </Button>
                )}

                {/* Force Switch UI */}
                {needsSwitch && (
                  <Card className="border-yellow-500">
                    <CardContent className="p-4">
                      <h3 className="font-bold mb-3 text-center">
                        {t("Choose next Pokémon", "اختر البوكيمون التالي")}
                      </h3>
                      <div className="space-y-2">
                        {battleState.playerTeam.map(
                          (p, i) =>
                            !p.isFainted &&
                            i !== battleState.playerActiveIndex && (
                              <Button
                                key={i}
                                variant="outline"
                                onClick={() => switchPokemon(i)}
                                className="w-full min-h-[48px] justify-start gap-3"
                              >
                                <img
                                  src={getPokemonSprite(p.id)}
                                  alt=""
                                  className="w-8 h-8"
                                  style={{ imageRendering: "pixelated" }}
                                />
                                <span>{language === "ar" ? p.name_ar : p.name_en}</span>
                                <span className="ml-auto text-sm text-muted-foreground">
                                  {p.currentHp}/{p.maxHp} HP
                                </span>
                              </Button>
                            ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Switch Modal */}
                {showSwitchModal && (
                  <Card className="border-primary">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold">{BATTLE_LABELS.switchPokemon[language]}</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowSwitchModal(false)}>
                          ✕
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {battleState.playerTeam.map(
                          (p, i) =>
                            !p.isFainted &&
                            i !== battleState.playerActiveIndex && (
                              <Button
                                key={i}
                                variant="outline"
                                onClick={() => switchPokemon(i)}
                                className="w-full min-h-[48px] justify-start gap-3"
                              >
                                <img
                                  src={getPokemonSprite(p.id)}
                                  alt=""
                                  className="w-8 h-8"
                                  style={{ imageRendering: "pixelated" }}
                                />
                                <span>{language === "ar" ? p.name_ar : p.name_en}</span>
                                <span className="ml-auto text-sm text-muted-foreground">
                                  {p.currentHp}/{p.maxHp} HP
                                </span>
                              </Button>
                            ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Training Mode during battle */}
            {battleState.status === "battle" && (
              <TrainingMode
                enabled={trainingModeEnabled}
                onToggle={setTrainingModeEnabled}
                tips={trainingTips}
                playerType={battleState.playerTeam[battleState.playerActiveIndex]?.types[0]}
                enemyType={battleState.enemyTeam[battleState.enemyActiveIndex]?.types[0]}
              />
            )}

            {/* Battle Log */}
            <BattleLog entries={battleState.log} language={language} maxHeight="180px" />
          </>
        )}
      </div>
    </Layout>
  );
}
