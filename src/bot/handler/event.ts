import { ClientEvents } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { manager } from '../..';
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
            import(
                `file://` + path.join(this.eventDir, this.eventFiles[i])
            ).then((module) => {
                if (!(module.default instanceof EventListener)) return;
                logger.info(`listening to event "${module.default.name}"`);
            });
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
    ) {
        manager.events.push({ name, handler });
        manager.on(
            name,
            async (...params) => await handler(manager, ...params)
        );
    }
}

//! WIP
export class EventEmitter {
    constructor(manager: ExtendedClient, name: keyof ClientEvents) {
        manager.emit(name);
    }
}
