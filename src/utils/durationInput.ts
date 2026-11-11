export function formatDurationInput(totalSeconds: number): string {
  if (!totalSeconds) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function sanitizeDuration(text: string): string {
  const cleaned = text.replace(/[^0-9:]/g, "");
  const firstColon = cleaned.indexOf(":");
  if (firstColon === -1) return cleaned;
  return (
    cleaned.slice(0, firstColon + 1) +
    cleaned.slice(firstColon + 1).replace(/:/g, "")
  );
}

export function parseDurationInput(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return 0;

  if (!trimmed.includes(":")) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) ? seconds : null;
  }

  const [minutesText, secondsText] = trimmed.split(":");
  const minutes = Number(minutesText || "0");
  const seconds = Number(secondsText || "0");
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) {
    return null;
  }
  return minutes * 60 + seconds;
}
