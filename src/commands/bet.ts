command.linkCommand('bet', (msg, amount) => {
    let roundMsg = null
    let user = msg.author
    if (getBalance(user.id) < amount) { msg.channel.send(txt.err_no_cats); return }
    if (amount <= 0) { msg.channel.send(txt.err_invalid_amt); return }
    changeBalance(user.id, -amount)
    betRound.total += amount
    if (betRound.players.hasOwnProperty(user.id)) {
        msg.channel.send(`**${user.username}** added ${pluralize('cat', amount, true)}.`)
        betRound.players[user.id] += amount
        return
    } else {
        betRound.players[user.id] = amount
    }

    if (!betRound.inProgress)
    {
        betRound.inProgress = true
        betRound.startTime = new Date().getTime()
        msg.channel.send(`**${user.username}** just started a betting round with ${pluralize('cat', amount, true)}! You have ${betRound.roundTime} seconds to join in!`)
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
            msg.channel.send(`**${client.users.cache.get(winner).username}** won ${pluralize('cat', betRound.total, true)} with a ${((betRound.players[winner] / betRound.total) * 100).toFixed(2)}% chance!`)
            changeBalance(winner, betRound.total)
            betRound.inProgress = false; betRound.total = 0; betRound.players = {}
        }, betRound.roundTime * 1000)
    }
    else
    {
        msg.channel.send(`**${user.username}** joined the current betting round with ${pluralize('cat', amount, true)} (${((amount / betRound.total) * 100).toFixed(2)}% chance).`)
    }
})

// function generateRoundEmbed() {
//     let pList = ''
//     let embed = new EmbedBuilder()
//     .setAuthor({
//         name: `Betting Round - Total: ${pluralize('cat', betRound.total, true)}`,
//         iconURL: 'https://media.discordapp.net/attachments/1467535812391473203/1467549353895002142/youwhat.png?ex=6980c957&is=697f77d7&hm=f27f8414a1627bb833827e2a1144b7445096b9cdec5aca45876a930585f2d362'
//     })
//     .setColor(config.embedcolor)
//     Object.keys(betRound.players).forEach(ply => {
//         let curAmount = betRound.players[ply]
//         pList += `${pluralize('cat', curAmount, true)} (${((curAmount / betRound.total) * 100).toFixed(2)}%) - **${client.users.cache.get(ply).username}**\n`
//     })
//     embed.setDescription(pList)
//     let timeLeft = Math.round(betRound.roundTime - (new Date().getTime() - betRound.startTime) / 1000)
//     embed.setFooter({ text: `${timeLeft} seconds left.` })
//     if (timeLeft <= 0) {embed.setFooter({ text: 'This round is over.' })}
//     return embed
// }

// function shuffleArray(a) {
//     for (let i = a.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1))
//         let x = a[i]
//         a[i] = a[j]
//         a[j] = x
//     }
//     return a
// }