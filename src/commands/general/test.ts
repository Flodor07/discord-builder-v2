import { PermissionFlagsBits } from 'discord.js';
import { Command } from '../../bot/handler/command';

export default new Command({
    commandConfig: {
        requiredPermissions: {
            user: [PermissionFlagsBits.Administrator],
            bot: [PermissionFlagsBits.Administrator],
        },
    },

    commandData: {
        name: 'test',
        category: 'test',
        enabled: true,
        cooldown: 1000,
        legacyCommand: {
            name: 'test',
            leagacyRun(manager, message, args) {
                message.reply('test');
            },
        },
        slashCommand: {
            name: 'testcommand6',
            description: 'test',
            interactionRun(manager, interaction) {
                interaction.reply('test');
            },
        },
        userContextCommand: {
            name: 'testapp',
            interactionRun(manager, interaction) {
                interaction.reply('test');
            },
        },
        messageContextCommand: {
            name: 'testo2',
            interactionRun(manager, interaction) {
                interaction.reply('test');
            },
        },
    },
});
