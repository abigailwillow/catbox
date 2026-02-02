import { CommandInteraction } from "discord.js";

export default function handle(interaction: CommandInteraction, code: string) {
    try {
        eval(code);
    } catch (error) {
        interaction.reply(`The following went wrong: *${error}*`);
    }
}