import chalk from 'chalk';
import { CommandInteraction, Message } from 'discord.js';
import { ExtendedClient } from './bot/client';
import { Command } from './bot/handler/command';

export const logger = {
    info: (...message: string[]) =>
        console.log(chalk.yellowBright('[INFO]    '), ...message),
    success: (...message: string[]) =>
        console.log(chalk.greenBright('[SUCCESS] '), ...message),
    error: (...message: string[]) =>
        console.log(chalk.redBright('[ERROR]    '), ...message),
    empty: () => console.log(' '),
};

export const commandCooldown = async (
    command: Command,
    userId: string,
    sender: CommandInteraction | Message,
    manager: ExtendedClient
) => {
    let userHasCooldown: boolean = false;
    let timeLeft: number;
    if (!command.commandInfo.commandData.cooldown) return false;

    const currentCooldown = await manager.db.cooldown.findUnique({
        where: {
            userId_commandName: {
                userId: userId,
                commandName: command.commandInfo.commandData.name,
            },
        },
    });

    if (currentCooldown) {
        const timeDifference = Date.now() - currentCooldown.createdAt.getTime();

        if (timeDifference < command.commandInfo.commandData.cooldown) {
            timeLeft =
                command.commandInfo.commandData.cooldown - timeDifference;

            userHasCooldown = true;
        } else {
            await manager.db.cooldown.delete({
                where: {
                    userId_commandName: {
                        userId: userId,
                        commandName: command.commandInfo.commandData.name,
                    },
                },
            });
        }
    }

    if (!userHasCooldown) {
        await manager.db.cooldown.create({
            data: {
                duration: command.commandInfo.commandData.cooldown,
                userId: userId,
                commandName: command.commandInfo.commandData.name,
            },
        });
    }

    if (userHasCooldown)
        if (sender instanceof Message) {
            await sender.reply(
                `You are on Cooldown for \`${msToTime(timeLeft!)}\``
            );
        } else {
            await sender.reply({
                ephemeral: true,
                content: `You are on Cooldown for \`${msToTime(timeLeft!)}\``,
            });
        }

    return userHasCooldown;
};

export const botPermission = async (
    command: Command,
    client: ExtendedClient,
    sender: CommandInteraction | Message
) => {
    let isBotAuthorised: boolean = true;

    const perms =
        command.commandInfo.commandConfig.requiredPermissions?.bot?.reduce(
            (p, c) => p | c
        );
    if (!perms) return true;

    const botMember = sender.guild?.members.cache.get(client.user?.id!)!;
    if (!botMember) return false;

    if (botMember.permissions.missing(perms).length > 0)
        isBotAuthorised = false;

    if (!isBotAuthorised)
        if (sender instanceof Message) {
            await sender.reply(
                `Bot is missing permission \`${botMember.permissions
                    .missing(perms)
                    .join(', ')}\``
            );
        } else {
            await sender.reply({
                ephemeral: true,
                content: `Bot is missing permission \`${botMember.permissions
                    .missing(perms)
                    .join(', ')}\``,
            });
        }

    return isBotAuthorised;
};

export const userPermision = async (
    command: Command,
    userId: string,
    sender: CommandInteraction | Message
) => {
    let isUserAuthorised: boolean = true;
    const member = sender.guild?.members.cache.get(userId)!;
    if (!member) return false;

    const perms =
        command.commandInfo.commandConfig.requiredPermissions?.user?.reduce(
            (p, c) => p | c
        );
    if (!perms) return true;
    if (member.permissions.missing(perms).length > 0) isUserAuthorised = false;

    if (!isUserAuthorised)
        if (sender instanceof Message) {
            await sender.reply(
                `You are missing permission \`${member.permissions
                    .missing(perms)
                    .join(', ')}\``
            );
        } else {
            await sender.reply({
                ephemeral: true,
                content: `You are missing permission \`${member.permissions
                    .missing(perms)
                    .join(', ')}\``,
            });
        }

    return isUserAuthorised;
};

export const msToTime = (duration: number) => {
    var milliseconds = Math.floor((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    const newHour = hours < 10 ? '0' + hours : hours;
    const newMinute = minutes < 10 ? '0' + minutes : minutes;
    const newSecond = seconds < 10 ? '0' + seconds : seconds;

    let unit = 'seconds';
    if (minutes > 0) unit = 'minutes';
    if (hours > 0) unit = 'hours';

    return (
        newHour +
        ':' +
        newMinute +
        ':' +
        newSecond +
        '.' +
        milliseconds +
        ' ' +
        unit
    );
};
