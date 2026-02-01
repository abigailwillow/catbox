command.linkCommand('maintenance', (msg, bool) => {
    if (bool)
    {
        client.guilds.cache.forEach(guild => {
            guild.members.cache.get(client.user.id).setNickname(client.user.username + ' (maintenance)')
        })
        msg.channel.send('Maintenance mode enabled.')
        print('Maintenance mode enabled.')
    }
    else
    {
        client.guilds.cache.forEach(guild => {
            guild.members.cache.get(client.user.id).setNickname(client.user.username)
        })
        msg.channel.send('Maintenance mode disabled.')
        print('Maintenance mode disabled.')
    }
    maintenance = bool
})