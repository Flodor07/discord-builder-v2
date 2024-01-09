import { PermissionFlagsBits } from 'discord.js';
import { Command } from '../../../../bot/handler/command';

export default new Command({
    commandConfig: {
        requiredPermissions: {
            user: [PermissionFlagsBits.Administrator],
            bot: [PermissionFlagsBits.AddReactions],
        },
    },
    commandData: {
        category: 'testaddon',
        enabled: true,
        name: 'test',
        legacyCommand: {
            name: 'testaddonleg',
            leagacyRun(manager, message, args) {
                message.reply('test');
            },
        },
        slashCommand: {
            name: 'testaddonslash',
            description: 'testaddonslash',
            async interactionRun(manager, interaction) {
                return await interaction.reply({
                    ephemeral: true,
                    content: 'hello from addon',
                });
            },
        },
    },
});
