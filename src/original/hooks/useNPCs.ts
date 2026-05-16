/**
 * Hook for fetching NPCs with offline-first support
 * Now backed by the centralized data store
 */

import { useNPCsFromStore } from "@/original/hooks/useDataStore";
import { NPC } from "@/original/types/pokemon";

export function useNPCs() {
  const result = useNPCsFromStore();

  // Sort NPCs: gym leaders by badge_order, then others
  const sortedData = [...result.data].sort((a, b) => {
    // Gym leaders first, sorted by badge_order
    if (a.category === "gym_leader" && b.category === "gym_leader") {
      return (a.badge_order || 0) - (b.badge_order || 0);
    }
    if (a.category === "gym_leader") return -1;
    if (b.category === "gym_leader") return 1;

    // Then champions
    if (a.category === "champion") return -1;
    if (b.category === "champion") return 1;

    return 0;
  });

  return {
    data: sortedData as NPC[],
    loading: result.loading,
    error: result.error,
  };
}
