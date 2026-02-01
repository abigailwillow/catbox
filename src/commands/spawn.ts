command.linkCommand('spawn', (msg, member, amount) => {
    if (member instanceof Map) {
        member.forEach(m => {
            changeBalance(m.id, amount)
        })

        msg.channel.send(`**Everyone** has received ${pluralize('cat', amount, true)}.`)
    } else {
        changeBalance(member.id, amount, _ => {
            msg.channel.send(`**${member.displayName}** was granted ${pluralize('cat', amount, true)}.`)
        })
    }
})