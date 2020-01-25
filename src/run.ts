import { Main } from '.';
import { ConsoleLogger } from './util';

const application = new Main();
const logger = new ConsoleLogger();

application
  .runOnce()
  .then(() => {
    logger.notice('Done');
  })
  .catch(e => {
    logger.error('Something went wrong', e);
  });
