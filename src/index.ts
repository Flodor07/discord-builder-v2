import path from 'path';
import { ExtendedClient } from './bot/client';
import { env } from './env';

export const manager = await new ExtendedClient({
    clientOptions: {
        intents: [
            'Guilds',
            'GuildMembers',
            'MessageContent',
            'GuildMessages',
            'DirectMessages',
        ],
    },
    customOptions: {
        commandDir: path.join(__dirname, 'commands'),
        eventDir: path.join(__dirname, 'events'),
    },
}).initHandlers();

await manager.login(env.DISCORD_TOKEN);
