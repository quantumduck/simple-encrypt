export interface ConsoleLoggingInterface {
  error: (message: string) => void;
  warn: (message: string) => void;
  log: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
}
