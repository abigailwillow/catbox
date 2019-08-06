const sqlite3 = require('sqlite3').verbose()
let db	= new sqlite3.Database('./data/data.db', (err) => {
    if (err) { console.error(err) }
    init()
})

exports.users = new Map()

let init = () => {
    db.run(`CREATE TABLE IF NOT EXISTS Users(
        userid INTEGER PRIMARY KEY,
        balance INTEGER NOT NULL,
        streak INTEGER NOT NULL,
        activity INTEGER NOT NULL DEFAULT 0)`)

    db.run(`CREATE TABLE IF NOT EXISTS ChannelBlacklist(
        channelid INTEGER PRIMARY KEY)`)

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
*/
exports.registerUser = (user) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO Users (userid, balance, streak)
        VALUES (${user.id}, ${user.balance || 0}, ${user.balance || 0})`
        db.run(query, err => err ? reject(err) : resolve())
    })
}

/**
* Fetches a user from the database then caches it
* @param {Number} userid The Discord ID for this user
* @returns {User} The cached user
*/
exports.getUser = userid => {
    return new Promise((resolve, reject) => {
        let cachedUser = this.users.get(userid)
        if (cachedUser) {
            return cachedUser
        } else {
            let query = `SELECT balance, streak, activity
            FROM Users
            WHERE userid = ${userid}`
            db.get(query, (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    if (row) {
                        resolve(new User(userid, row.balance, row.streak, row.activity))
                    } else {
                        resolve(row)
                    }
                }
            })
        }
    })
}

/**
* Updates the database entry for a specific user
* @param {User} user The user to update
*/
exports.updateUser = user => {
    return new Promise((resolve, reject) => {
        let query = `UPDATE Users
        SET balance = ${user.balance},
            streak = ${user.streak}
            activity = ${user.activity}
        WHERE userid = ${user.id}`
        db.run(query, err => err ? reject(err) : resolve())
    })
}

/**
* Updates the database entry for all currently cached users
*/
exports.updateUsers = () => {
    return new Promise((resolve, reject) => {
        this.users.forEach(u => {
            let query = `UPDATE Users
            SET balance = ${u.balance},
                streak = ${u.streak}
                activity = ${u.activity}
            WHERE userid = ${u.id}`
            db.run(query, err => err ? reject(err) : resolve())
        })
    })
}

exports.User = class User {
    /**
     * Creates a cached user object
     * @param {Number} id The Discord ID for this user
     * @param {Number} balance The amount of cats this user has
     * @param {Number} streak Highest catstreak that this user has achieved
     * @param {Number} activity The current activity rating that this user has
     */
    constructor(userid, balance, streak, activity) {

        this.id = userid
        this.balance = balance || 0
        this.streak = streak || 0
        this.activity = activity || 0
        users.set(userid, this)
    }

    set id(value) {

    }
}