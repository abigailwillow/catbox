const discord 	= require('discord.js')
const file		= require('fs')
const http		= require('http')
const https		= require('https')
const bot 		= new discord.Client()
const cfg 		= require('./cfg/config.json')
const cmds 		= require('./cfg/commands.json')
const txt		= require('./res/strings.json')
const command 	= require('./lib/commandhandler.js')
const database	= require('./lib/databasehandler.js')
let data		= require('./data/userdata.json')
let temp		= require('./data/temp.json')
let maintenance = false
let betRound	= { roundTime: 30, roundInterval: 5, inProgress: false, total: 0, players: {} }
let serverInfo	= 'http://ip-api.com/json/?fields=17411'
let snipeCache 	= {}
bot.cooldowns = {}

command.init(bot, cmds)

/** 
 * Register Commands
 */
command.registerCommand('help', msg => {
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

command.registerCommand('about', msg => {
	bot.fetchUser('144127590968459264').then(author => {
		let embed = new discord.RichEmbed()
		.setTitle(`View ${bot.user.username}'s repository`)
		.setURL('https://github.com/galaxyzd/catbox')
		.setColor(cfg.embedcolor)
		.setAuthor(`${author.tag}`, author.avatarURL, 'https://github.com/galaxyzd/')
		.setDescription(txt.ad_text)

		msg.channel.send({embed})
	})
})

command.registerCommand('send', (msg, channel, message) => {
	channel.type === 'text' ? channel.send(message) : msg.channel.send(txt.err_no_channel)
})

command.registerCommand('leaderboard', (msg, amount) => {
	amount = Math.min(Math.max(5, amount || 10), 25)
	msg.channel.startTyping()
	database.getRichestUsers(amount, users => {
		let richestUsers = ''
		users.forEach((u, index) => {
			bot.fetchUser(u.id).then(() => {
				if (index === users.length - 1) {
					users.forEach(user, user => {
						console.log(`${index}: ${discordUser.username}`)
						let userIsAuthor = discordUser && discordUser.id === msg.author.id
						let discordUser = bot.users.find(x => x.id === user.id)
						let username = `${userIsAuthor ? '>' : ''}${discordUser ? discordUser.tag : 'Unknown User'}${userIsAuthor ? '<' : ''}`
						richestUsers += `\`${('0' + (index + 1)).slice(-2)}\` ${user.formattedBalance} ${pluralize('cat', user.balance)} - **${username}\n**`
					})

					let embed = new discord.RichEmbed()
					.setAuthor('😻 Global Leaderboard')
					.setColor(cfg.embedcolor)
					.setTimestamp()
					.addField(`${amount} Richest Users`, richestUsers)
				
					msg.channel.send({embed})
					msg.channel.stopTyping()
				}
			})
		})
	})
})

command.registerCommand('spawn', (msg, member, amount) => {
	if (member instanceof Map) {
		member.forEach(m => database.getUser(m.id, user => user.changeBalance(amount, true)))
		msg.channel.send(`**All online users** were granted ${amount.toLocaleString()} ${pluralize('cat', amount)}.`)
	} else {
		database.getUser(member.id, user => {
			user.changeBalance(amount, true)
			msg.channel.send(`**${member.displayName}** was granted ${amount.toLocaleString()} ${pluralize('cat', amount)}.`)
		})
	}
})

command.registerCommand('give', (msg, member, amount) => {
	let user = msg.member

	if (database.getBalance(user.id) < amount) { msg.channel.send(txt.err_no_cats); return }
	if (amount <= 0) { msg.channel.send(txt.err_invalid_amt); return }
	if (member instanceof Map) { msg.channel.send(txt.err_no_everyone) }

	if (member instanceof Map) {
		msg.channel.send(txt.err_no_everyone)
	} else {
		if (database.getBalance(user.id) >= amount) {
			database.changeBalance(user.id, -amount)
			database.changeBalance(member.id, amount, _ => {
				msg.channel.send(`**${user.displayName}** has given ${amount.toLocaleString()} ${pluralize('cat', amount)} to **${member.displayName}**.`)
			})
		} else {
			msg.channel.send(txt.err_no_cats)
		}
	}
})

command.registerCommand('balance', (msg, member) => {
	member = member || msg.member
	database.getUser(member.id, user => msg.channel.send(`**${member.displayName}** has ${user.formattedBalance} ${pluralize('cat', user.balance)}`))
})

command.registerCommand('maintenance', (msg, maintenanceMode) => {
	bot.guilds.forEach(guild => {
		guild.me.setNickname(`${bot.user.username} ${maintenanceMode ? '(maintenance)' : ''}`)
	})

	let response = `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'}`
	msg.channel.send(response)
	print(response)

	maintenance = maintenanceMode
})

command.registerCommand('guess', (msg, guess) => {
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
		if (database.getBalance(user.id) <= 0) { msg.channel.send(txt.err_no_cats); return }
		if (temp.guessRound.guessed.includes(guess) || guess < 0 || guess > temp.guessRound.max) { msg.channel.send('Choose a different number.'); return }
		database.changeBalance(user.id, -1)
		temp.guessRound.guessed.push(guess)
		temp.guessRound.total++

		if (guess === temp.guessRound.num) {
			msg.channel.send(`**${user.username}** won ${temp.guessRound.total} ${pluralize('cat', temp.guessRound.total)}! Winning number was ${temp.guessRound.num}.`)
			database.changeBalance(user.id, temp.guessRound.total)
			temp.guessRound.num = false
			temp.guessRound.guessed = []
		} else {
			msg.channel.send(`**${user.username}** guessed number ${guess}.`)
			msg.channel.send(generateGuessRoundEmbed())
		}

		file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
	}
})

command.registerCommand('check', (msg, number) => {
	let user = msg.author
	let guessNumber = temp.guessRound.num

	let cost = getGuessCheckCost()

	if (cost > database.getBalance(user.id)) {
		msg.channel.send(txt.err_no_cats)
		return
	}
	if (number < 0 || number > temp.guessRound.max) { msg.channel.send(`You chose an invalid number.`); return }

	database.changeBalance(user.id, -cost)

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

command.registerCommand('bet', (msg, amount) => {
	let roundMsg = null; let user = msg.author
	if (database.getBalance(user.id) < amount) { msg.channel.send(txt.err_no_cats); return }
	if (amount <= 0) { msg.channel.send(txt.err_invalid_amt); return }
	database.changeBalance(user.id, -amount)
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
			database.changeBalance(winner, betRound.total)
			betRound.inProgress = false; betRound.total = 0; betRound.players = {}
		}, betRound.roundTime * 1000)
	}
	else
	{
		msg.channel.send(`**${user.username}** joined the current betting round with ${amount.toLocaleString()} ${pluralize('cat', amount)} (${((amount / betRound.total) * 100).toFixed(2)}% chance).`)
	}
})

