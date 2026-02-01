command.linkCommand('userinfo', (msg, user) => {
    let member = getMember(msg.guild, user)

    if (member != null) {
        msg.channel.send(`**${member.displayName}** joined on \`${member.joinedAt.toISOString().substring(0, 10)}\``)
    } else {
        msg.channel.send(txt.err_no_user)
    }
})