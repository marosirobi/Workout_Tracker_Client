import type { TFunction } from "i18next";

export function rankLabel(
  rank: number | null | undefined,
  t: TFunction,
): string | null {
  if (rank === 1) return t("rank.record");
  if (rank === 2) return t("rank.second");
  if (rank === 3) return t("rank.third");
  return null;
}
