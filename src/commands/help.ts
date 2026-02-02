import { CommandInteraction, EmbedBuilder } from 'discord.js';
import commands from '../../config/commands.json';
import config from '../../config/config.json';

export default function handle(interaction: CommandInteraction) {
    let embed = new EmbedBuilder()
    .setAuthor({ name: 'Catbox\'s Commands', iconURL: interaction.client.user.avatarURL({ size: 32 }) ?? undefined })
    .setColor(config.embedColor);

    let categories: string[] = [];
    commands.forEach(command => {
        let category = command.category;
        if (!categories.includes(category) && !command.operator) { 
            categories.push(category);
        };
    });

    categories.forEach(category => {
        let commandsLabel = '';
        let argumentsLabel = '';
        let descriptionLabel = '';
        commands.forEach(command => {
            if (command.category === category && !command.operator) {
                commandsLabel += '`/' + command.name + '`\n';
                descriptionLabel += command.description + '\n';
                if (command.arguments.length > 0) {
                    command.arguments.forEach(argument => {
                        argumentsLabel += '`' + argument.type + '` ';
                    });
                } else {
                   argumentsLabel += 'none'; 
                }
                argumentsLabel += '\n';
            }
        });
        embed.addFields(
            { name: category + ' Commands', value: commandsLabel, inline: true },
            { name: 'Arguments', value: argumentsLabel, inline: true },
            { name: 'Description', value: descriptionLabel, inline: true },
        );
    });
    interaction.reply({ embeds: [embed]});
};