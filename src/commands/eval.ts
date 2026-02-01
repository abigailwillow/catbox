command.linkCommand('eval', (msg, code) => {
    try {
        eval(code)
    } catch (err) {
        msg.channel.send(`The following went wrong: *${err}*`)
    }
})