command.linkCommand('help', msg => {
    let categories = []
    Object.keys(cmds).forEach(cmd => {
        if (!categories.includes(cmds[cmd].category) && cmds[cmd].admin !== 2) { categories.push(cmds[cmd].category) }
    })
    let embed = new EmbedBuilder()
    .setAuthor({
        name: 'Catbox Commands',
        iconURL: 'https://media.discordapp.net/attachments/1467535812391473203/1467549353895002142/youwhat.png?ex=6980c957&is=697f77d7&hm=f27f8414a1627bb833827e2a1144b7445096b9cdec5aca45876a930585f2d362'
    })
    .setColor(config.embedColor)
    .setTimestamp()
    categories.forEach(cat => {
        let txt = ''
        Object.keys(cmds).forEach(cmd => {
            if (cmds[cmd].category === cat && cmds[cmd].admin !== 2)
            {
                txt += `\`${config.prefix}${cmd} ${String(cmds[cmd].args).replace(',',' ')}\`­­­­­­­­­­­­­­­\n${cmds[cmd].tip}\n`
            }
        })
        embed.addFields({ name: cat + ' commands', value: txt })
    })
    msg.channel.send({ embeds: [embed] })
})