/**
 * Client-safe leaderboard utilities
 */

/**
 * Get rank badge emoji
 */
export function getRankBadge(rank: number): string {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "";
  }
}
