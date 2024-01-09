import { EventListener } from '../../../bot/handler/event';
import { logger } from '../../../utils';

export default new EventListener('ready', (client) => {
    logger.success('hello from test-addon');
});
