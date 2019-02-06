let cfg = require('../cfg/config.json')

module.exports = msg => {
    let cmd = ''
    let args = []

    msg = msg.slice(cfg.prefix.length).trim()

    let str = ''
    let quoteUnpaired = false
    let codeUnpaired = false
    let newlineFound = false

    for (let i = 0; i < msg.length; i++) {
        const char = msg[i]

        if (codeUnpaired) {
            if (char === '`') {
                if (msg[i + 1] === '`' && msg[i + 2] === '`') {
                    codeUnpaired = false
                    if (str !== '') { args.push(str); str = '' }
                    i += 2
                }
            } else {
                str += char
            }
        } else if (quoteUnpaired) {
            if (char === '"') {
                quoteUnpaired = false
                if (str !== '') { args.push(str.toLowerCase()); str = '' }
            } else {
                str += char
            }
        } else {
            if (char === ' ' || (!newlineFound && char === '\n')) {
                newlineFound = (char === '\n')
                if (cmd === '') {
                    cmd = str.toLowerCase()
                    str = ''
                } else {
                    if (str !== '') { args.push(str.toLowerCase); str = '' }
                }
            } else if (char === '"') {
                quoteUnpaired = true
            } else if (char === '`') {
                if (msg[i + 1] === '`' && msg[i + 2] === '`') {
                    codeUnpaired = true
                    i += 2
                }
            } else {
                str += char
            }
        }
        if (i === msg.length - 1) {
            if (str !== '') {
                if (cmd === '') {
                    cmd = str.toLowerCase()
                } else {
                    args.push(str.toLowerCase()); str = '' 
                }
            }
        }
    }

    return {cmd: cmd, args: args}
}