import { ClientEvents } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils';
import { ExtendedClient } from '../client';

export class EventHandler {
    private eventFiles: string[];

    constructor(private manager: ExtendedClient, private eventDir: string) {
        this.eventFiles = fs
            .readdirSync(eventDir)
            .filter((file: string) => file.endsWith('.ts'));
    }

    async initialize() {
        for (let i = 0; i < this.eventFiles.length; i++) {
            const module = await import(
                `file://` + path.join(this.eventDir, this.eventFiles[i])
            );
            if (!(module.default instanceof EventListener)) return;
            (module.default as EventListener<any>).initialize(this.manager);
        }

        return this;
    }
}
export class EventListener<TEvent extends keyof ClientEvents> {
    constructor(
        public name: TEvent,
        public handler: (
            manager: ExtendedClient,
            ...params: ClientEvents[TEvent]
        ) => Promise<any> | any
    ) {}

    initialize(manager: ExtendedClient) {
        logger.info(`listening to event "${this.name}"`);

        manager.events.push({
            name: this.name,
            handler: this.handler,
        });

        manager.on(
            this.name,
            async (...params) => await this.handler(manager, ...params)
        );
    }
}

//! WIP
export class EventEmitter {
    constructor(manager: ExtendedClient, name: keyof ClientEvents) {
        manager.emit(name);
    }
}
