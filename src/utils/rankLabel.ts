export function rankLabel(rank: number | null | undefined): string | null {
  if (rank === 1) return "Egyéni rekord";
  if (rank === 2) return "2. legjobb";
  if (rank === 3) return "3. legjobb";
  return null;
}
