import { ChatInputCommandInteraction } from "discord.js";

export default function (interaction: ChatInputCommandInteraction, code: string) {
    try {
        eval(code);
    } catch (error) {
        interaction.reply(`The following went wrong: *${error}*`);
    }
}