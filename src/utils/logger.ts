import { isAxiosError } from "axios";

type Level = "debug" | "info" | "warn" | "error";

export function describeError(error: unknown): string {
  if (isAxiosError(error)) {
    const method = error.config?.method?.toUpperCase() ?? "";
    const url = error.config?.url ?? "";
    const status = error.response?.status ?? "no response";
    const data = error.response?.data as
      | { code?: string; message?: string }
      | undefined;
    const detail = data?.code ?? data?.message ?? error.message;
    return `${method} ${url} -> ${status} (${detail})`;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

function write(level: Level, message: string, error?: unknown) {
  if (!__DEV__ && (level === "debug" || level === "info")) return;

  const line =
    error === undefined ? message : `${message}: ${describeError(error)}`;
  console[level](`[${level.toUpperCase()}] ${line}`);
}

export const logger = {
  debug: (message: string, error?: unknown) => write("debug", message, error),
  info: (message: string, error?: unknown) => write("info", message, error),
  warn: (message: string, error?: unknown) => write("warn", message, error),
  error: (message: string, error?: unknown) => write("error", message, error),
};
