command.linkCommand('snipe', (msg, option) => {
    let curSnipeArray = []
    if (snipeArray.hasOwnProperty(msg.guild.id)) {
        if (option === 'all') {
            curSnipeArray = snipeArray[msg.guild.id]
        } else if (option === 'clear') {
            if (config.operators.includes(msg.author.id)) {
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
        let embed = new EmbedBuilder()
        .setColor(config.embedcolor)
        .setAuthor({ name: 'SNIPED! Here\'s a list of recently deleted messages.' })
        .setTimestamp()
        curSnipeArray.forEach(m => {
            if (m != null) {
                embed.addFields({
                    name: `(${m.createdAt.toString().substr(16, 8)}) ${m.member.displayName} in #${m.channel.name}`,
                    value: `${m.content}${m.edits && m.edits.length > 1 ? ` \`(edited)\`\n**Original message:**\n${m.edits[m.edits.length - 1].content}`: ''}`
                    +`${m.attachments.size > 0 ? `\n**Attachment:** ${Array.from(m.attachments.values())[0].proxyURL}` : ''}\n\`ID: ${m.id}\``
                })
            }
        })

        msg.channel.send({ embeds: [embed] })
    } else {
        msg.channel.send("Whoops, I missed that.")
    }
})

// client.on('messageDelete', msg => {
//     if (!snipeArray.hasOwnProperty(msg.guild.id)) {
//         snipeArray[msg.guild.id] = []
//     }

//     if (snipeArray[msg.guild.id].length > 5) {
//         snipeArray[msg.guild.id].pop()
//     }

//     snipeArray[msg.guild.id].push(msg)
// })