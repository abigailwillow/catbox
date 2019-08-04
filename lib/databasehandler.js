const sqlite3 = require('sqlite3').verbose()
let db	= new sqlite3.Database('./data/data.db', (err) => {
    if (err) { console.error(err) }
    init()
})

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

    let time = new Date().toISOString().substr(11, 8)
    console.log(`(${time}) Database succesfully initialized`)
}

exports.getUserBalance = userid => {
    return new Promise((resolve, reject) => {
        let query = `SELECT balance
        FROM Users
        WHERE userid = ${userid}`
        db.get(query, (err, row) => err ? reject(err) : resolve(row ? row.balance : undefined))
    })
}

exports.userExists = (userid, callback) => {
    let query = `SELECT userid
    FROM Users
    WHERE userid = ${userid}`
    db.get(query, (err, row) => callback(row ? true : false))
}

exports.addNewUser = (userid, balance, streak) => {
    return new Promise((resolve, reject) => {
        let query = `INSERT INTO Users (userid, balance, streak)
        VALUES (${userid}, ${balance || 0}, ${streak || 0})`
        db.run(query, err => err ? reject(err) : resolve())
    })
}

exports.changeBalance = (userid, amount) => {
    return new Promise((resolve, reject) => {
        this.userExists(userid, (exists) => {
            console.log(exists)
            if (exists) {
                let query = `UPDATE Users
                SET balance = balance + ${amount}
                WHERE userid = ${userid}`
                db.run(query, err => err ? reject(err) : resolve())
            } else {
                this.addNewUser(userid, amount).then(() => resolve())
            }
        })
    })
}