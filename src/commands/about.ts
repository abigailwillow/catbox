import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import config from '../../config/config.json';

export async function handle (interaction: ChatInputCommandInteraction) {
    const author = await interaction.client.users.fetch(config.author);
    const operator = await interaction.client.users.fetch(config.operators[1]);
    let embed = new EmbedBuilder()
        .setTitle(`About ${config.name}`)
        .setURL('https://github.com/abigailwillow/catbox')
        .setColor(config.embedColor)
        .setAuthor({
            name: `${author.username} and ${operator.username}`,
            iconURL: author.displayAvatarURL()
        })
        .setDescription('Felis ipsum dolor sit amet, consectetur purring elit. Sed do eiusmod meow-incididunt ut labore et kitten magna aliqua. Ut enim ad minim whiskers, quis nostrud scratching ullamco laboris nisi ut pounce ex ea commodo consequat. Duis aute irure felis in pounces-rehenderit in paws-tate velit esse cillum meow-lore eu pounce nulla pariatur.');
    interaction.reply({ embeds: [embed] });
}
