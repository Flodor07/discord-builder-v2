import fs from 'fs';
import path from 'path';
import { logger } from '../../utils';
import { ExtendedClient } from '../client';
import { Command, CommandHandler } from './command';
import { EventHandler, EventListener } from './event';

export class AddonHandler {
    private addonFiles: string[];

    constructor(private manager: ExtendedClient, private addonDir: string) {
        this.addonFiles = fs
            .readdirSync(this.addonDir)
            .filter((file) => file.endsWith('.ts'));
    }

    async initialize() {
        for (const file of this.addonFiles) {
            const module = await import(
                `file://` + path.join(this.addonDir, file)
            );

            if (!(module.default instanceof Addon)) continue;
            const addon = module.default as Addon;

            logger.info(`Loading addon "${addon.addonOptions.name}"`);
            this.manager.addons.set(addon.addonOptions.name, addon);
            await addon.initialize(this.manager);
        }

        return this;
    }
}

export type AddonConfig = {
    name: string;
    externalFiles?: true;
};

export class Addon {
    commands: Command[] = [];
    events: EventListener<any>[] = [];
    private addonPath = (manager: ExtendedClient) =>
        path.join(manager.customOptions.addonDir, this.addonOptions.name);

    constructor(public addonOptions: AddonConfig) {}

    setCommands(commands: Command[]) {
        this.commands = commands;
        return this;
    }

    setEvents(events: EventListener<any>[]) {
        this.events = events;
        return this;
    }

    async initialize(manager: ExtendedClient) {
        if (this.events.length > 0) {
            for (let i = 0; i < this.events.length; i++) {
                this.events[i].initialize(manager);
            }
        }

        if (this.commands.length > 0) {
            for (let i = 0; i < this.commands.length; i++) {
                this.commands[i].initialize(manager);
            }
        }

        if (!this.addonOptions.externalFiles) return;

        if (!fs.existsSync(this.addonPath(manager))) {
            fs.mkdirSync(this.addonPath(manager));
        }

        if (!fs.existsSync(path.join(this.addonPath(manager), 'commands'))) {
            fs.mkdirSync(path.join(this.addonPath(manager), 'commands'));
        }

        if (!fs.existsSync(path.join(this.addonPath(manager), 'events'))) {
            fs.mkdirSync(path.join(this.addonPath(manager), 'events'));
        }

        const eventHandler = await new EventHandler(
            manager,
            path.join(this.addonPath(manager), 'events')
        ).initialize();

        const commandHandler = await new CommandHandler(
            manager,
            path.join(this.addonPath(manager), 'commands')
        ).initialize();

        return;
    }
}
