const discord 	= require('discord.js')
const file		= require('fs')
const bot 		= new discord.Client()
const cfg 		= require("./cfg/config.json")
const cmds 		= require("./cfg/commands.json")
const txt		= require("./res/strings.json")
const command 	= require("./lib/commandhandler.js")
var leaderboard = require("./data/leaderboard.json")
var currency	= require("./data/currency.json")
var maintenance = false
var betRound	= { roundTime: 30, roundInterval: 5, inProgress: false, total: 0, players: {} }

command.init(bot, cmds)

command.linkCommand('help', (command, msg) => {
	let categories = []
	Object.keys(cmds).forEach(cmd => {
		if (!categories.includes(cmds[cmd].category)) { categories.push(cmds[cmd].category) }
	}); 
	let embed = new discord.RichEmbed()
	.setAuthor('Catbox Commands', 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	.setTimestamp()
	categories.forEach(cat => {
		let txt = ""
		Object.keys(cmds).forEach(cmd => {
			if (cmds[cmd].category === cat)
			{
				txt += `\`${cfg.prefix}${cmd}\`­­­­­­­­­­­­­­­ -> ${cmds[cmd].tip}\n`
			}
		});
		embed.addField(cat + " commands", txt)
	});
	msg.channel.send({embed})
})

command.linkCommand('about', (command, msg) => {
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
					name: "Author",
					value: `${bot.user.username} was made by ${bot.users.get(cfg.author).tag} and ${bot.users.get(cfg.operators[1]).tag}.`
				},
				{
					name: "Hosting",
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

command.linkCommand('send', (command, msg, name, message) => {
	let channel = msg.guild.channels.find(x => x.name === name)
	if (channel != null) { channel.send(message) }
	else { msg.channel.send(txt.err_no_channel) }
})

command.linkCommand('leaderboard', (command, msg) => {
	leaderboard = require("./data/leaderboard.json")
	currency = require("./data/currency.json")

	let topDollar = Object.keys(currency).sort(function(a, b) { return currency[a] - currency[b] } )
	topDollar = topDollar.reverse().slice(0, Math.min(topDollar.length, 10))
	let topStreak = Object.keys(leaderboard).sort(function(a, b) { return leaderboard[a] - leaderboard[b] } )
	topStreak = topStreak.reverse().slice(0, Math.min(topStreak.length, 5))

	let streakStr = ""
	let richStr = ""
	let embed = new discord.RichEmbed()
	.setAuthor('Catbox Leaderboard', 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	.setTimestamp()

	for (let i = 0; i < topDollar.length; i++) {
		const bal = currency[topDollar[i]];
		richStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${bal} ${pluralize("cat", bal)} - **${bot.users.get(topDollar[i]).username}**\n`
	}
	embed.addField('10 Richest Users', richStr)

	embed.addBlankField()

	for (let i = 0; i < topStreak.length; i++) {
		const score = leaderboard[topStreak[i]];
		streakStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${score} ${pluralize("cat", score)} - **${bot.users.get(topStreak[i]).username}**\n`
	}

	embed.addField('5 Highests Catstreaks', streakStr)
	msg.channel.send({embed})
})

command.linkCommand('give', (command, msg, name, amount) => {
	if (name === '*')
	{
		msg.guild.members.forEach(user => {
			changeBalance(user.id, amount)
		});
		msg.channel.send(`**Everyone** has received ${amount} ${pluralize("cat", amount)}.`)
	}
	else
	{
		let user = bot.users.find(a => a.id === name || a.username.toLowerCase() === name.toLowerCase())

		if (user != null) {
			changeBalance(user.id, amount, _ => {
				msg.channel.send(`**${user.username}** was granted ${amount} ${pluralize("cat", amount)}`)
			})
		}
		else { msg.channel.send(txt.err_no_user) }
	}
})

command.linkCommand('balance', (command, msg, name) => {
	let user = msg.author

	if (name) {
		user = bot.users.find(a => a.id === name || a.username.toLowerCase() === name.toLowerCase())

		if (user == null) {
			msg.channel.send(txt.err_no_user); return
		}
	}

	let bal = getBalance(user.id)
	msg.channel.send(`**${user.username}** has ${bal} ${pluralize("cat", bal)}`)
})

command.linkCommand('maintenance', (command, msg, bool) => {
	if (bool)
	{
		bot.guilds.forEach(guild => {
			guild.members.get(bot.user.id).setNickname(bot.user.username + " (maintenance)")
		});
		msg.channel.send("Maintenance mode enabled.")
		print("Maintenance mode enabled.")
	}
	else
	{
		bot.guilds.forEach(guild => {
			guild.members.get(bot.user.id).setNickname(bot.user.username)
		});
		msg.channel.send("Maintenance mode disabled.")
		print("Maintenance mode disabled.")
	}
	maintenance = bool
})

command.linkCommand('bet', (command, msg, amount) => {
	let roundMsg = null; let user = msg.author
	if (getBalance(user.id) < amount) { msg.channel.send(txt.err_no_cats); return }
	if (amount <= 0) { msg.channel.send(txt.err_invalid_amt); return }
	changeBalance(user.id, -amount)
	betRound.total += amount
	if (betRound.players.hasOwnProperty(user.id)) {
		msg.channel.send(`**${user.username}** added ${amount} ${pluralize("cat", amount)}.`)
		betRound.players[user.id] += amount
		return
	} else {
		betRound.players[user.id] = amount
	}

	if (!betRound.inProgress)
	{
		betRound.inProgress = true
		betRound.startTime = new Date().getTime()
		msg.channel.send(`**${user.username}** just started a betting round with ${amount} ${pluralize("cat", amount)}! You have ${betRound.roundTime} seconds to join in!`)
		msg.channel.send(generateRoundEmbed()).then(msg => roundMsg = msg)
		var IID = setInterval(() => { roundMsg.edit("", generateRoundEmbed()) }, betRound.roundInterval * 1000);
		setTimeout(() => {
			clearInterval(IID)
			roundMsg.edit("", generateRoundEmbed())

			let winner = undefined; let winNum = Math.random(); let total = 0;
			Object.keys(betRound.players).forEach(ply => {
				total += betRound.players[ply] / betRound.total
				if (total >= winNum && winner == undefined) { winner = ply }
			});
			msg.channel.send(`**${bot.users.get(winner).username}** won ${betRound.total} ${pluralize("cat", betRound.total)} with a ${((betRound.players[winner] / betRound.total) * 100).toFixed(2)}% chance!`)
			changeBalance(winner, betRound.total)
			betRound.inProgress = false; betRound.total = 0; betRound.players = {}
		}, betRound.roundTime * 1000);
	}
	else
	{
		msg.channel.send(`**${user.username}** joined the current betting round with ${amount} ${pluralize("cat", amount)} (${((amount / betRound.total) * 100).toFixed(2)}% chance).`)
	}
})

setInterval(() => {
	let d = new Date()
	if (d.getMinutes() === 0)
	{
		file.copyFileSync("./data/currency.json", `./data/backups/currency-${d.toISOString().substr(0, 13)}.json`)
		file.copyFileSync("./data/leaderboard.json", `./data/backups/leaderboard-${d.toISOString().substr(0, 13)}.json`)
		bot.users.forEach(user => {
			changeBalance(user.id, 2)
		});
		bot.guilds.forEach(guild => {
			guild.channels.find(x => x.name === "cat").send(`**Everyone** has received 2 cats.`)
		});
		cooldowns = {}
		print("Backups were made and hourly cats given out.")
	}
}, 60000);

const underbox	= '456889532227387403'
const youwhat	= '<:youwhat:534811127461445643>'
const odds		= 0.5
var cooldowns 	= {}

// Events
bot.on("ready", () =>
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

bot.on("message", (msg) =>
{
	msg.content = msg.cleanContent

	if (maintenance && msg.content !== `${cfg.prefix}maintenance false`) { return }

	if (msg.guild.id == underbox && msg.content.includes(youwhat) && msg.content != youwhat && msg.author.id != bot.user.id) // Reacts to any message with youwhat
	{
		msg.react(youwhat.match(/(?<=:)\d+(?=>)/)[0]) // This is super inefficient but whatever
	}

	if (msg.guild.id == underbox && msg.content == youwhat && msg.author.id != bot.user.id) 
	{ 
		if (getBalance(msg.author.id) > 0) { sendCat(msg) }
		else { msg.channel.send(txt.warn_no_cats) }
	}

	// Return if message is either from a bot or doesn't start with command prefix. Keep non-commands above this line.
	if (msg.author.bot || msg.content.substring(0, cfg.prefix.length) !== cfg.prefix) { return }

	let t = new Date().getTime()
	if (cooldowns[msg.author.id] > t) { msg.channel.send(txt.warn_cooldown); return }
	else { cooldowns[msg.author.id] = t + cfg.cooldown }

	const args = msg.content.slice(cfg.prefix.length).trim().split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g)
	const cmd = args.shift().toLowerCase()
	
	for (let i = 0; i < args.length; i++) 
	{
		if (args[i].charAt(0) == `"`) { args[i] = args[i].substring(1, args[i].length) }
		if (args[i].charAt(args[i].length - 1) == `"`) { args[i] = args[i].substring(0, args[i].length - 1) }
	}

	try { cmds[cmd].command.run(msg, args) } 
	catch (err) { if (err.name === 'TypeError') { msg.channel.send(replaceVar(txt.err_invalid_cmd, cfg.prefix)) }
	else { msg.channel.send(err) } }
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
	let cats = ""
    while (rng >= odds)
	{
		cats += youwhat
		catStreak++
		rng = Math.random()
	}
	if (catStreak > 0)
	{
		saveHighscore(msg.author.id, catStreak)
		changeBalance(msg.author.id, catStreak)
		msg.channel.startTyping()
		setTimeout(function()
		{
			msg.channel.send(`**${msg.author.username}** earned ${catStreak} ${pluralize("cat", catStreak)} (${(Math.pow(odds, catStreak) * 100).toFixed(2)}% chance)\n${cats}`)
		}, randomDelay(0, 1))
		msg.channel.stopTyping()
	}
}

function generateRoundEmbed()
{
	let pList = ""
	let embed = new discord.RichEmbed()
	.setAuthor(`Betting Round - Total: ${betRound.total} ${pluralize("cat", betRound.total)}`, 'https://cdn.discordapp.com/attachments/456889532227387405/538354324028260377/youwhat_hd.png')
	.setColor(cfg.embedcolor)
	Object.keys(betRound.players).forEach(ply => {
		let curAmount = betRound.players[ply]
		pList += `${curAmount} ${pluralize("cat", curAmount)} (${((curAmount / betRound.total) * 100).toFixed(2)}%) - **${bot.users.get(ply).username}**\n`
	});
	embed.setDescription(pList)
	let timeLeft = Math.round(betRound.roundTime - (new Date().getTime() - betRound.startTime) / 1000)
	embed.setFooter(`${timeLeft} seconds left.`)
	if (timeLeft <= 0) {embed.setFooter('This round is over.')}
	return embed
}

function saveHighscore(userID, score)
{
	var filename = "./data/leaderboard.json"
	leaderboard = require(filename)
	if (!leaderboard.hasOwnProperty(userID))
	{
		leaderboard[userID] = score
		file.writeFile(filename, JSON.stringify(leaderboard), (err) => {})
	}
	else if (leaderboard[userID] < score) 
	{ 
		leaderboard[userID] = score
		file.writeFile(filename, JSON.stringify(leaderboard), (err) => {})
	}
}

function changeBalance(userID, amount, callback)
{
	var filename = "./data/currency.json"
	currency = require(filename)

	if (currency.hasOwnProperty(userID)) {
		currency[userID] += amount
	} else { 
		currency[userID] = amount
	}

	file.writeFile(filename, JSON.stringify(currency), (err) => {})

	if (callback != null) {
		callback()
	}
}

function getBalance(userID)
{
	currency = require("./data/currency.json")
	let bal = 0

	if (currency.hasOwnProperty(userID)) 
	{
		bal = currency[userID]
	}
	return bal
}

// Both read and write are fucking borked, I should fix that maybe.
async function readData(guildID, key)
{
	var filename = './data/' + guildID + '.json'
	if (file.existsSync(filename))
	{
		var data = require(filename)
	}
	return data[key]
}

async function writeData(guildID, key, value)
{
	var filename = './data/' + guildID + '.json'
	if (file.existsSync(filename))
	{
		var data = require(filename)
	}
	else
	{
		var data = {
			"name": bot.guilds.get(guildID).name,
			"owner": bot.guilds.get(guildID).owner.id
		}
	}
	if (value == null)
	{
		delete data[key]
	}
	else
	{
		data[key] = value
	}
	file.writeFile(filename, JSON.stringify(data))
}

function randomDelay(min, max)
{
	max *= 1000
	return (Math.random() + min) * max
}

function pluralize(word, count)
{
	if (count != 1) { return word + "s" }
	else { return word }
}

function replaceVar(str, arg)
{
	return str.replace(/%\w+%/g, arg)
}

bot.login(cfg.token)