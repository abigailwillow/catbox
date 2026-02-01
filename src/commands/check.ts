command.linkCommand('check', (msg, number) => {
    let user = msg.author
    let guessNumber = temp.guessRound.num

    let cost = getGuessCheckCost()

    if (cost > getBalance(user.id)) {
        msg.channel.send(txt.err_no_cats)
        return
    }
    if (number < 0 || number > temp.guessRound.max) { msg.channel.send(`You chose an invalid number.`); return }

    changeBalance(user.id, -cost)

    temp.guessRound.total += cost
    if (guessNumber === number) {
        user.send(`${number} might be your lucky number today.`)
    } else if (guessNumber - number > 50) {
        user.send(`The number is much higher than ${number}.`)
    } else if (guessNumber - number < -50) {
        user.send(`The number is much lower than ${number}.`)
    } else if (guessNumber - number <= 50 && guessNumber - number > 0) {
        user.send(`The number is higher than ${number}.`)
    } else if (guessNumber - number >= -50 && guessNumber - number < 0) {
        user.send(`The number is lower than ${number}.`)
    } else {
        user.send(`You chose an invalid number.`)
    }
    msg.channel.send(`**${user.username}** checked number ${number} and added ${pluralize('cat', cost, true)} to the pool.`)
})

// function getGuessCheckCost() {
//     return 25 + Math.floor(temp.guessRound.guessed.length / 5)
// }