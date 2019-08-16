const sqlite3   = require('sqlite3').verbose()
const cron      = require('node-cron')
const file		= require('fs')
let db	= new sqlite3.Database('./data/database.db', (err) => {
    if (err) { console.error(err) }
    init()
})
const userProperties = 'userid, balance, streak'

exports.users = new Map()

let init = () => {
    db.run(`CREATE TABLE IF NOT EXISTS Users(
        userid TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0)`)

    db.run(`CREATE TABLE IF NOT EXISTS ChannelBlacklist(
        channelid TEXT PRIMARY KEY)`)

    db.run(`CREATE TABLE IF NOT EXISTS GuessData(
        correctnumber INTEGER,
        maxnumber INTEGER,
        reward INTEGER,
        guessednumbers TEXT)`)

    console.log(`(${new Date().toISOString().substr(11, 8)}) Database succesfully initialized`)
}

/**
* Registers a new user in the database
* @param {User} user The user object to add to the database
* @param {Function} callback The function to call after this user has been registered in the database
*/
exports.registerUser = (user, callback) => {
    let query = `INSERT INTO Users (${userProperties})
        VALUES ('${user.id}', ${user.balance || 0}, ${user.streak || 0})`
    db.run(query, err => {
        if (err) {
            throw err
        } else {
            if (typeof callback === 'function') {
                callback()
            }
        }
    })
}

/**
* Fetches a user from the database then caches it
* @param {String} userid The Discord ID for this user
* @param {Function} callback The function to call after this user has been fetched from the database
* @returns {User} The cached user
*/
exports.getUser = (userid, callback) => {
    let cachedUser = this.users.get(userid)
    if (cachedUser) {
        if (typeof callback === 'function') {
            callback(cachedUser)
        } else {
            throw new Error('Callback must be of type function')
        }
    } else {
        let query = `SELECT ${userProperties}
            FROM Users
            WHERE userid = '${userid}'`
        db.get(query, (err, row) => {
            if (err) {
                throw err
            } else {
                if (typeof callback === 'function') {
                    if (row) {
                        callback(new this.User(row.userid, row.balance, row.streak))
                    } else {
                        let user = new this.User(userid)
                        this.registerUser(user, () => callback(user))
                    }
                } else {
                    throw new Error('Callback must be of type function')
                }
            }
        })
    }
}

/**
* Fetches the richest users from the database
* @param {Number} max The max amount of users to get. Default: 10
* @param {Function} callback The function to call after the richest users have been fetched from the database
* @returns {Array} An array of the richest users
*/
exports.getRichestUsers = (max = 10, callback) => {
    let users = []

    let query = `SELECT ${userProperties}
    FROM Users
    ORDER BY balance DESC
    LIMIT ${max}`
    db.all(query, (err, rows) => {
        if (err) {
            throw err
        } else {
            rows.forEach(row => {   
                row ? users.push(new this.User(row.userid, row.balance, row.streak)) : undefined
            })

            if (typeof callback === 'function') {
                callback(users)
            } else {
                throw new Error('Callback must be of type function')
            }
        }
    })
}

/**
* Updates the database entry for a specific user
* @param {User} user The user to update
* @param {Function} callback The function to call after this user has been updated
*/
exports.updateUser = (user, callback) => {
    let query = `UPDATE Users
    SET balance = ${user.balance},
        streak = ${user.streak}
    WHERE userid = ${user.id}`
    db.run(query, err => {
        if (err) {
            throw err
        } else {
            if (typeof callback === 'function') {
                callback()
            }
        }
    })
}

/**
* Updates the database entry for all currently cached users
* @param {Function} callback The function to call after all users have been updated
*/
exports.updateUsers = callback => {
    this.users.forEach(u => {
        let query = `UPDATE Users
        SET balance = ${u.balance},
            streak = ${u.streak}
        WHERE userid = ${u.id}`
        db.run(query, err => {
            if (err) {
                throw err
            } else {
                if (typeof callback === 'function') {
                    callback()
                }
            }
        })
    })
}

exports.User = class User {
    /**
     * Creates a cached user object
     * @param {String} id The Discord ID for this user
     * @param {Number} balance The amount of cats this user has
     * @param {Number} streak Highest catstreak that this user has achieved
     * @param {Number} activity The current activity rating that this user has
     */
    constructor(userid, balance = 0, streak = 0, activity = 0) {
        this.id = userid
        this.balance = balance
        this.streak = streak
        this.activity = activity
        exports.users.set(userid, this)
    }

    set id(value) {
        if (this.id == null) {
            this._id = value
        } else {
    		throw new Error(`Attempted to set user ${this.id}'s ID to ${value}. Value is read-only!`)
        }
    }

    get id() { return this._id }

    get formattedBalance() { return this.balance.toLocaleString()}

    get balance() { return this._balance }
    set balance(value) { this._balance = value; this.update() }

    get streak() { return this._streak }
    set streak(value) { this._streak = value; this.update()  }

    update() {
        if (this.streak && this.balance) { exports.updateUser(this) }
    }

    changeBalance(amount) {
        let allowed = this.balance + amount < 0
        this.balance += allowed ? amount : 0
        return allowed
    }
}

/** 
 * Scheduled Tasks
 */
cron.schedule('0 * * * *', () => {
    this.updateUsers(() => {
        let date = new Date()
        let dateFormat = `${date.getFullYear()}-${('0' + date.getMonth()).slice(-2)}-${('0' + date.getDate()).slice(-2)}-${('0' + date.getHours()).slice(-2)}${('0' + date.getMinutes()).slice(-2)}`
        file.copyFile('./data/database.db', `./data/backups/database-${dateFormat}.db`, err => { if (err) { throw err } })

        let total = 0
        this.users.forEach(user => {
            user.balance += user.activity
            total += user.activity
            user.activity = 0
        })

        console.log(`(${date.toISOString().substr(11, 8)}) Database backup was made and ${total} hourly cats were spawned.`)
    })
})