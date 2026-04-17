export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
}

class LoggerService {
  private static instance: LoggerService;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private isTauriEnv = false;

  private constructor() {
    this.isTauriEnv = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.error('Global Uncaught Exception', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason?.stack || event.reason,
      });
    });
  }

  public info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: any) {
    this.log(LogLevel.ERROR, message, context);
  }

  private async log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // Console output for development
    if (import.meta.env.DEV || level === LogLevel.ERROR) {
      switch (level) {
        case LogLevel.INFO:
          console.info(`[INFO] ${message}`, context || '');
          break;
        case LogLevel.WARN:
          console.warn(`[WARN] ${message}`, context || '');
          break;
        case LogLevel.ERROR:
          console.error(`[ERROR] ${message}`, context || '');
          break;
      }
    }

    if (level === LogLevel.ERROR) {
      await this.persistCrashToDisk(entry);
    }
  }

  private async persistCrashToDisk(entry: LogEntry) {
    if (!this.isTauriEnv) return;
    try {
      const { writeTextFile, mkdir, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      
      const logsDirExists = await exists('logs', { baseDir: BaseDirectory.AppData });
      if (!logsDirExists) {
        await mkdir('logs', { baseDir: BaseDirectory.AppData });
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const logFileName = `logs/crash-${dateStr}.log`;
      
      const logContent = `\n[${entry.timestamp}] ${entry.message}\nContext: ${JSON.stringify(entry.context, null, 2)}\n---`;
      
      const fileExists = await exists(logFileName, { baseDir: BaseDirectory.AppData });
      
      if (fileExists) {
        // En Tauri plugin-fs v2, writeTextFile sobrescribe, no hace append directamente,
        // pero podemos leer y concatenar para evitar perder crasheos previos del mismo día
        const { readTextFile } = await import('@tauri-apps/plugin-fs');
        const prevContent = await readTextFile(logFileName, { baseDir: BaseDirectory.AppData });
        await writeTextFile(logFileName, prevContent + logContent, { baseDir: BaseDirectory.AppData });
      } else {
        await writeTextFile(logFileName, logContent, { baseDir: BaseDirectory.AppData });
      }
    } catch (e) {
      console.error("Failed to persist crash report to disk:", e);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = LoggerService.getInstance();
