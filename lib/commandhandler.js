const txt = require('../res/strings.json')
const cfg = require('../cfg/config.json')
let cmds
let bot
let commands = []

exports.init = (cl, cjson) => { bot = cl; cmds = cjson }

function command (name, description, admin, arguments, fn)
{
    this.name = name
    this.description = description
    this.admin = admin
    this.arguments = arguments
    this.function = fn

    this.run = function (msg, args) {
        switch (this.admin) {
            case 1:
                if (!msg.member.roles.find(x => x.hasPermission('ADMINISTRATOR'))) { throw txt.err_no_admin }
                break;
            case 2:
                if (!cfg.operators.includes(msg.author.id)) { throw txt.err_no_operator }
                break;
        }

        let values = []

        for (i = 0; i < this.arguments.length; i++) {
            let value = null
            let isValid = true
            let optional = false
            let argument = this.arguments[i]
            
            if (argument.endsWith('?')) {
                argument = argument.substring(0,argument.length - 1)
                optional = true
            }

            if (args[i] !== undefined) {
                switch (argument) {
                    case 'member':
                        identifier = args[i].toLowerCase().replace(/^\@/,'')
                        
                        if (identifier === '*') {
                            value = msg.guild.members
                        } else {
                            value = msg.guild.members.find(x => 
                                x.id === identifier ||
                                x.user.username.toLowerCase().includes(identifier) || 
                                ((x.nickname !== null) ? x.nickname.toLowerCase().includes(identifier) : false)
                                )    
                                
                            if (value === null) {
                                throw txt.err_no_user
                            }
                        }
                        break;
                    case 'channel':
                        identifier = args[i].toLowerCase()
                        value = msg.guild.channels.find(x => x.type === 'text' && (x.id === identifier || x.name.toLowerCase().includes(identifier)))

                        if (value === null) {
                            throw txt.err_no_channel
                        }
                        break;
                    case 'string':
                        value = args[i]
                        break;
                    case 'number':
                        if (/^-?\d+$/g.test(args[i])) {
                            value = parseInt(args[i])
                        } else {
                            isValid = false
                        }
                        break;
                    case 'boolean':
                        if (args[i] === 'true' || args[i] === 'false') {
                            value = args[i] === 'true'
                        } else {
                            isValid = false
                        }
                        break;
                }
            } else {
                if (!optional) {
                    isValid = false
                }
            }

            if (!isValid) throw txt.err_invalid_arg + argument

            values.push(value)
        }

        this.function(msg, ...values)
    }
}

exports.linkCommand = function (name, fn) 
{
    if (!cmds.hasOwnProperty(name))
    {
        throw `Command '${name}' does not exist in commands.json!`
    }

    let cmd = cmds[name]

    if (cmd.enabled instanceof Boolean && !cmd.enabled) return

    cmd.command = new command(name, cmd.tip, cmd.admin, cmd.args, fn)
}