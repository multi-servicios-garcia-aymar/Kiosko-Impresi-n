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
  private constructor() {}

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
      this.persistCrashToLocal(entry);
    }
  }

  private persistCrashToLocal(entry: LogEntry) {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const logFileName = `crash-${dateStr}`;
      const logContent = `\n[${entry.timestamp}] ${entry.message}\nContext: ${JSON.stringify(entry.context, null, 2)}\n---`;
      
      const prevContent = localStorage.getItem(logFileName) || '';
      localStorage.setItem(logFileName, prevContent + logContent);
    } catch (e) {
      console.error("Failed to persist crash report to local storage:", e);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = LoggerService.getInstance();
