
command.linkCommand('about', msg => {
    client.users.fetch(config.author).then(author => {
        client.users.fetch(config.operators[1]).then(operator => {
            msg.channel.send({
                embeds: [
                    new EmbedBuilder()
                    .setColor(config.embedcolor)
                    .setAuthor({
                        name: `${author.username} and ${operator.username}`,
                        iconURL: author.displayAvatarURL()
                    })
                    .addFields(
                        {
                            name: 'Authors',
                            value: `${client.user.username} was made by ${author.tag} and ${operator.tag}.`
                        }
                    )
                ]
            })
        })
    })
})