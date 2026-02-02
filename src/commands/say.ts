import { ChannelType, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import localization from '../../resources/localization.json';

export default function (interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    if (message && channel?.type === ChannelType.GuildText) {
        const textChannel = channel as TextChannel;
        interaction.reply(`✅ Sent message '${message}' to ${channel}`);
        textChannel.send(message);
    } else {
        interaction.reply(localization.error.invalid_channel);
    }
};