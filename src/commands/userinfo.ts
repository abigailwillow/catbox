import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, User } from "discord.js";

export default function (interaction: ChatInputCommandInteraction) {
    const mentionable = interaction.options.getMentionable('user');

    if (mentionable instanceof User || mentionable instanceof GuildMember) {
        const embed = new EmbedBuilder();

        if (mentionable instanceof GuildMember) {
            const member = mentionable ?? interaction.member as GuildMember;
            const user = member.user;
            
            embed.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL({size: 32}) })
            .setColor(member.displayHexColor);
            embed.addFields([
                {name: 'Discord ID', value: member.id, inline: true},
                {name: 'Discord Tag', value: user.tag, inline: true},
                {name: 'Account Creation Date', value: user.createdAt.toLocaleString(), inline: true},
                {name: 'Join Date', value: member.joinedAt?.toLocaleString() ?? 'Unknown', inline: true},
                {name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true},
                {name: 'Roles', value: member.roles.cache.map(role => role.toString()).join(' '), inline: true},
                {name: 'Avatar URL', value: user.displayAvatarURL({ size: 4096 }), inline: true}
            ]);
        } else {
            const user = mentionable instanceof User ? mentionable : interaction.user;
            
            embed.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({size: 32}) })
            .setColor(user.hexAccentColor ?? null);
            embed.addFields([
                {name: 'Discord ID', value: user.id, inline: true},
                {name: 'Discord Tag', value: user.tag, inline: true},
                {name: 'Account Creation Date', value: user.createdAt.toLocaleString(), inline: true},
                {name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true},
                {name: 'Avatar URL', value: user.displayAvatarURL({ size: 4096 })}
            ]);
        }

        interaction.reply({ embeds: [embed] });
    } else {
        interaction.reply('Could not retrieve user info, did you mention a role by any chance?');
    }
};