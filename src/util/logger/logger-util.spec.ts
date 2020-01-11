import { LoggerUtil } from './logger-util';
import { LogLevel, LOG_LEVEL_STRINGS } from './logger.interface';
import { EnvironmentEditor } from '../../../test/util';
import { expectDate, expectString } from '../../../test/util';

describe('LoggerUtil', () => {
  const target = LoggerUtil;
  const testMessage = 'msg';
  const testError = TypeError('bad type');
  const testData = { data: {} };

  describe('createLogEntry', () => {
    it('should include the timestamp at the start', () => {
      const before = Date.now();
      const result = target.createLogEntry(LogLevel.INFO, testMessage);
      const after = Date.now();
      const timestamp = result.split(' ')[0];
      expectDate(timestamp).toBeBetween(before, after);
    });

    it('should include the message at the end if no other data provided', () => {
      const result = target.createLogEntry(LogLevel.INFO, testMessage);
      expectString(result).toEndWith(testMessage);
    });

    it('should include the message if additional data provided', () => {
      const result = target.createLogEntry(
        LogLevel.INFO,
        testMessage,
        testData
      );
      expectString(result).toContain(testMessage);
    });

    it('should include the log level if additional data provided', () => {
      const result = target.createLogEntry(
        LogLevel.WARN,
        testMessage,
        testData
      );
      expectString(result).toContain(LOG_LEVEL_STRINGS[LogLevel.WARN]);
    });

    it('should include end with the strigified data object, if provided', () => {
      const result = target.createLogEntry(
        LogLevel.INFO,
        testMessage,
        testData
      );
      expectString(result).toEndWith(JSON.stringify(testData));
    });

    it('should end with the error stack if provided', () => {
      const result = target.createLogEntry(
        LogLevel.INFO,
        testMessage,
        testError
      );

      if (testError.stack) {
        expectString(result).toEndWith(testError.stack);
      }
    });
  });

  describe('getCurrentLogLevelFromEnv', () => {
    const envEditor = new EnvironmentEditor();
    const logLevelKey = 'LOG_LEVEL';
    const defaultLevel = LogLevel.INFO;

    afterEach(() => {
      envEditor.resetAll();
    });

    it('should return the default logging level if the env variable is unset', () => {
      envEditor.clear(logLevelKey);
      expect(target.getCurrentLogLevelFromEnv(defaultLevel)).toBe(defaultLevel);
    });

    it('should return all the valid log levels accorind to their defined order', () => {
      LOG_LEVEL_STRINGS.forEach((logLevelString, index) => {
        envEditor.set(logLevelKey, logLevelString);
        expect(target.getCurrentLogLevelFromEnv(defaultLevel)).toBe(index);
      });

      envEditor.clear(logLevelKey);
      expect(target.getCurrentLogLevelFromEnv(defaultLevel)).toBe(defaultLevel);
    });
  });
});
