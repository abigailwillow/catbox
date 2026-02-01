
export function getBalance(userID) {
    data = require('./data/userdata.json')

    let user = data.find(x => x.id === userID)
    return (user == null) ? 0 : user.balance
}

export function changeBalance(userID, amount, callback) {
    data = require('./data/userdata.json')

    let user = data.find(x => x.id === userID)

    if (user !== undefined) {
        user.balance += amount
    } else {
        addUser(userID, amount)
    }

    saveData()

    if (callback !== undefined) {
        callback()
    }
}