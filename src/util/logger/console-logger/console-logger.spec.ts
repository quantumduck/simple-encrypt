import { ConsoleLogger, LogLevel } from '..';
import { LoggerUtil } from '../logger-util';
import { expectDate } from '../../../../test/util';

describe('ConsoleLogger', () => {
  const defaultLogLevel = LogLevel.INFO;
  const testMessage = 'testing 123';
  const testError = Error('I accidentally an error');
  const testData = { additionalInfo: 'I like turtles' };

  const consoleLoggerInterface = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  const allLogLevels = [
    LogLevel.EMERG,
    LogLevel.ALERT,
    LogLevel.CRIT,
    LogLevel.ERROR,
    LogLevel.WARN,
    LogLevel.NOTICE,
    LogLevel.INFO,
    LogLevel.DEBUG,
  ];

  const getMessageContent = (logEntry: string) =>
    logEntry
      .split(' ')
      .slice(1)
      .join(' ');

  const getLoggedMessageContent = (mockFn: jest.Mock) =>
    getMessageContent(mockFn.mock.calls[0][0]);

  const checkThatNoLogsAreMade = () => {
    expect(consoleLoggerInterface.error.mock.calls).toEqual([]);
    expect(consoleLoggerInterface.warn.mock.calls).toEqual([]);
    expect(consoleLoggerInterface.log.mock.calls).toEqual([]);
    expect(consoleLoggerInterface.info.mock.calls).toEqual([]);
    expect(consoleLoggerInterface.debug.mock.calls).toEqual([]);
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('sets uses the default log level by default', () => {
    const target = new ConsoleLogger();
    expect(target.logLevel).toBe(defaultLogLevel);
  });

  it('sets a custom log level if provided', () => {
    const target = new ConsoleLogger(LogLevel.ERROR);
    expect(target.logLevel).toBe(LogLevel.ERROR);
  });

  describe('emergency', () => {
    const expectedLogContent = getMessageContent(
      LoggerUtil.createLogEntry(LogLevel.EMERG, testMessage, testError)
    );

    it('calls console.error with expected message content at all log levels', () => {
      allLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.emergency(testMessage, testError);
        const logContent = getLoggedMessageContent(
          consoleLoggerInterface.error
        );
        expect(logContent).toBe(expectedLogContent);
      });
    });
  });

  describe('alert', () => {
    const inactiveLogLevels = allLogLevels.slice(0, LogLevel.ALERT);
    const activeLogLevels = allLogLevels.slice(LogLevel.ALERT);
    const expectedLogContent = getMessageContent(
      LoggerUtil.createLogEntry(LogLevel.ALERT, testMessage, testError)
    );

    it('calls console.error with expected message content at all active log levels', () => {
      activeLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.alert(testMessage, testError);
        const logContent = getLoggedMessageContent(
          consoleLoggerInterface.error
        );
        expect(logContent).toBe(expectedLogContent);
      });
    });

    it('does nothing for all incative log levels', () => {
      inactiveLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.alert(testMessage, testError);
        checkThatNoLogsAreMade();
      });
    });
  });

  describe('critical', () => {
    const inactiveLogLevels = allLogLevels.slice(0, LogLevel.CRIT);
    const activeLogLevels = allLogLevels.slice(LogLevel.CRIT);
    const expectedLogContent = getMessageContent(
      LoggerUtil.createLogEntry(LogLevel.CRIT, testMessage, testError)
    );

    it('calls console.error with expected message content at all active log levels', () => {
      activeLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.critical(testMessage, testError);
        const logContent = getLoggedMessageContent(
          consoleLoggerInterface.error
        );
        expect(logContent).toBe(expectedLogContent);
      });
    });

    it('does nothing for all incative log levels', () => {
      inactiveLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.critical(testMessage, testError);
        checkThatNoLogsAreMade();
      });
    });
  });

  describe('error', () => {
    const inactiveLogLevels = allLogLevels.slice(0, LogLevel.ERROR);
    const activeLogLevels = allLogLevels.slice(LogLevel.ERROR);
    const expectedLogContent = getMessageContent(
      LoggerUtil.createLogEntry(LogLevel.ERROR, testMessage, testError)
    );

    it('calls console.error with expected message content at all active log levels', () => {
      activeLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.error(testMessage, testError);
        const logContent = getLoggedMessageContent(
          consoleLoggerInterface.error
        );
        expect(logContent).toBe(expectedLogContent);
      });
    });

    it('does nothing for all incative log levels', () => {
      inactiveLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.error(testMessage, testError);
        checkThatNoLogsAreMade();
      });
    });
  });

  describe('warning', () => {
    const inactiveLogLevels = allLogLevels.slice(0, LogLevel.WARN);
    const activeLogLevels = allLogLevels.slice(LogLevel.WARN);
    const expectedLogContent = getMessageContent(
      LoggerUtil.createLogEntry(LogLevel.WARN, testMessage)
    );

    it('calls console.error with expected message content at all active log levels', () => {
      activeLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.warning(testMessage);
        const logContent = getLoggedMessageContent(consoleLoggerInterface.warn);
        expect(logContent).toBe(expectedLogContent);
      });
    });

    it('does nothing for all incative log levels', () => {
      inactiveLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.warning(testMessage);
        checkThatNoLogsAreMade();
      });
    });
  });

  describe('notice', () => {
    const inactiveLogLevels = allLogLevels.slice(0, LogLevel.NOTICE);
    const activeLogLevels = allLogLevels.slice(LogLevel.NOTICE);
    const expectedLogContent = getMessageContent(
      LoggerUtil.createLogEntry(LogLevel.NOTICE, testMessage)
    );

    it('calls console.error with expected message content at all active log levels', () => {
      activeLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.notice(testMessage);
        const logContent = getLoggedMessageContent(consoleLoggerInterface.log);
        expect(logContent).toBe(expectedLogContent);
      });
    });

    it('does nothing for all incative log levels', () => {
      inactiveLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.notice(testMessage);
        checkThatNoLogsAreMade();
      });
    });
  });

  describe('info', () => {
    const inactiveLogLevels = allLogLevels.slice(0, LogLevel.INFO);
    const activeLogLevels = allLogLevels.slice(LogLevel.INFO);
    const expectedLogContent = getMessageContent(
      LoggerUtil.createLogEntry(LogLevel.INFO, testMessage, testData)
    );

    it('calls console.error with expected message content at all active log levels', () => {
      activeLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.info(testMessage, testData);
        const logContent = getLoggedMessageContent(consoleLoggerInterface.info);
        expect(logContent).toBe(expectedLogContent);
      });
    });

    it('does nothing for all incative log levels', () => {
      inactiveLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.info(testMessage, testData);
        checkThatNoLogsAreMade();
      });
    });
  });

  describe('debug', () => {
    const inactiveLogLevels = allLogLevels.slice(0, LogLevel.DEBUG);
    const activeLogLevels = allLogLevels.slice(LogLevel.DEBUG);
    const expectedLogContent = getMessageContent(
      LoggerUtil.createLogEntry(LogLevel.DEBUG, testMessage, testData)
    );

    it('calls console.error with expected message content at all active log levels', () => {
      activeLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.debug(testMessage, testData);
        const logContent = getLoggedMessageContent(
          consoleLoggerInterface.debug
        );
        expect(logContent).toBe(expectedLogContent);
      });
    });

    it('does nothing for all incative log levels', () => {
      inactiveLogLevels.forEach(ll => {
        const target = new ConsoleLogger(ll, consoleLoggerInterface);
        target.debug(testMessage, testData);
        checkThatNoLogsAreMade();
      });
    });
  });
});
