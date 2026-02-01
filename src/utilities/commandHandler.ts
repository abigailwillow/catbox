import { CommandInteraction, GuildMember, PermissionFlagsBits } from 'discord.js';
import file from 'fs';
import path from 'path';
import commands from '../../config/commands.json';
import config from '../../config/config.json';
import localization from '../../resources/localization.json';

export function handle(interaction: CommandInteraction) {
    const commandLogic = path.join(__dirname, 'commands', interaction.commandName + '.ts');
    if (file.existsSync(commandLogic)) {
        try {
            const command = require(commandLogic);
            const commandConfig = commands.find(command => command.name === interaction.commandName)
            if (!commandConfig) {
                interaction.reply('Sorry, no configuration is defined for this command.');
                return;
            }
            if (commandConfig.operator) {
                if (config.operators.includes(interaction.user.id)) {
                    command.handle(interaction);
                } else {
                    interaction.reply(localization.error.not_operator);
                }
            } else {
                if (commandConfig.administrator && interaction.inGuild()) {
                    if (interaction.member instanceof GuildMember && interaction.member.permissions.has(PermissionFlagsBits.Administrator) || config.operators.includes(interaction.user.id)) {
                        command.handle(interaction);
                    } else {
                        interaction.reply(localization.error.no_permission);
                    }
                } else {
                    command.handle(interaction);
                }
            }
        } catch (error: any) {
            console.error(error);
            interaction.reply('Something went wrong while executing the command: `' + error.message + '`');
        }
    } else {
        interaction.reply('Sorry, I couldn\'t figure out how to handle your command');
        throw new Error(`${interaction.commandName}.ts file not found in commands directory.`);
    }
}