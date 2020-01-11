import { Logger, LogLevel } from '..';
import { LoggerUtil } from '../logger-util';
import { ConsoleLoggingInterface } from './console-logger.models';

// tslint:disable: no-any
export class ConsoleLogger implements Logger {
  private readonly console: ConsoleLoggingInterface;

  constructor(
    public logLevel = LogLevel.INFO,
    customLoggingInterface?: ConsoleLoggingInterface
  ) {
    this.console = customLoggingInterface || {
      error: console.error,
      warn: console.warn,
      log: console.log,
      info: console.info,
      debug: console.debug,
    };
  }

  emergency(message: string, data?: any) {
    const logEntry = LoggerUtil.createLogEntry(LogLevel.EMERG, message, data);
    this.console.error(logEntry);
  }

  alert(message: string, data?: any) {
    if (this.isLoggable(LogLevel.ALERT)) {
      const logEntry = LoggerUtil.createLogEntry(LogLevel.ALERT, message, data);
      this.console.error(logEntry);
    }
  }

  critical(message: string, data?: any) {
    if (this.isLoggable(LogLevel.CRIT)) {
      const logEntry = LoggerUtil.createLogEntry(LogLevel.CRIT, message, data);
      this.console.error(logEntry);
    }
  }

  error(message: string, data?: any) {
    if (this.isLoggable(LogLevel.ERROR)) {
      const logEntry = LoggerUtil.createLogEntry(LogLevel.ERROR, message, data);
      this.console.error(logEntry);
    }
  }

  warning(message: string, data?: any) {
    if (this.isLoggable(LogLevel.WARN)) {
      const logEntry = LoggerUtil.createLogEntry(LogLevel.WARN, message, data);
      this.console.warn(logEntry);
    }
  }

  notice(message: string, data?: any) {
    if (this.isLoggable(LogLevel.NOTICE)) {
      const logEntry = LoggerUtil.createLogEntry(
        LogLevel.NOTICE,
        message,
        data
      );
      this.console.log(logEntry);
    }
  }

  info(message: string, data?: any) {
    if (this.isLoggable(LogLevel.INFO)) {
      const logEntry = LoggerUtil.createLogEntry(LogLevel.INFO, message, data);
      this.console.info(logEntry);
    }
  }

  debug(message: string, data?: any) {
    if (this.isLoggable(LogLevel.DEBUG)) {
      const logEntry = LoggerUtil.createLogEntry(LogLevel.DEBUG, message, data);
      this.console.debug(logEntry);
    }
  }

  private isLoggable(logLevel: LogLevel) {
    return logLevel <= this.logLevel;
  }
}
