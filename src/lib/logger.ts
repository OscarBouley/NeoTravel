import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

type LogSource = "ia" | "commercial" | "cron" | "system";

function getLogFilePath(): string {
  const date = new Date().toISOString().slice(0, 10);
  return join(process.cwd(), "LOGS", `${date}.log`);
}

function isFileSystemAvailable(): boolean {
  try {
    const logsDir = join(process.cwd(), "LOGS");
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

function formatLine(source: LogSource, action: string, detail?: string): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${source.toUpperCase()}] ${action}`;
  return detail ? `${base} — ${detail}` : base;
}

export function log(source: LogSource, action: string, detail?: string) {
  const line = formatLine(source, action, detail);
  console.log(line);

  if (isFileSystemAvailable()) {
    try {
      appendFileSync(getLogFilePath(), line + "\n", "utf-8");
    } catch {
      // silently fail in serverless
    }
  }
}

export const logger = {
  ia(action: string, detail?: string) {
    log("ia", action, detail);
  },
  commercial(action: string, detail?: string) {
    log("commercial", action, detail);
  },
  cron(action: string, detail?: string) {
    log("cron", action, detail);
  },
  system(action: string, detail?: string) {
    log("system", action, detail);
  },
};
