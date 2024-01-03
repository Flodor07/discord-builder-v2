import { EventListener } from '../bot/handler/event';
import { env } from '../env';
import { botPermission, commandCooldown, userPermision } from '../utils';

export default new EventListener('messageCreate', async (client, message) => {
    if (!message.content.startsWith(env.PREFIX)) return;

    const messageContentSplit = message.content
        .slice(env.PREFIX.length)
        .split(' ');
    const command = client.leagacyCommands.get(messageContentSplit[0]);
    const leagacyCommand = command?.commandInfo.commandData.legacyCommand;

    if (!command || !leagacyCommand) return;

    if (!(await botPermission(command, client, message))) return;
    if (!(await userPermision(command, message.author.id, message))) return;
    if (await commandCooldown(command, message.author.id, message, client))
        return;

    messageContentSplit.shift();
    await leagacyCommand.leagacyRun(client, message, messageContentSplit);
});
