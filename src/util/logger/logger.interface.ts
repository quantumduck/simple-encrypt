import { Dictionary } from '../interfaces';

// tslint:disable: no-any
export interface Logger {
  emergency: LogFunction;
  alert: LogFunction;
  critical: LogFunction;
  error: LogFunction;
  warning: LogFunction;
  notice: LogFunction;
  info: LogFunction;
  debug: LogFunction;
}

export type LogFunction = (message: string, data?: any) => void;

export enum LogLevel {
  EMERG,
  ALERT,
  CRIT,
  ERROR,
  WARN,
  NOTICE,
  INFO,
  DEBUG,
}

export const LOG_LEVEL_STRINGS = [
  'EMERGENCY',
  'ALERT',
  'CRITICAL',
  'ERROR',
  'WARN',
  'NOTICE',
  'INFO',
  'DEBUG',
];

export const LOG_LEVEL_DICTIONARY: Dictionary<LogLevel> = {
  EMERG: LogLevel.EMERG,
  EMERGENCY: LogLevel.EMERG,
  ALERT: LogLevel.ALERT,
  CRIT: LogLevel.CRIT,
  CRITICAL: LogLevel.CRIT,
  ERR: LogLevel.ERROR,
  ERROR: LogLevel.ERROR,
  WARN: LogLevel.WARN,
  WARNING: LogLevel.WARN,
  NOTICE: LogLevel.NOTICE,
  INFO: LogLevel.INFO,
  INFORMATION: LogLevel.INFO,
  INFORMATIONAL: LogLevel.INFO,
  DEBUG: LogLevel.DEBUG,
};
