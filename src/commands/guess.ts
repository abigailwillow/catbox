// command.linkCommand('guess', (msg, guess) => {
//     let user = msg.author

//     if (temp.guessRound.num === false) {
//         temp.guessRound.max = randomInt(1, 5) * 100
//         temp.guessRound.num = randomInt(0, temp.guessRound.max)
//         temp.guessRound.total = Math.round(temp.guessRound.max / 20)
//         file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
//     }

//     if (!guess) {
//         msg.channel.send(generateGuessRoundEmbed())
//     } else {
//         if (getBalance(user.id) <= 0) { msg.channel.send(txt.err_no_cats); return }
//         if (temp.guessRound.guessed.includes(guess) || guess < 0 || guess > temp.guessRound.max) { msg.channel.send('Choose a different number.'); return }
//         changeBalance(user.id, -1)
//         temp.guessRound.guessed.push(guess)
//         temp.guessRound.total++

//         if (guess === temp.guessRound.num) {
//             msg.channel.send(`**${user.username}** won ${pluralize('cat', temp.guessRound.total, true)}! Winning number was ${temp.guessRound.num}.`)
//             changeBalance(user.id, temp.guessRound.total)
//             temp.guessRound.num = false
//             temp.guessRound.guessed = []
//         } else {
//             msg.channel.send(`**${user.username}** guessed number ${guess}.`)
//             msg.channel.send(generateGuessRoundEmbed())
//         }

//         file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
//     }
// })

// function generateGuessRoundEmbed() {
//     let numList = `Maximum guess for this round: ${temp.guessRound.max}\n\nGuessed numbers: `
//     let embed = new EmbedBuilder()
//     .setAuthor({
//         name: `Guessing Round - Total: ${pluralize('cat', temp.guessRound.total, true)}`,
//         iconURL: 'https://media.discordapp.net/attachments/1467535812391473203/1467549353895002142/youwhat.png?ex=6980c957&is=697f77d7&hm=f27f8414a1627bb833827e2a1144b7445096b9cdec5aca45876a930585f2d362'
//     })
//     .setColor(config.embedColor)
//     if (temp.guessRound.guessed[0] !== undefined && temp.guessRound.guessed[0] !== null) {
//         let nums = temp.guessRound.guessed.sort((a, b) => a - b)
//         for (let i = 0; i < nums.length - 1; i++) {
//             numList += `${nums[i]}, `
//         }
//         numList += nums[nums.length - 1]
//     } else { numList += 'none' }
//     embed.setDescription(numList)
//     .setFooter({ text: `Guess check cost: ${getGuessCheckCost()}` })
//     return embed
// }