const discord 	= require('discord.js')
const file		= require('fs')
const bot 		= new discord.Client()
const cfg 		= require('./cfg/config.json')
const cmds 		= require('./cfg/commands.json')
const txt		= require('./res/strings.json')
const command 	= require('./lib/commandhandler.js')
const parser	= require('./lib/commandparser.js')
var leaderboard = require('./data/leaderboard.json')
var currency	= require('./data/currency.json')
var temp		= require('./data/temp.json')
var maintenance = false
var betRound	= { roundTime: 30, roundInterval: 5, inProgress: false, total: 0, players: {} }

command.init(bot, cmds)

command.linkCommand('help', msg => {
	let categories = []
	Object.keys(cmds).forEach(cmd => {
		if (!categories.includes(cmds[cmd].category)) { categories.push(cmds[cmd].category) }
	}); 
	let embed = new discord.RichEmbed()
	.setAuthor('Catbox Commands', 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	.setTimestamp()
	categories.forEach(cat => {
		let txt = ''
		Object.keys(cmds).forEach(cmd => {
			if (cmds[cmd].category === cat)
			{
				txt += `\`${cfg.prefix}${cmd} ${String(cmds[cmd].args).replace(',',' ')}\`­­­­­­­­­­­­­­­\n${cmds[cmd].tip}\n`
			}
		});
		embed.addField(cat + ' commands', txt)
	});
	msg.channel.send({embed})
})

command.linkCommand('about', msg => {
	msg.channel.send({
		embed: 
		{
			color: cfg.embedcolor,
			author:
			{
				name: `${bot.users.get(cfg.author).username} and ${bot.users.get(cfg.operators[1]).username}`,
				icon_url: bot.users.get(cfg.author).avatarURL
			},
			fields: 
			[
				{
					name: 'Author',
					value: `${bot.user.username} was made by ${bot.users.get(cfg.author).tag} and ${bot.users.get(cfg.operators[1]).tag}.`
				},
				{
					name: 'Hosting',
					value: txt.ad_text
				}
			],
			footer: 
			{
			  icon_url: cfg.about_img,
			  text: txt.ad_title
			}
		}
	})
})

command.linkCommand('send', (msg, channel, message) => {
	if (channel !== undefined) { 
		channel.send(message) 
	} else {
		msg.channel.send(txt.err_no_channel)
	}
})

command.linkCommand('leaderboard', msg => {
	leaderboard = require('./data/leaderboard.json')
	currency = require('./data/currency.json')

	let richestUsers = Object.keys(currency).sort((a, b) => {
		if (bot.users.get(a) != undefined) { return currency[a] - currency[b] }
	})
	richestUsers = richestUsers.reverse().slice(0, Math.min(richestUsers.length, 10))
	let highestStreaks = Object.keys(leaderboard).sort((a, b) => {
		if (bot.users.get(a) != undefined) { return leaderboard[a] - leaderboard[b] }
	})
	highestStreaks = highestStreaks.reverse().slice(0, Math.min(highestStreaks.length, 5))

	let streakStr = richStr = ''
	let embed = new discord.RichEmbed()
	.setAuthor('Catbox Leaderboard', 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	.setTimestamp()

	for (let i = 0; i < richestUsers.length; i++) {
		const bal = currency[richestUsers[i]];
		richStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${bal} ${pluralize('cat', bal)} - **${bot.users.get(richestUsers[i]).username}**\n`
	}
	embed.addField('10 Richest Users', richStr)

	embed.addBlankField()

	for (let i = 0; i < highestStreaks.length; i++) {
		const score = leaderboard[highestStreaks[i]]
		streakStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${score} ${pluralize('cat', score)} - **${bot.users.get(highestStreaks[i]).username}**\n`
	}

	embed.addField('5 Highests Catstreaks', streakStr)
	msg.channel.send({embed})
})

command.linkCommand('spawn', (msg, member, amount) => {
	if (member instanceof Map) {
		member.forEach(m => {
			changeBalance(m.id, amount)
		});

		msg.channel.send(`**Everyone** has received ${amount} ${pluralize('cat', amount)}.`)
	} else {
		changeBalance(member.id, amount, _ => {
			msg.channel.send(`**${member.displayName}** was granted ${amount} ${pluralize('cat', amount)}.`)
		})
	}
})

command.linkCommand('give', (msg, member, amount) => {
	let user = msg.member
	
	if (getBalance(user.id) < amount) { msg.channel.send(txt.err_no_cats); return }
	if (amount <= 0) { msg.channel.send(txt.err_invalid_amt); return }

	if (member instanceof Map) {
		msg.channel.send(txt.err_no_everyone)
	} else {
		if (getBalance(user.id) >= amount) {
			changeBalance(user.id, -amount)
			changeBalance(member.id, amount, _ => {
				msg.channel.send(`**${user.displayName}** has given ${amount} ${pluralize('cat', amount)} to **${member.displayName}**.`)
			})
		} else {
			msg.channel.send(txt.err_no_cats)
		}
	}
})

command.linkCommand('balance', (msg, member) => {
	let user = member ? member.user : msg.author

	let bal = getBalance(user.id)
	msg.channel.send(`**${user.username}** has ${bal} ${pluralize('cat', bal)}`)
})

command.linkCommand('maintenance', (msg, bool) => {
	if (bool)
	{
		bot.guilds.forEach(guild => {
			guild.members.get(bot.user.id).setNickname(bot.user.username + ' (maintenance)')
		});
		msg.channel.send('Maintenance mode enabled.')
		print('Maintenance mode enabled.')
	}
	else
	{
		bot.guilds.forEach(guild => {
			guild.members.get(bot.user.id).setNickname(bot.user.username)
		});
		msg.channel.send('Maintenance mode disabled.')
		print('Maintenance mode disabled.')
	}
	maintenance = bool
})

command.linkCommand('guess', (msg, guess) => {
	let user = msg.author

	if (temp.guessRound.num === false) {
		temp.guessRound.max = randomInt(1, 5) * 100
		temp.guessRound.num = randomInt(0, temp.guessRound.max)
		temp.guessRound.total = Math.round(temp.guessRound.max / 20)
		file.writeFile('./data/temp.json', JSON.stringify(temp), () => {})
	}

	if (!guess) { 
		msg.channel.send(generateGuessRoundEmbed()) 
	} else {
		if (getBalance(user.id) <= 0) { msg.channel.send(txt.err_no_cats); return }
		if (temp.guessRound.guessed.includes(guess) || guess < 0 || guess > temp.guessRound.max) { msg.channel.send('Choose a different number.'); return }
		changeBalance(user.id, -1)
		temp.guessRound.guessed.push(guess)
		temp.guessRound.total++

		if (guess === temp.guessRound.num) {
			msg.channel.send(`**${user.username}** won ${temp.guessRound.total} ${pluralize('cat', temp.guessRound.total)}! Winning number was ${temp.guessRound.num}.`)
			changeBalance(user.id, temp.guessRound.total)
			temp.guessRound.num = false;
			temp.guessRound.guessed = []
		} else {
			msg.channel.send(`**${user.username}** guessed number ${guess}.`)
			msg.channel.send(generateGuessRoundEmbed())
		}

		file.writeFile('./data/temp.json', JSON.stringify(temp), () => {})
	}
})

command.linkCommand('check', (msg, number) => {
	let user = msg.author
	let guessNumber = temp.guessRound.num

	let cost = getGuessCheckCost()

	if (cost > getBalance(user.id)) {
		msg.channel.send(txt.err_no_cats)
		return
	}
	if (number < 0 || number > temp.guessRound.max) { msg.channel.send(`You chose an invalid number.`); return }

	changeBalance(user.id, -cost)

	temp.guessRound.total += cost
	if (guessNumber === number) {
		user.send(`${number} might be your lucky number today.`)
	} else if (guessNumber - number > 50) {
		user.send(`The number is much higher than ${number}.`)
	} else if (guessNumber - number < -50) {
		user.send(`The number is much lower than ${number}.`)
	} else if (guessNumber - number <= 50 && guessNumber - number > 0) {
		user.send(`The number is higher than ${number}.`)
	} else if (guessNumber - number >= -50 && guessNumber - number < 0) {
		user.send(`The number is lower than ${number}.`)
	} else {
		user.send(`You chose an invalid number.`)
	}
	msg.channel.send(`**${user.username}** checked number ${number} and added ${cost} ${pluralize('cat', cost)} to the pool.`)
})

command.linkCommand('bet', (msg, amount) => {
	let roundMsg = null; let user = msg.author
	if (getBalance(user.id) < amount) { msg.channel.send(txt.err_no_cats); return }
	if (amount <= 0) { msg.channel.send(txt.err_invalid_amt); return }
	changeBalance(user.id, -amount)
	betRound.total += amount
	if (betRound.players.hasOwnProperty(user.id)) {
		msg.channel.send(`**${user.username}** added ${amount} ${pluralize('cat', amount)}.`)
		betRound.players[user.id] += amount
		return
	} else {
		betRound.players[user.id] = amount
	}

	if (!betRound.inProgress)
	{
		betRound.inProgress = true
		betRound.startTime = new Date().getTime()
		msg.channel.send(`**${user.username}** just started a betting round with ${amount} ${pluralize('cat', amount)}! You have ${betRound.roundTime} seconds to join in!`)
		msg.channel.send(generateRoundEmbed()).then(msg => roundMsg = msg)
		var IID = setInterval(() => { roundMsg.edit('', generateRoundEmbed()) }, betRound.roundInterval * 1000);
		setTimeout(() => {
			clearInterval(IID)
			roundMsg.edit('', generateRoundEmbed())

			let winner = undefined; let winNum = Math.random(); let total = 0;
			shuffleArray(Object.keys(betRound.players)).forEach(ply => {
				total += betRound.players[ply] / betRound.total
				if (total >= winNum && winner == undefined) { winner = ply }
			});
			msg.channel.send(`**${bot.users.get(winner).username}** won ${betRound.total} ${pluralize('cat', betRound.total)} with a ${((betRound.players[winner] / betRound.total) * 100).toFixed(2)}% chance!`)
			changeBalance(winner, betRound.total)
			betRound.inProgress = false; betRound.total = 0; betRound.players = {}
		}, betRound.roundTime * 1000);
	}
	else
	{
		msg.channel.send(`**${user.username}** joined the current betting round with ${amount} ${pluralize('cat', amount)} (${((amount / betRound.total) * 100).toFixed(2)}% chance).`)
	}
})

command.linkCommand('config', (msg, key, value) => {
	let keyList = ['channel']
	if (key === 'list') {
		let list = 'List of available config attributes: '
		for (let i = 0; i < keyList.length - 1; i++) {
			list += `\`${keyList[i]}\``
		}; list += `\`${keyList[keyList.length - 1]}\``
		msg.channel.send(list)
	} else {
		switch (key) {
			case 'channel':
			temp = require('./data/temp.json')
				if (value === null) { 
					let list = 'List of current cat channels: '
					if (temp.channels.length < 1) {
						list += '\`none\`'
					} else {
						for (let i = 0; i < temp.channels.length - 1; i++) {
							list += `\`${temp.channels[i]}\``
						}; list += `\`${temp.channels[temp.channels.length - 1]}\``
					}
					msg.channel.send(list)
				} else {
					let channel = getChannel(msg.guild, value)
					if (channel === null) { 
						msg.channel.send(txt.err_no_channel) 
					} else {
						if (temp.channels.includes(channel.id)) {
							temp.channels.splice(temp.channels.indexOf(channel.id), 1)
							msg.channel.send(`\`${channel.name}\` was removed from the list of cat channels.`)
						} else {
							temp.channels.push(channel.id)
							msg.channel.send(`\`${channel.name}\` was added to the list of cat channels.`)
						}
					}
				}
				file.writeFile('./data/temp.json', JSON.stringify(temp), () => {})
				break;
			default:
				msg.channel.send(`Sorry boss, I could not find any attribute called '${key}'. Try \`${cfg.prefix}config list\``)
				break;
		}
	}
})

command.linkCommand('eval', (msg, code) => {
	try {
		eval(code)
	} catch (err) {
		msg.channel.send(`The following went wrong: *${err}*`)
	}
})

setInterval(() => {
	let d = new Date()
	if (d.getMinutes() === 0)
	{
		file.copyFileSync('./data/currency.json', `./data/backups/currency-${d.toISOString().substr(0, 13)}.json`)
		file.copyFileSync('./data/leaderboard.json', `./data/backups/leaderboard-${d.toISOString().substr(0, 13)}.json`)
		let total = 0
		Object.keys(temp.users).forEach(u => {
			changeBalance(u, temp.users[u])
			total += temp.users[u]
		});
		temp.users = {}
		file.writeFile('./data/temp.json', JSON.stringify(temp), () => {})
		cooldowns = {}
		print(`Backups were made and ${total} hourly cats given out.`)
	}
}, 60000);

const underbox		= '456889532227387403'
const youwhat		= '<:youwhat:534811127461445643>'
const odds			= 0.7
var cooldowns 		= {}

// Events
bot.on('ready', () =>
{
	print(`Logged in as ${bot.user.tag}!`)
	print(`Currently serving ${bot.guilds.size} servers and ${bot.users.size} users.\n`)
	bot.user.setPresence({
		game: 
		{
			name: cfg.activity,
			type: cfg.activityType.toUpperCase()
		}
	})
});

bot.on('message', msg =>
{
	msg.content = msg.cleanContent

	if (temp.channels !== undefined) { if (!temp.channels.includes(msg.channel.id)) { return } }
	
	if (!temp.users.hasOwnProperty(msg.author.id)) { 
		temp.users[msg.author.id] = 1
	} else {
		if (temp.users[msg.author.id] < 5) {
			temp.users[msg.author.id] += 1
		}
	}
	file.writeFile('./data/temp.json', JSON.stringify(temp), () => {})

	if (maintenance && msg.content !== `${cfg.prefix}maintenance false`) { return }
	
	if (msg.guild !== null) {
		if (msg.guild.id == underbox && msg.content == youwhat && msg.author.id != bot.user.id)
		{ 
			if (getBalance(msg.author.id) > 0) { sendCat(msg) }
			else { msg.channel.send(txt.warn_no_cats) }
		}
	}

	// Return if message is either from a bot or doesn't start with command prefix. Keep non-commands above this line.
	if (msg.author.bot || msg.content.substring(0, cfg.prefix.length) !== cfg.prefix) { return }

	if (cooldowns[msg.author.id] > Date.now()) { msg.channel.send(txt.warn_cooldown); return }
	else { cooldowns[msg.author.id] = Date.now() + cfg.cooldown }

	let cmd = parser(msg.content)

	// If the we cannot find the command let's try to find a command with that alias instead.
	if (cmds[cmd.cmd] === undefined) {
		let alias = Object.keys(cmds).find(x => cmds[x].alias === cmd.cmd)
		if (alias !== undefined) {
			cmd.cmd = alias
		} else {
			msg.channel.send(replaceVar(txt.err_invalid_cmd, cfg.prefix))
			return
		}
	}

	try { 
		cmds[cmd.cmd].command.run(msg, cmd.args) 
	} catch (err) { 
		console.error(err)

		if (err.message === undefined) {
			msg.channel.send(err)
		} else {
			msg.channel.send('Internal error: ' + err.message)
		}
	}
});

function print(msg)
{
	var time = new Date().toISOString().substr(11, 8)
    console.log(`(${time}) ${msg}`)
}

function sendCat(msg)
{
	changeBalance(msg.author.id, -1)
	let catStreak = 0
	let rng = Math.random()
	let cats = ''
	let curOdds = 1 - (catStreak * odds / (1 + catStreak * odds))
    while (rng <= curOdds)
	{
		cats += youwhat
		catStreak++
		rng = Math.random()
		curOdds = 1 - (catStreak * odds / (1 + catStreak * odds))
	}
	if (catStreak > 0)
	{
		saveHighscore(msg.author.id, catStreak)
		changeBalance(msg.author.id, catStreak)
		msg.channel.send(`**${msg.author.username}** earned ${catStreak} ${pluralize('cat', catStreak)} (${(curOdds * 100).toFixed(2)}% chance)\n${cats}`)
	}
}

function generateRoundEmbed()
{
	let pList = ''
	let embed = new discord.RichEmbed()
	.setAuthor(`Betting Round - Total: ${betRound.total} ${pluralize('cat', betRound.total)}`, 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	Object.keys(betRound.players).forEach(ply => {
		let curAmount = betRound.players[ply]
		pList += `${curAmount} ${pluralize('cat', curAmount)} (${((curAmount / betRound.total) * 100).toFixed(2)}%) - **${bot.users.get(ply).username}**\n`
	});
	embed.setDescription(pList)
	let timeLeft = Math.round(betRound.roundTime - (new Date().getTime() - betRound.startTime) / 1000)
	embed.setFooter(`${timeLeft} seconds left.`)
	if (timeLeft <= 0) {embed.setFooter('This round is over.')}
	return embed
}

function getGuessCheckCost () {
	return 25 + Math.floor(temp.guessRound.guessed.length/5)
}

function generateGuessRoundEmbed()
{
	let numList = `Maximum guess for this round: ${temp.guessRound.max}\n\nGuessed numbers: `
	let embed = new discord.RichEmbed()
	.setAuthor(`Guessing Round - Total: ${temp.guessRound.total} ${pluralize('cat', temp.guessRound.total)}`, 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	if (temp.guessRound.guessed[0] !== undefined && temp.guessRound.guessed[0] !== null) {
		let nums = temp.guessRound.guessed.sort((a, b) => a - b)
		for (let i = 0; i < nums.length - 1; i++) {
			numList += `${nums[i]}, `
		}
		numList += nums[nums.length - 1]
	} else { numList += 'none' }
	embed.setDescription(numList)
	.setFooter(`Guess check cost: ${getGuessCheckCost()}`)
	return embed
}

function getMember(guild, identifier)
{
	identifier = identifier.toLowerCase()
	let member = undefined
	member = guild.members.find(x => x.id === identifier || x.user.username.toLowerCase() === identifier || ((x.nickname !== null) ? x.nickname.toLowerCase() === identifier : false))
	return member
}

function getChannel(guild, identifier)
{
	identifier = identifier.toLowerCase()
	let channel = undefined
	channel = guild.channels.find(x => x.id === identifier || x.name === identifier)
	return channel
}

function saveHighscore(userID, score)
{
	var filename = './data/leaderboard.json'
	leaderboard = require(filename)
	if (!leaderboard.hasOwnProperty(userID))
	{
		leaderboard[userID] = score
		file.writeFile(filename, JSON.stringify(leaderboard), () => {})
	}
	else if (leaderboard[userID] < score) 
	{ 
		leaderboard[userID] = score
		file.writeFile(filename, JSON.stringify(leaderboard), () => {})
	}
}

function changeBalance(userID, amount, callback)
{
	var filename = './data/currency.json'
	currency = require(filename)

	if (currency.hasOwnProperty(userID)) {
		currency[userID] += amount
	} else { 
		currency[userID] = amount
	}

	file.writeFile(filename, JSON.stringify(currency), () => {})

	if (callback != null) {
		callback()
	}
}

function getBalance(userID)
{
	currency = require('./data/currency.json')
	let bal = 0

	if (currency.hasOwnProperty(userID)) 
	{
		bal = currency[userID]
	}
	return bal
}

function randomInt(min, max)
{
	return Math.round(Math.random() * (max - min) + min)
}

function pluralize(word, count)
{
	if (Math.abs(count) != 1) { return word + 's' }
	else { return word }
}

function replaceVar(str, arg)
{
	return str.replace(/%\w+%/g, arg)
}

function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    } return a;
}

bot.login(cfg.token)