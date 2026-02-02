import { CommandInteraction, GuildMember, PermissionFlagsBits } from 'discord.js';
import file from 'fs';
import path from 'path';
import commands from '../../config/commands.json';
import config from '../../config/config.json';
import localization from '../../resources/localization.json';

export default function (interaction: CommandInteraction) {
    const commandFunction = path.join(__dirname, '..', 'commands', interaction.commandName + '.js');
    if (file.existsSync(commandFunction)) {
        try {
            const command = require(commandFunction);
            const commandConfig = commands.find(command => command.name === interaction.commandName)
            if (!commandConfig) {
                interaction.reply('Sorry, no configuration is defined for this command.');
                return;
            }
            if (commandConfig.operator) {
                if (config.operators.includes(interaction.user.id)) {
                    command.default(interaction);
                } else {
                    interaction.reply(localization.error.not_operator);
                }
            } else {
                if (commandConfig.administrator && interaction.inGuild()) {
                    if (interaction.member instanceof GuildMember && interaction.member.permissions.has(PermissionFlagsBits.Administrator) || config.operators.includes(interaction.user.id)) {
                        command.default(interaction);
                    } else {
                        interaction.reply(localization.error.no_permission);
                    }
                } else {
                    command.default(interaction);
                }
            }
        } catch (error: any) {
            console.error(error);
            interaction.reply('Something went wrong while executing the command: `' + error.message + '`');
        }
    } else {
        interaction.reply('Sorry, I couldn\'t figure out how to handle your command');
        throw new Error(`${commandFunction} file not found in commands directory.`);
    }
}