command.registerCommand('config', (msg, key, value) => {
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

command.registerCommand('eval', (msg, code) => {
	try {
		eval(code)
	} catch (err) {
		let errorMessage = `An internal error occured: \`${err.message ? err.message : err}\``
		console.error(err)
		msg.channel.send(errorMessage)
	}
})

command.registerCommand('ping', msg => {
	msg.channel.send(`Latency to Discord is ${Math.round(bot.ping)}ms`)
	.then(m => m.edit(m.content + `, latency to catbox's server (${serverInfo.countryCode}) is ${m.createdTimestamp - msg.createdTimestamp}ms`))
})

command.registerCommand('meme', (msg, tag) => {
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

command.registerCommand('snipe', (msg, option) => {
	let curSnipeArray = []
	if (snipeCache.hasOwnProperty(msg.guild.id)) {
		if (option === 'all') {
			curSnipeArray = snipeCache[msg.guild.id]
		} else if (option === 'clear') {
			if (cfg.operators.includes(msg.author.id)) {
				snipeCache[msg.guild.id] = []
				msg.channel.send('Snipe cache was cleared.')
			} else {
				msg.channel.send(txt.err_no_operator)
			}
			return
		} else {
			for (let i = 0; i < snipeCache[msg.guild.id].length; i++) {
				if (snipeCache[msg.guild.id][i].channel.id === msg.channel.id) {
					curSnipeArray.push(snipeCache[msg.guild.id][i])
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
				`${m.content}${m.edits.length > 1 ? ` \`(edited)\`\n**Original message:**\n${m.edits[m.edits.length - 1].content}`: ''}`
				+`${m.attachments.size > 0 ? `\n**Attachment:** ${m.attachments.array()[0].proxyURL}` : ''}\n\`ID: ${m.id}\``)
			}
		})

		msg.channel.send(embed)
	} else {
		msg.channel.send("Whoops, I missed that.")
	}
})

command.registerCommand('joindate', (msg, user) => {
	let member = getMember(msg.guild, user)

	if (member != null) {
		msg.channel.send(`**${member.displayName}** joined on \`${member.joinedAt.toISOString().substring(0, 10)}\``)
	} else {
		msg.channel.send(txt.err_no_user)
	}
})

/** 
 * Bot Events
 */
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
		res.on('end', () => {
			try {
				serverInfo = JSON.parse(serverInfo)
			} catch(err) {
				console.error(err)
				print("Server info could not be retrieved.")
				serverInfo = {"country":"Unknown","countryCode":"??","org":"Server info could not be retrieved.","status":"success"}
			}
		})
	}).on('error', err => print(txt.err_no_connection))
})

