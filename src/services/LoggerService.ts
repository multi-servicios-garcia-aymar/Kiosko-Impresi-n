/**
 * LoggerService
 * Centralized logging for the application.
 * In a real-world enterprise app, this could send logs to Sentry, Datadog, or a custom ELK stack.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class LoggerService {
  private static instance: LoggerService;
  private isProduction = import.meta.env.PROD;

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

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      data,
      env: this.isProduction ? 'prod' : 'dev',
    };

    if (!this.isProduction || level === 'error') {
      const color = this.getLevelColor(level);
      console.log(`%c[${timestamp}] [${level.toUpperCase()}] ${message}`, color, data || '');
    }

    if (level === 'error') {
      this.persistCrashToLocal({ level, message, data, timestamp });
    }
  }

  private persistCrashToLocal(entry: any) {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const logFileName = `crash-${dateStr}`;
      const logContent = `\n[${entry.timestamp}] ${entry.message}\nContext: ${JSON.stringify(entry.data, null, 2)}\n---`;
      
      const prevContent = localStorage.getItem(logFileName) || '';
      localStorage.setItem(logFileName, prevContent + logContent);
    } catch (e) {
      console.error("Failed to persist crash report to local storage:", e);
    }
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'info': return 'color: #3b82f6';
      case 'warn': return 'color: #f59e0b';
      case 'error': return 'color: #ef4444';
      case 'debug': return 'color: #10b981';
      default: return 'color: inherit';
    }
  }

  public info(message: string, data?: any) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any) {
    this.log('error', message, data);
  }

  public debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
}

export const logger = LoggerService.getInstance();
