command.linkCommand('ping', msg => {
    msg.channel.send(`Latency to Discord is ${Math.round(client.ws.ping)}ms`)
    .then(m => m.edit(m.content + `, latency to Catbox's server (${serverInfo.countryCode}) is ${m.createdTimestamp - msg.createdTimestamp}ms`))
})