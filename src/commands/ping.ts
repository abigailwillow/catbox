import { CommandInteraction } from "discord.js";

export default function handle(interaction: CommandInteraction) {
	interaction.reply(`Latency to Discord is ${Math.round(interaction.client.ws.ping)}ms`);
    interaction.fetchReply().then(reply => {
        const latency = new Date(reply.createdTimestamp).getTime() - interaction.createdTimestamp;
        interaction.editReply(reply.content + `, latency to Catbox's server is ${latency}ms`);
    });
};