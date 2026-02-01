command.linkCommand('config', (msg, key, value) => {
    let keyList = ['channel']
    if (key === 'list') {
        let list = 'List of available config attributes: '
        for (let i = 0; i < keyList.length - 1; i++) {
            list += `\`${keyList[i]}\``
        }; list += `\`${keyList[keyList.length - 1]}\``
        msg.channel.send(list)
    } else {
        switch (key) {
            case 'channel':
            temp = require('./data/temp.json')
                if (value === null) {
                    let list = 'List of current forbidden channels: '
                    if (temp.channels.length < 1) {
                        list += '\`none\`'
                    } else {
                        for (let i = 0; i < temp.channels.length - 1; i++) {
                            list += `\`${temp.channels[i]}\``
                        }; list += `\`${temp.channels[temp.channels.length - 1]}\``
                    }
                    msg.channel.send(list)
                } else {
                    let channel = getChannel(msg.guild, value)
                    if (channel == null) {
                        msg.channel.send(txt.err_no_channel)
                    } else {
                        if (temp.channels.includes(channel.id)) {
                            temp.channels.splice(temp.channels.indexOf(channel.id), 1)
                            msg.channel.send(`\`${channel.name}\` was removed from the list of forbidden channels.`)
                        } else {
                            temp.channels.push(channel.id)
                            msg.channel.send(`\`${channel.name}\` was added to the list of forbidden channels.`)
                        }
                    }
                }
                file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
                break
            default:
                msg.channel.send(`Sorry boss, I could not find any attribute called '${key}'. Try \`${config.prefix}config list\``)
                break
        }
    }
})