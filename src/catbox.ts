require('console-stamp')(console, { format: ':date(HH:MM:ss.l) :label' });

import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import pluralize from 'pluralize';
import config from '../config/config.json';
import handler from './utilities/commandHandler';

const client = new Client( {
        intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
        ]
});

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}!`)
    console.log(`Currently serving ${pluralize('guild', client.guilds.cache.size, true)} and ${pluralize('user', client.users.cache.size, true)}.\n`)
    client.user.setPresence({ status: 'online', activities: [{ name: config.activity, type: ActivityType[config.activityType] }] });
    process.env.MAINTENANCE = 'false';
});

client.on('interactionCreate', interaction => {
    if (interaction.isCommand() && (process.env.MAINTENANCE === 'false' || interaction.commandName === 'maintenance')) {
        handler.handle(interaction);
    }
});

client.on('applicationCommandCreate', command => {
    console.log(`Registered command: ${command}`);
});

client.on('messageCreate', message => {
	if (message.content.toLowerCase().replace(/[^\w\s]/g, '').match(/\bi(?:m| am)[\w ]{0,24}ga+y\b/g) && !message.author.bot) {
		message.reply('We know');
	}

	message.channel.messages.fetch({ limit: 2, before: message.id }).then(messages => {
		if (messages.size === 2 && messages.every(m =>
				m.content == message.content &&
				!m.author.bot &&
				!message.author.bot &&
				m.content != '' &&
				m.author != message.author
			)) {
			message.channel.send(message.content);
		}
	});
});

client.login(config.token).catch((error) => {
    console.error('\nFailed to connect to Discord!')

    if (error.message && error.message.includes('disallowed intents')) {
        console.error('\nThis bot requires privileged intents to be enabled.')
    } else if (error.message && error.message.includes('token')) {
        console.error('\nThe bot\'s token appears to be invalid.')
    } else {
        console.error('Unknown error:', error.message || error)
    }

    process.exit(1)
})

// TODO: Make this run on a cronjob or something instead of this crude bit of code
// setInterval(() => {
//     let d = new Date()
//     if (d.getMinutes() === 0)
//     {
//         file.writeFile(`./data/backups/userdata-${d.toISOString().substr(0, 13)}.json`, JSON.stringify(data), () => {})
//         let total = 0
//         Object.keys(temp.users).forEach(u => {
//             changeBalance(u, temp.users[u])
//             total += temp.users[u]
//         })
//         temp.users = {}
//         file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
//         cooldowns = {}
//         print(`Backups were made and ${total} hourly cats given out.`)
//     }
// }, 60000)
