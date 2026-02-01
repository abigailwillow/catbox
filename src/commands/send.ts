command.linkCommand('send', (msg, channel, message) => {
    if (channel !== undefined) {
        channel.send(message)
    } else {
        msg.channel.send(txt.err_no_channel)
    }
})