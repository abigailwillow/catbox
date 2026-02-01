function addUser(userID, balance, streak) {
    data = require('./data/userdata.json')

    if (data.find(x => x.id === userID) == null) {
        data.push({
            id: userID,
            balance: (balance == null) ? 0 : balance,
            streak: (streak == null) ? 0 : streak
        })

        saveData()
    }
}

function saveData() {
    file.writeFile('./data/userdata.json', JSON.stringify(data, null, 4), () => {})
}

function saveHighscore(userID, streak) {
    data = require('./data/userdata.json')

    let user = data.find(x => x.id === userID)
    if (user == null) {
        addUser(userID, null, streak)
        return true
    } else {
        let newhs = (user.streak < streak)
        user.streak = (newhs) ? streak : user.streak
        saveData()
        return newhs
    }
}