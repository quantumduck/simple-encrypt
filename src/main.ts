import { ApplicationDependencies } from './main.models';
import { Logger, ConsoleLogger } from './util';

export class Main {
  private readonly logger: Logger;

  constructor(dependencies: ApplicationDependencies = {}) {
    this.logger = dependencies.logger || new ConsoleLogger();
  }

  runOnce() {
    this.logger.notice('Started');
    return Promise.resolve();
  }
}
