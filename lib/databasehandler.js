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
        VALUES (${user.userid}, ${user.balance || 0}, ${user.balance || 0})`
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
        let query = `SELECT balance, streak, activity
        FROM Users
        WHERE userid = ${userid}`
        db.get(query, (err, row) => {
            if (err) {
                reject(err)
            } else {
                if (row) {
                    resolve(new User(userid, row.balance, row.streak))
                } else {
                    resolve(row)
                }
            }
        })
    })
}

exports.User = class User {
    /**
     * Creates a cached user object
     * @param {Number} userid The Discord ID for this user
     * @param {Number} balance The amount of cats this user has
     * @param {Number} streak Highest catstreak that this user has achieved
     */
    constructor(userid, balance, streak) {
        this.userid = userid
        this.balance = balance
        this.streak = streak
        users.set(userid, this)
    }

    /**
     * Changes the balance of this user by certain amount.
     * @param {Number} amount The amount to change the balance by. Negative to deduct.
     */
    changeBalance(amount) {

    }
}