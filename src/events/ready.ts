import { EventListener } from '../bot/handler/event';
import { logger } from '../utils';

export default new EventListener('ready', () => {
    logger.success('Bot online');
});