bot.on('message', msg => {
	database.getUser(msg.author.id, user => {
		if (msg.author.bot || (maintenance && msg.cleanContent !== `${cfg.prefix}maintenance false`)) { return }

		if (temp.channels !== undefined) { if (temp.channels.includes(msg.channel.id)) { return } }
		
		user.activity = Math.min(user.activity + 1, 5)
		
		// Return if message is either from a bot or doesn't start with command prefix. Keep non-commands above this line.
		if (msg.author.bot || msg.cleanContent.substring(0, cfg.prefix.length) !== cfg.prefix) { return }

		if (bot.cooldowns[msg.author.id] > Date.now()) { msg.channel.send(txt.warn_cooldown); return }
		bot.cooldowns[msg.author.id] = Date.now() + cfg.cooldown 

		let cmd = command.parse(msg.cleanContent)

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
			let errorMessage = `An internal error occured: \`${err.message ? err.message : err}\``
			console.error(err)
			msg.channel.send(errorMessage)
		}
	})
})

bot.on('messageDelete', msg => {
	if (!snipeCache.hasOwnProperty(msg.guild.id)) {
		snipeCache[msg.guild.id] = []
	}

	if (snipeCache[msg.guild.id].length > 5) {
		snipeCache[msg.guild.id].pop()
	}

	snipeCache[msg.guild.id].push(msg)
})

/** 
 * Functions
 */
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
	if (identifier instanceof discord.GuildMember) {
		return identifier
	} else {
		identifier = identifier.toLowerCase()
		return guild.members.find(x => x.id === identifier || x.user.username.toLowerCase().includes(identifier) || x.displayName.toLowerCase().includes(identifier))
	}
}

function getMember(guild, identifier) {
	if (identifier instanceof discord.GuildMember) {
		return identifier
	} else {
		identifier = identifier.toLowerCase()
		return guild.members.find(x => x.id === identifier || x.user.username.toLowerCase().includes(identifier) || x.displayName.toLowerCase().includes(identifier))
	}
}

function getChannel(guild, identifier) {
	if (identifier instanceof discord.Channel) {
		return identifier
	} else {
		identifier = identifier.toLowerCase()
		return guild.channels.find(x => x.type === 'text' && (x.id === identifier || x.name.toLowerCase().includes(identifier)))
	}
}

function getUser(identifier) {
	if (identifier instanceof discord.User) {
		return identifier
	} else {
		identifier = identifier.toLowerCase()
		return bot.users.find(x => x.id === identifier || x.username.toLowerCase().includes(identifier))
	}
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