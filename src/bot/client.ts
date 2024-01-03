import { PrismaClient } from '@prisma/client';
import { Client, ClientOptions, Collection, REST } from 'discord.js';
import * as fs from 'fs';
import { env } from '../env';
import { Command, CommandHandler } from './handler/command';
import { EventHandler } from './handler/event';

type CustomOptions = {
    commandDir: string;
    eventDir: string;
};

type ExtendedClientOptions = {
    clientOptions: ClientOptions;
    customOptions: CustomOptions;
};

type Events = {
    name: string;
    handler: (manager: ExtendedClient, ...params: any) => Promise<void> | void;
}[];

export class ExtendedClient extends Client {
    customOptions: CustomOptions;
    events: Events = [];
    commands = new Collection<string, Command>();
    slashCommands = new Collection<string, Command>();
    userContextCommand = new Collection<string, Command>();
    messageContextCommand = new Collection<string, Command>();
    leagacyCommands = new Collection<string, Command>();
    commandHandler: CommandHandler | undefined = undefined;
    db = new PrismaClient();

    constructor({ clientOptions, customOptions }: ExtendedClientOptions) {
        super(clientOptions);
        this.customOptions = customOptions;

        if (!fs.existsSync(customOptions.commandDir)) {
            fs.mkdirSync(customOptions.commandDir);
        }
        if (!fs.existsSync(customOptions.eventDir)) {
            fs.mkdirSync(customOptions.eventDir);
        }
    }

    async initHandlers() {
        this.rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

        const commandHandler = await (
            await new CommandHandler(
                this,
                this.customOptions.commandDir
            ).initialize()
        )?.registerCommands(this, env.BOT_ID);

        const eventHandler = await new EventHandler(
            this,
            this.customOptions.eventDir
        ).initialize();

        return this;
    }
}
