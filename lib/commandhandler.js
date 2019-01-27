const txt = require("../res/strings.json")
let commandJson
let client
let commands = []

exports.init = function (cl, cjson) 
{
    client = cl
    commandJson = cjson
}

function command (name, description, adminOnly, arguments, fn)
{
    this.name = name
    this.description = description
    this.adminOnly = adminOnly
    this.arguments = arguments
    this.function = fn

    this.run = function (msg, args) {
        let user = msg.author

        if (this.adminOnly) {
            if (!user.highestRole.hasPermission("ADMINISTRATOR")) {
                throw txt.err_no_admin
            }
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

            if (args[i] != undefined) {
                switch (argument) {
                    case 'string':
                        value = args[i]
                    break
                    case 'number':
                        if (/^-?\d+$/g.test(args[i])) {
                            value = parseInt(args[i])
                        } else {
                            isValid = false
                        }
                    break
                    case 'boolean':
                        if (args[i] === "true" || args[i] === "false") {
                            value = args[i] === "true"
                        } else {
                            isValid = false
                        }
                    break
                }
            } else {
                if (!optional) {
                    isValid = false
                }
            }

            if (!isValid) throw txt.err_invalid_arg + argument

            values.push(value)
        }

        this.function(this, msg, ...values)
    }
}

exports.linkCommand = function (name, fn) 
{
    if (!commandJson.hasOwnProperty(name))
    {
        throw `Command ${name} does not exist!`
    }

    let commandObject = commandJson[name]

    commandObject.command = 
    new command(
        name,
        commandObject.tip,
        commandObject.admin,
        commandObject.args,
        fn
    )
}