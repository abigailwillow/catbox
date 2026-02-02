import { ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import pluralize from 'pluralize';
import config from '../../config/config.json';

interface UserData {
    id: string;
    balance: number;
    streak: number;
}

export default function (interaction: ChatInputCommandInteraction) {
    const data: UserData[] = require('../../data/userdata.json');
    
    if (!interaction.guild) {
        interaction.reply('This command can only be used in a server.');
        return;
    }

    let validUsers: UserData[] = [];
    let richestStr = '';
    let streakStr = '';
    
    data.forEach(user => {
        const m = interaction.guild!.members.cache.get(user.id);
        if (m !== undefined && m !== null) {
            validUsers.push(user);
        }
    });

    let richest = validUsers.sort((a, b) => b.balance - a.balance);
    richest = richest.slice(0, Math.min(richest.length, 10));

    let streaks = validUsers.sort((a, b) => b.streak - a.streak);
    streaks = streaks.slice(0, Math.min(streaks.length, 5));

    for (let i = 0; i < richest.length; i++) {
        let user = richest[i];
        const member = interaction.guild.members.cache.get(user.id);
        richestStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${pluralize('cat', user.balance, true)} - **${member?.displayName}**\n`;
    }

    for (let i = 0; i < streaks.length; i++) {
        let user = streaks[i];
        const member = interaction.guild.members.cache.get(user.id);
        streakStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${pluralize('cat', user.streak, true)} - **${member?.displayName}**\n`;
    }

    const embed = new EmbedBuilder()
        .setAuthor({
            name: `${config.name} Leaderboard`,
            iconURL: 'https://media.discordapp.net/attachments/1467535812391473203/1467549353895002142/youwhat.png?ex=6980c957&is=697f77d7&hm=f27f8414a1627bb833827e2a1144b7445096b9cdec5aca45876a930585f2d362'
        })
        .setColor(config.embedColor)
        .setTimestamp()
        .addFields(
            { name: '10 Richest Users', value: richestStr || 'No users found' },
            { name: '\u200b', value: '\u200b' },
            { name: '5 Highest Catstreaks', value: streakStr || 'No users found' }
        );

    interaction.reply({ embeds: [embed] });
};