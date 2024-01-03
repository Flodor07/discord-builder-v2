import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Message,
    MessageContextMenuCommandInteraction,
    Routes,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import * as fs from 'fs';
import path from 'path';
import { env } from '../../env';
import { logger } from '../../utils';
import { ExtendedClient } from '../client';

type LegacyCommandData = {
    name: string;
    leagacyRun: (
        manager: ExtendedClient,
        message: Message,
        args: string[]
    ) => Promise<any> | any;
};

type SlashCommandData = {
    name: string;
    nsfw?: boolean;
    description?: string;
    autoComplete?: (
        manager: ExtendedClient,
        interaction: AutocompleteInteraction
    ) => Promise<any> | any;
    interactionRun: (
        manager: ExtendedClient,
        interaction: ChatInputCommandInteraction
    ) => Promise<any> | any;
};

type UserContextCommandData = {
    name: string;
    nsfw?: boolean;
    interactionRun: (
        manager: ExtendedClient,
        interaction: UserContextMenuCommandInteraction
    ) => Promise<any> | any;
};

type MessageContextCommandData = {
    name: string;
    nsfw?: boolean;
    interactionRun: (
        manager: ExtendedClient,
        interaction: MessageContextMenuCommandInteraction
    ) => Promise<any> | any;
};

type CommandConfig = {
    guildOnly?: boolean;
    requiredPermissions?: {
        user?: bigint[];
        bot?: bigint[];
    };
};

type CommandData = {
    enabled: boolean;
    name: string;
    category: string;
    cooldown?: number;
    help?: {
        description: string;
        usage: string;
    };
    legacyCommand?: LegacyCommandData;
    slashCommand?: SlashCommandData;
    userContextCommand?: UserContextCommandData;
    messageContextCommand?: MessageContextCommandData;
};

type CommandType = {
    commandConfig: CommandConfig;
    commandData: CommandData;
};

export class Command {
    constructor(public commandInfo: CommandType) {}

    public initialize(manager: ExtendedClient) {
        let currentCommandName;

        if (this.commandInfo.commandData.legacyCommand) {
            currentCommandName = this.commandInfo.commandData.name;
            manager.commands.set(this.commandInfo.commandData.name, this);

            logger.info(
                `registered command "${this.commandInfo.commandData.name}"`
            );
        }

        if (this.commandInfo.commandData.slashCommand) {
            const slashCommand = this.commandInfo.commandData.slashCommand;

            manager.slashCommands.set(slashCommand.name, this);
            logger.info(`registered slashcommand "${slashCommand.name}"`);
        }

        if (this.commandInfo.commandData.userContextCommand) {
            const userContextCommand =
                this.commandInfo.commandData.userContextCommand;

            manager.userContextCommand.set(userContextCommand.name, this);
            logger.info(`registered userCommand "${userContextCommand.name}"`);
        }

        if (this.commandInfo.commandData.messageContextCommand) {
            const messageContextCommand =
                this.commandInfo.commandData.messageContextCommand;

            manager.messageContextCommand.set(messageContextCommand.name, this);
            logger.info(
                `registered messageCommand "${messageContextCommand.name}"`
            );
        }

        if (this.commandInfo.commandData.legacyCommand) {
            manager.leagacyCommands.set(
                this.commandInfo.commandData.legacyCommand.name,
                this
            );

            if (
                currentCommandName !=
                this.commandInfo.commandData.legacyCommand.name
            ) {
                logger.info(
                    `registered leagacycommand "${this.commandInfo.commandData.legacyCommand.name}" from "${this.commandInfo.commandData.name}"`
                );
            }
        }
    }
}

export class CommandHandler {
    private commandDirFiles: string[];

    constructor(private manager: ExtendedClient, private commandDir: string) {
        this.commandDirFiles = fs.readdirSync(commandDir);
    }

    async initialize() {
        for (let i = 0; i < this.commandDirFiles.length; i++) {
            const isDir = fs
                .lstatSync(path.join(this.commandDir, this.commandDirFiles[i]))
                .isDirectory();
            if (!isDir) continue;

            const dirFiles = fs
                .readdirSync(
                    path.join(this.commandDir, this.commandDirFiles[i])
                )
                .filter((file) => file.endsWith('.ts'));

            for (let y = 0; y < dirFiles.length; y++) {
                const modulePath =
                    `file://` +
                    path.join(
                        this.commandDir,
                        this.commandDirFiles[i],
                        dirFiles[y].replace('.ts', '.js')
                    );

                const module = await import(modulePath);

                if (!(module.default instanceof Command)) return;
                const command = module.default as Command;

                command.initialize(this.manager);
            }
        }

        return this;
    }

    async registerCommands(manager: ExtendedClient, botId: string) {
        const rawSlashCommands = manager.slashCommands.map((command, key) => {
            const slashCommand = command.commandInfo.commandData.slashCommand!;
            const memberPermission =
                command.commandInfo.commandConfig.requiredPermissions?.user
                    ?.reduce((p, c) => p | c)
                    .toString();

            return {
                name: slashCommand.name,
                name_localizations: undefined,
                description_localizations: undefined,
                description: slashCommand.description ?? undefined,
                type: 1,
                default_permission: undefined,
                default_member_permissions: memberPermission,
                dm_permission:
                    command.commandInfo.commandConfig.guildOnly ?? true,
                nsfw: slashCommand.nsfw ?? false,
                options: [],
            };
        });

        const rawUserContextCommands = manager.userContextCommand.map(
            (command, key) => {
                const userCommand =
                    command.commandInfo.commandData.userContextCommand!;
                const memberPermission =
                    command.commandInfo.commandConfig.requiredPermissions?.user
                        ?.reduce((p, c) => p | c)
                        .toString();

                return {
                    name: userCommand.name,
                    name_localizations: undefined,
                    type: 2,
                    default_permission: undefined,
                    default_member_permissions: memberPermission,
                    dm_permission:
                        command.commandInfo.commandConfig.guildOnly ?? true,
                    nsfw: userCommand.nsfw ?? false,
                    options: [],
                };
            }
        );

        const rawMessageContextCommand = manager.messageContextCommand.map(
            (command, key) => {
                const messageContextCommand =
                    command.commandInfo.commandData.messageContextCommand!;
                const memberPermission =
                    command.commandInfo.commandConfig.requiredPermissions?.user
                        ?.reduce((p, c) => p | c)
                        .toString();

                return {
                    name: messageContextCommand.name,
                    name_localizations: undefined,
                    type: 3,
                    default_permission: undefined,
                    default_member_permissions: memberPermission,
                    dm_permission:
                        command.commandInfo.commandConfig.guildOnly ?? true,
                    nsfw: messageContextCommand.nsfw ?? false,
                    options: [],
                };
            }
        );

        const rawCommands = [
            ...rawSlashCommands,
            ...rawUserContextCommands,
            ...rawMessageContextCommand,
        ];

        env.GUILD_ID
            ? await manager.rest.put(
                  Routes.applicationGuildCommands(botId, env.GUILD_ID),
                  {
                      body: rawCommands,
                  }
              )
            : await manager.rest.put(Routes.applicationCommands(botId), {
                  body: rawCommands,
              });

        return this;
    }
}
