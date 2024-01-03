import { EventListener } from '../bot/handler/event';
import { botPermission, commandCooldown, userPermision } from '../utils';

export default new EventListener(
    'interactionCreate',
    async (client, interaction) => {
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands.get(interaction.commandName);
            const slashCommand = command?.commandInfo.commandData.slashCommand;

            if (!command || !slashCommand) return;

            if (!(await botPermission(command, client, interaction))) return;
            if (
                !(await userPermision(
                    command,
                    interaction.user.id,
                    interaction
                ))
            )
                return;
            if (
                await commandCooldown(
                    command,
                    interaction.user.id,
                    interaction,
                    client
                )
            )
                return;

            await slashCommand.interactionRun(client, interaction);
        } else if (interaction.isUserContextMenuCommand()) {
            const command = client.userContextCommand.get(
                interaction.commandName
            );
            const userCommand =
                command?.commandInfo.commandData.userContextCommand;

            if (!command || !userCommand) return;

            if (!(await botPermission(command, client, interaction))) return;
            if (
                !(await userPermision(
                    command,
                    interaction.user.id,
                    interaction
                ))
            )
                return;
            if (
                await commandCooldown(
                    command,
                    interaction.user.id,
                    interaction,
                    client
                )
            )
                return;

            await userCommand.interactionRun(client, interaction);
        } else if (interaction.type == 2) {
            const command = client.messageContextCommand.get(
                interaction.commandName
            );
            const userCommand =
                command?.commandInfo.commandData.messageContextCommand;

            if (!command || !userCommand) return;

            if (!(await botPermission(command, client, interaction))) return;
            if (
                !(await userPermision(
                    command,
                    interaction.user.id,
                    interaction
                ))
            )
                return;
            if (
                await commandCooldown(
                    command,
                    interaction.user.id,
                    interaction,
                    client
                )
            )
                return;

            await userCommand.interactionRun(client, interaction);
        }
    }
);
