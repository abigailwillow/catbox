import { CommandInteraction } from 'discord.js';
import config from '../../config/config.json';

export default function (interaction: CommandInteraction) {
    const latency = interaction.client.ws.ping === -1 ? 'N/A ' : `${Math.round(interaction.client.ws.ping)}ms`;
	interaction.reply(`Latency to Discord is ${latency}ms`);
    interaction.fetchReply().then(reply => {
        const latency = new Date(reply.createdTimestamp).getTime() - interaction.createdTimestamp;
        interaction.editReply(reply.content + `, latency to ${config.name}'s server is ${latency}ms`);
    });
};