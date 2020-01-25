import { Dictionary } from '../../src/util/interfaces';

export class EnvironmentEditor {
  private readonly envCopy: Dictionary<string> = {};
  private readonly envKeys: Dictionary<boolean> = {};

  get(key: string): string | undefined {
    return process.env[key];
  }

  set(key: string, value: string) {
    this.storeOriginalValue(key);
    process.env[key] = value;
  }

  clear(key: string) {
    this.storeOriginalValue(key);
    delete process.env[key];
  }

  resetAll() {
    Object.keys(this.envKeys).forEach(k => {
      this.reset(k);
    });
  }

  reset(key: string): void {
    if (this.envCopy[key] != null) {
      process.env[key] = this.envCopy[key];
      delete this.envCopy[key];
    } else {
      delete process.env[key];
    }
    delete this.envKeys[key];
  }

  private storeOriginalValue(key: string) {
    if (!this.envKeys[key]) {
      this.envKeys[key] = true;
      if (process.env[key] != null) {
        this.envCopy[key] = process.env[key] || '';
      }
    }
  }
}
