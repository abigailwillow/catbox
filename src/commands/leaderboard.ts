// command.linkCommand('leaderboard', msg => {
//     data = require('./data/userdata.json')

//     let validUsers = []; let richestStr = ''; let streakStr = ''
//     data.forEach(user => {
//         let m = getMember(msg.guild, user.id)
//         if (m !== undefined && m !== null) {
//             validUsers.push(user)
//         }
//     })

//     let richest = validUsers.sort((a, b) => b.balance - a.balance)
//     richest = richest.slice(0, Math.min(richest.length, 10))

//     let streaks = validUsers.sort((a, b) => b.streak - a.streak)
//     streaks = streaks.slice(0, Math.min(streaks.length, 5))

//     for (let i = 0; i < richest.length; i++) {
//         let user = richest[i]
//         richestStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${pluralize('cat', user.balance, true)} - **${getMember(msg.guild, user.id).displayName}\n**`
//     }

//     for (let i = 0; i < streaks.length; i++) {
//         let user = streaks[i]
//         streakStr += `\`${('0' + (i + 1)).slice(-2)}.\` ${pluralize('cat', user.streak, true)} - **${getMember(msg.guild, user.id).displayName}\n**`
//     }

//     let embed = new EmbedBuilder()
//     .setAuthor({
//         name: 'Catbox Leaderboard',
//         iconURL: 'https://media.discordapp.net/attachments/1467535812391473203/1467549353895002142/youwhat.png?ex=6980c957&is=697f77d7&hm=f27f8414a1627bb833827e2a1144b7445096b9cdec5aca45876a930585f2d362'
//     })
//     .setColor(config.embedColor)
//     .setTimestamp()
//     .addFields(
//         { name: '10 Richest Users', value: richestStr },
//         { name: '\u200b', value: '\u200b' },
//         { name: '5 Highest Catstreaks', value: streakStr }
//     )

//     msg.channel.send({ embeds: [embed] })
// })