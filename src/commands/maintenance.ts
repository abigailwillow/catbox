import { CommandInteraction } from 'discord.js';
import config from '../../config/config.json';

export default function handle(interaction: CommandInteraction) {
    if (process.env.MAINTENANCE === 'false') {
        interaction.client.user.setPresence({ activities: [{ name: 'Maintenance Mode' }] });
        interaction.reply('Maintenance mode enabled');
        console.log('Maintenance mode enabled by ' + interaction.user.username);
        process.env.MAINTENANCE = 'true';
    } else {
        interaction.client.user.setPresence({ activities: [{ name: config.activity }] });
        interaction.reply('Maintenance mode disabled');
        console.log('Maintenance mode disabled by ' + interaction.user.username);
        process.env.MAINTENANCE = 'false';
    }
};