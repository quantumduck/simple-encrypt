import {
  LogLevel,
  LOG_LEVEL_STRINGS,
  LOG_LEVEL_DICTIONARY,
} from './logger.interface';

// tslint:disable: no-any
export class LoggerUtil {
  static createLogEntry(
    logLevel: LogLevel,
    message: string,
    data?: any
  ): string {
    const messageLine = `${new Date().toISOString()} [${this.stringifyLogLevel(
      logLevel
    )}] ${message}`;

    if (data === undefined) {
      return messageLine;
    } else {
      return `${messageLine}\n${this.stringifyDataOrError(data)}`;
    }
  }

  static stringifyDataOrError(data: any): string | undefined {
    return this.isError(data) ? data.stack : `Data: ${JSON.stringify(data)}`;
  }

  static isError(data: any): boolean {
    return data && typeof data.stack === 'string';
  }

  static stringifyLogLevel(logLevel: LogLevel) {
    return LOG_LEVEL_STRINGS[logLevel];
  }

  static getCurrentLogLevelFromEnv(defaultLevel: LogLevel) {
    return process.env.LOG_LEVEL
      ? LOG_LEVEL_DICTIONARY[process.env.LOG_LEVEL.toUpperCase()]
      : defaultLevel;
  }
}
