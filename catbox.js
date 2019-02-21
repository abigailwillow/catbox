const discord 	= require('discord.js')
const file		= require('fs')
const http		= require('http')
const https		= require('https')
const bot 		= new discord.Client()
const cfg 		= require('./cfg/config.json')
const cmds 		= require('./cfg/commands.json')
const txt		= require('./res/strings.json')
const command 	= require('./lib/commandhandler.js')
let data		= require('./data/userdata.json')
let temp		= require('./data/temp.json')
let maintenance = false
let betRound	= { roundTime: 30, roundInterval: 5, inProgress: false, total: 0, players: {} }
let serverInfo	= 'http://ip-api.com/json/?fields=17411'
let relay		= '546410870146727949'
let snipeArray 	= {}

command.init(bot, cmds)

command.linkCommand('help', msg => {
	let categories = []
	Object.keys(cmds).forEach(cmd => {
		if (!categories.includes(cmds[cmd].category) && cmds[cmd].admin !== 2) { categories.push(cmds[cmd].category) }
	})
	let embed = new discord.RichEmbed()
	.setAuthor('Catbox Commands', 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	.setTimestamp()
	categories.forEach(cat => {
		let txt = ''
		Object.keys(cmds).forEach(cmd => {
			if (cmds[cmd].category === cat && cmds[cmd].admin !== 2)
			{
				txt += `\`${cfg.prefix}${cmd} ${String(cmds[cmd].args).replace(',',' ')}\`­­­­­­­­­­­­­­­\n${cmds[cmd].tip}\n`
			}
		})
		embed.addField(cat + ' commands', txt)
	})
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
			  icon_url: txt.ad_img,
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
    data = require('./data/userdata.json')

	let validUsers = []; let richestStr = ''; let streakStr = ''
	data.forEach(user => {
		let m = getMember(msg.guild, user.id)
		if (m !== undefined && m !== null) {
			validUsers.push(user)
		}
	})

	let richest = validUsers.sort((a, b) => b.balance - a.balance)
	richest = richest.slice(0, Math.min(richest.length, 10))

	let streaks = validUsers.sort((a, b) => b.streak - a.streak)
	streaks = streaks.slice(0, Math.min(streaks.length, 5))

	for (let i = 0; i < richest.length; i++) {
		let user = richest[i]
		richestStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${user.balance.toLocaleString()} ${pluralize('cat', user.balance)} - **${getMember(msg.guild, user.id).displayName}\n**`
	}

	for (let i = 0; i < streaks.length; i++) {
		let user = streaks[i]
		streakStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${user.streak.toLocaleString()} ${pluralize('cat', user.streak)} - **${getMember(msg.guild, user.id).displayName}\n**`
	}

	let embed = new discord.RichEmbed()
	.setAuthor('Catbox Leaderboard', 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	.setTimestamp()
	.addField('10 Richest Users', richestStr)
	.addBlankField()
	.addField('5 Highest Catstreaks', streakStr)

	msg.channel.send({embed})
})

command.linkCommand('spawn', (msg, member, amount) => {
	if (member instanceof Map) {
		member.forEach(m => {
			changeBalance(m.id, amount)
		})

		msg.channel.send(`**Everyone** has received ${amount.toLocaleString()} ${pluralize('cat', amount)}.`)
	} else {
		changeBalance(member.id, amount, _ => {
			msg.channel.send(`**${member.displayName}** was granted ${amount.toLocaleString()} ${pluralize('cat', amount)}.`)
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
				msg.channel.send(`**${user.displayName}** has given ${amount.toLocaleString()} ${pluralize('cat', amount)} to **${member.displayName}**.`)
			})
		} else {
			msg.channel.send(txt.err_no_cats)
		}
	}
})

command.linkCommand('balance', (msg, member) => {
	let user = member ? member.user : msg.author

	let bal = getBalance(user.id)
	msg.channel.send(`**${user.username}** has ${bal.toLocaleString()} ${pluralize('cat', bal)}`)
})

command.linkCommand('maintenance', (msg, bool) => {
	if (bool)
	{
		bot.guilds.forEach(guild => {
			guild.members.get(bot.user.id).setNickname(bot.user.username + ' (maintenance)')
		})
		msg.channel.send('Maintenance mode enabled.')
		print('Maintenance mode enabled.')
	}
	else
	{
		bot.guilds.forEach(guild => {
			guild.members.get(bot.user.id).setNickname(bot.user.username)
		})
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
		file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
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
			temp.guessRound.num = false
			temp.guessRound.guessed = []
		} else {
			msg.channel.send(`**${user.username}** guessed number ${guess}.`)
			msg.channel.send(generateGuessRoundEmbed())
		}

		file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
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
		msg.channel.send(`**${user.username}** added ${amount.toLocaleString()} ${pluralize('cat', amount)}.`)
		betRound.players[user.id] += amount
		return
	} else {
		betRound.players[user.id] = amount
	}

	if (!betRound.inProgress)
	{
		betRound.inProgress = true
		betRound.startTime = new Date().getTime()
		msg.channel.send(`**${user.username}** just started a betting round with ${amount.toLocaleString()} ${pluralize('cat', amount)}! You have ${betRound.roundTime} seconds to join in!`)
		msg.channel.send(generateRoundEmbed()).then(msg => roundMsg = msg)
		let IID = setInterval(() => { roundMsg.edit('', generateRoundEmbed()) }, betRound.roundInterval * 1000)
		setTimeout(() => {
			clearInterval(IID)
			roundMsg.edit('', generateRoundEmbed())

			let winner = undefined; let winNum = Math.random(); let total = 0;
			shuffleArray(Object.keys(betRound.players)).forEach(ply => {
				total += betRound.players[ply] / betRound.total
				if (total >= winNum && winner == undefined) { winner = ply }
			})
			msg.channel.send(`**${bot.users.get(winner).username}** won ${betRound.total.toLocaleString()} ${pluralize('cat', betRound.total)} with a ${((betRound.players[winner] / betRound.total) * 100).toFixed(2)}% chance!`)
			changeBalance(winner, betRound.total)
			betRound.inProgress = false; betRound.total = 0; betRound.players = {}
		}, betRound.roundTime * 1000)
	}
	else
	{
		msg.channel.send(`**${user.username}** joined the current betting round with ${amount.toLocaleString()} ${pluralize('cat', amount)} (${((amount / betRound.total) * 100).toFixed(2)}% chance).`)
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
					let list = 'List of current forbidden channels: '
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
					if (channel == null) {
						msg.channel.send(txt.err_no_channel) 
					} else {
						if (temp.channels.includes(channel.id)) {
							temp.channels.splice(temp.channels.indexOf(channel.id), 1)
							msg.channel.send(`\`${channel.name}\` was removed from the list of forbidden channels.`)
						} else {
							temp.channels.push(channel.id)
							msg.channel.send(`\`${channel.name}\` was added to the list of forbidden channels.`)
						}
					}
				}
				file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
				break
			default:
				msg.channel.send(`Sorry boss, I could not find any attribute called '${key}'. Try \`${cfg.prefix}config list\``)
				break
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

command.linkCommand('ping', msg => {
	msg.channel.send(`Latency to Discord is ${Math.round(bot.ping)}ms`)
	.then(m => m.edit(m.content + `, latency to catbox's server (${serverInfo.countryCode}) is ${m.createdTimestamp - msg.createdTimestamp}ms`))
})

command.linkCommand('meme', (msg, tag) => {
	let id = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi.exec(tag)
	let data = ''
	msg.channel.startTyping()
	if (id == null) {
		let args = JSON.stringify({Tag: (tag == null) ? 'short' : tag})
		let options = {
			hostname: 'api.memes.fyi',
			path: '/Videos/Random',
			method: 'POST',
			header: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(args)
			}
		}
		
		let req = https.request(options, res => {
			res.setEncoding('utf8')
			res.on('data', x => data += x)
			res.on('end', () => {
				data = JSON.parse(data)
				if (data.Status === 200) {
					let niceURL = `https://memes.fyi/v/${data.Data.Key}`
					msg.channel.send(`Here's a random ${(tag != null) ? `${tag} ` : ''}meme by ${data.Data.Username}.\n${niceURL}`)
				} else {
					msg.channel.send(`${data.StatusMessage} (${data.Status})`)
				}
			})
		})

		req.on('error', err => msg.channel.send(txt.err_no_connection))
		req.write(args)
		req.end()
	} else {
		https.get(`https://api.memes.fyi/Video/${id}`, res => {
			res.on('data', x => data += x)
			res.on('end', () => {
				data = JSON.parse(data)
				if (data.Status === 200) {
					let tags = ''
					for (let i = 0; i < data.Data.Tags.length - 1; i++) {
						const tag = data.Data.Tags[i].Tag;
						tags += `${tag}, `
					} tags += data.Data.Tags[data.Data.Tags.length - 1].Tag
					let embed = new discord.RichEmbed()
					.setAuthor(`${data.Data.Title} ${(data.Data.NSFW) ? '(NSFW)' : ''}`, null, `https://memes.fyi/v/${data.Data.Key}`)
					.setColor(cfg.embedcolor)
					.setImage(data.Data.Thumbnail)
					.addField('Author', data.Data.Username, true)
					.addField('Tags', tags, true)
					.addField('Duration', `${('0' + Math.floor(data.Data.Duration / 60)).slice(-2)}:${('0' + data.Data.Duration % 60).slice(-2)}`, true)
					.addField('Upload Date', data.Data.DateAdded, true)
					.setFooter(`Viewed ${data.Data.Views} ${pluralize('time', data.Data.Views)}` +
					`${(data.Data.DateApproved == null) ? ' | Not yet approved' : ''}`)

					if (data.Data.Source !== '') {
						 embed.addField('Source', data.Data.Source)
					}

					embed.addBlankField(false)
		
					msg.channel.send(embed)
				} else {
					msg.channel.send(`${data.StatusMessage} (${data.Status})`)
				}
			})
		}).on('error', err => msg.channel.send(txt.err_no_connection))
	}
	msg.channel.stopTyping()
})

command.linkCommand('snipe', (msg, option) => {
	let curSnipeArray = []
	if (snipeArray.hasOwnProperty(msg.guild.id)) {
		if (option === 'all') {
			curSnipeArray = snipeArray[msg.guild.id]
		} else if (option === 'clear') {
			if (cfg.operators.includes(msg.author.id)) {
				snipeArray[msg.guild.id] = []
				msg.channel.send('Snipe cache was cleared.')
			} else {
				msg.channel.send(txt.err_no_operator)
			}
			return
		} else {
			for (let i = 0; i < snipeArray[msg.guild.id].length; i++) {
				if (snipeArray[msg.guild.id][i].channel.id === msg.channel.id) {
					curSnipeArray.push(snipeArray[msg.guild.id][i])
				}
			}
		}
	}

	if (curSnipeArray.length > 0) {
		let embed = new discord.RichEmbed()
		.setColor(cfg.embedcolor)
		.setAuthor('SNIPED! Here\'s a list of recently deleted messages.')
		.setTimestamp()
		curSnipeArray.forEach(m => {
			if (m != null) {
				embed.addField(`(${m.createdAt.toString().substr(16, 8)}) ${m.member.displayName} in #${m.channel.name}`, 
				`${m.content}${(m.attachmentURL != null) ? `\n**Attachment:** ${m.attachmentURL}` : ''}`)
			}
		})

		msg.channel.send(embed)
	} else {
		msg.channel.send("Whoops, I missed that.")
	}
})

setInterval(() => {
	let d = new Date()
	if (d.getMinutes() === 0)
	{
		file.writeFile(`./data/backups/userdata-${d.toISOString().substr(0, 13)}.json`, JSON.stringify(data), () => {})
		let total = 0
		Object.keys(temp.users).forEach(u => {
			changeBalance(u, temp.users[u])
			total += temp.users[u]
		})
		temp.users = {}
		file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
		cooldowns = {}
		print(`Backups were made and ${total} hourly cats given out.`)
	}
}, 60000)

let cooldowns = {}
temp.bots = false
temp.odds = 0.5
temp.deltaOdds = 0

// Events
bot.on('ready', () => {
	print(`Logged in as ${bot.user.tag}!`)
	print(`Currently serving ${bot.guilds.size} servers and ${bot.users.size} users.\n`)
	bot.user.setPresence({
		game: 
		{
			name: cfg.activity,
			type: cfg.activityType.toUpperCase()
		}
	})

	http.get(serverInfo, res => {
		serverInfo = ''
		res.on('data', x => serverInfo += x)
		res.on('end', () => serverInfo = JSON.parse(serverInfo))
	}).on('error', err => print(txt.err_no_connection))

	relay = bot.channels.get(relay)
})

bot.on('message', msg => {
	msg.content = msg.cleanContent

	if (msg.attachments.size > 0) {
		relay.send('', {files: [msg.attachments.array()[0].url]}).then(m => msg.attachmentURL = m.attachments.array()[0].url)
	}

	if ((msg.author.bot && !temp.bots) ||
		(maintenance && msg.content !== `${cfg.prefix}maintenance false`)) { return }

	if (temp.channels !== undefined) { if (temp.channels.includes(msg.channel.id)) { return } }
	
	if (temp.users.hasOwnProperty(msg.author.id)) { 
		if (temp.users[msg.author.id] < 5) {
			temp.users[msg.author.id] += 1
		}
	} else {
		temp.users[msg.author.id] = 1
	}
	file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
	
	// Return if message is either from a bot or doesn't start with command prefix. Keep non-commands above this line.
	if (msg.content.substring(0, cfg.prefix.length) !== cfg.prefix) { return }

	if (cooldowns[msg.author.id] > Date.now()) { 
		msg.channel.send(txt.warn_cooldown)
		return 
	} else { 
		cooldowns[msg.author.id] = Date.now() + cfg.cooldown 
	}

	let cmd = command.parseCommand(msg.content)

	// If the we cannot find the command we'll try to find a command with that alias instead.
	if (cmds[cmd.cmd] == null) {
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

		if (err.message == null) {
			msg.channel.send(err)
		} else {
			msg.channel.send('Internal error: ' + err.message)
		}
	}
})

bot.on('messageDelete', msg => {
	if (!snipeArray.hasOwnProperty(msg.guild.id)) {
		snipeArray[msg.guild.id] = []
	}

	if (snipeArray[msg.guild.id].length > 5) {
		snipeArray[msg.guild.id].pop()
	}

	snipeArray[msg.guild.id].push(msg)
})

function print(msg) {
	let time = new Date().toISOString().substr(11, 8)
    console.log(`(${time}) ${msg}`)
}

function generateRoundEmbed() {
	let pList = ''
	let embed = new discord.RichEmbed()
	.setAuthor(`Betting Round - Total: ${betRound.total.toLocaleString()} ${pluralize('cat', betRound.total)}`, 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	Object.keys(betRound.players).forEach(ply => {
		let curAmount = betRound.players[ply]
		pList += `${curAmount.toLocaleString()} ${pluralize('cat', curAmount)} (${((curAmount / betRound.total) * 100).toFixed(2)}%) - **${bot.users.get(ply).username}**\n`
	})
	embed.setDescription(pList)
	let timeLeft = Math.round(betRound.roundTime - (new Date().getTime() - betRound.startTime) / 1000)
	embed.setFooter(`${timeLeft} seconds left.`)
	if (timeLeft <= 0) {embed.setFooter('This round is over.')}
	return embed
}

function getGuessCheckCost() {
	return 25 + Math.floor(temp.guessRound.guessed.length / 5)
}

function generateGuessRoundEmbed() {
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

function getMember(guild, identifier) {
	identifier = identifier.toLowerCase()
	return guild.members.find(x => x.id === identifier || x.user.username.toLowerCase() === identifier || ((x.nickname !== null) ? x.nickname.toLowerCase() === identifier : false))
}

function getChannel(guild, identifier) {
	identifier = identifier.toLowerCase()
	return guild.channels.find(x => x.type === 'text' && (x.id === identifier || x.name.toLowerCase().includes(identifier)))
}

function saveHighscore(userID, streak) {
	data = require('./data/userdata.json')

	let user = data.find(x => x.id === userID)
	if (user == null) {
		addUser(userID, null, streak)
		return true
	} else {
		let newhs = (user.streak < streak)
		user.streak = (newhs) ? streak : user.streak
		saveData()
		return newhs
	}
}

function addUser(userID, balance, streak) {
	data = require('./data/userdata.json')
	
	if (data.find(x => x.id === userID) == null) {
		data.push({
			id: userID,
			balance: (balance == null) ? 0 : balance,
			streak: (streak == null) ? 0 : streak
		})

		saveData()
	}
}

function saveData() {
	file.writeFile('./data/userdata.json', JSON.stringify(data, null, 4), () => {})
}

function changeBalance(userID, amount, callback) {
	data = require('./data/userdata.json')

	let user = data.find(x => x.id === userID)

	if (user !== undefined) {
		user.balance += amount
	} else {
		addUser(userID, amount)
	}

	saveData()
	
	if (callback !== undefined) {
		callback()
	}
}

function getBalance(userID) {
	data = require('./data/userdata.json')

	let user = data.find(x => x.id === userID)
	return (user == null) ? 0 : user.balance
}

function randomInt(min, max) {
	return Math.round(Math.random() * (max - min) + min)
}

function randomFloat(min, max) {
	return Math.random() * (max - min) + min
}

function pluralize(word, count) {
	if (Math.abs(count) != 1) { return word + 's' }
	else { return word }
}

function replaceVar(str, arg) {
	return str.replace(/%\w+%/g, arg)
}

function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
		let x = a[i]
		a[i] = a[j]
		a[j] = x
	} 
	return a
}

bot.login(cfg.token)