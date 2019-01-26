const discord 	= require('discord.js')
const file		= require('fs')
const bot 		= new discord.Client()
const cfg 		= require("./cfg/config.json")
const cmds 		= require("./cfg/commands.json")
const txt		= require("./res/strings.json")
const command 	= require("./lib/commandhandler.js")
var leaderboard = require("./data/leaderboard.json")
var currency	= require("./data/currency.json")	

command.init(bot, cmds)

command.linkCommand('help', (command, msg) => {
	msg.channel.send("This should display all commands but I'm lazy, sorry.")
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
					value: txt.hosting_ad
				}
			],
			footer: 
			{
			  icon_url: cfg.about_img,
			  text: txt.ad_brand
			}
		}
	})
})

command.linkCommand('send', (command, msg, name, message) => {
	if (cfg.operators.includes(msg.author.id)) {
		let channel = bot.channels.find(x => x.name === name) 

		if (channel != null) {
			channel.send(message)

			msg.delete()
		} else {
			msg.channel.send("That channel does not exist.")
		}
	} else {
		msg.channel.send("You're not authorized to use this command.")
	}
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
	if (cfg.operators.includes(msg.author.id)) {
		
		let user = bot.users.find(a => a.id === name || a.username === name)

		if (user != null) {    
			changeBalance(user.id, amount, _ => {
				msg.channel.send(`${user.username} was granted ${amount} ${pluralize("cat", amount)}`)
			})
		}
		else { 
			msg.channel.send('Could not find that user.') 
		}
	} else { 
		msg.channel.send('Only Galaxy and Krypt can spawn cats out of thin air.') 
	}	
})

command.linkCommand('balance', (command, msg, name) => {
	let user = msg.author

	if (name) {
		user = bot.users.find(a => a.id === name || a.username === name)

		if (user == null) {    
			msg.channel.send('Could not find that user.')
			return
		}
	}

	let bal = getBalance(user.id)
	msg.channel.send(`**${user.username}** has ${bal} ${pluralize("cat", bal)}`)
})

const underbox	= '456889532227387403'
const youwhat	= '<:youwhat:534811127461445643>'

// Events
bot.on("ready", function()
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
})

bot.on("message", function(msg)
{
	msg.content = msg.cleanContent

	if (msg.guild.id == underbox && msg.content.includes(youwhat) && msg.content != youwhat && msg.author.id != bot.user.id) // Reacts to any message with youwhat
	{
		msg.react(youwhat.match(/(?<=:)\d+(?=>)/)[0]) // This is super inefficient but whatever
	}

	if (msg.guild.id == underbox && msg.content == youwhat && msg.author.id != bot.user.id) 
	{ 
		if (getBalance(msg.author.id) > 0) { sendCat(msg) }
		else { msg.channel.send(txt.warn_no_cats) }
	}

	if (msg.author.bot || msg.content.substring(0, cfg.prefix.length) !== cfg.prefix) { return } // Exit if message is either from a bot or doesn't start with prefix.	
	//I've never actually tested if the above works, but just keep non-commands above that line for now.
	const args = msg.content.slice(cfg.prefix.length).trim().split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g) // Splice where there are spaces, ignore "between quotes".
	const cmd = args.shift().toLowerCase() // First argument is now the command, first argument is args[0]
	
	for (let i = 0; i < args.length; i++) 
	{
		if (args[i].charAt(0) == `"`) { args[i] = args[i].substring(1, args[i].length) }
		if (args[i].charAt(args[i].length - 1) == `"`) { args[i] = args[i].substring(0, args[i].length - 1) }
	}

	try { cmds[cmd].command.run(msg, args) } 
	catch (err) { if (err) { msg.channel.send(err) } }
})

function print(msg)
{
	var time = new Date().toISOString().substr(11, 8)
    console.log(`(${time}) ${msg}`)
}

function sendCat(msg)
{
	let catStreak = 0
	let rng = Math.random()
	let cats = ""
    while (rng > 0.75) 
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
			msg.channel.send(`**${msg.author.username}** earned ${catStreak} ${pluralize("cat", catStreak)}\n${cats}`)
		}, randomDelay(0, 1))
		msg.channel.stopTyping()
	}
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

	if (callback) {
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

async function readData(guildID, key)
{
	var filename = './data/' + guildID + '.json'
	if (file.existsSync(filename))
	{
		var data = require(filename)
	}
	return data[key]
}
// Both read and write are fucking borked, I should fix that maybe.
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

function typeMessage(channel, msg, minDelay, maxDelay)
{
	channel.startTyping()
	setTimeout(function()
	{
		channel.send(msg)
	}, randomDelay(minDelay, maxDelay))
	channel.stopTyping()
}

function pluralize(word, count) // Fast cheap way to dynamically pluralize a word with "s".
{
	if (count != 1) { return word + "s" }
	else { return word }
}

bot.login(cfg.token)