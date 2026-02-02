// command.linkCommand('give', (msg, member, amount) => {
//     let user = msg.member

//     if (getBalance(user.id) < amount) { msg.channel.send(txt.err_no_cats); return }
//     if (amount <= 0) { msg.channel.send(txt.err_invalid_amt); return }

//     if (member instanceof Map) {
//         msg.channel.send(txt.err_no_everyone)
//     } else {
//         if (getBalance(user.id) >= amount) {
//             changeBalance(user.id, -amount)
//             changeBalance(member.id, amount, _ => {
//                 msg.channel.send(`**${user.displayName}** has given ${pluralize('cat', amount, true)} to **${member.displayName}**.`)
//             })
//         } else {
//             msg.channel.send(txt.err_no_cats)
//         }
//     }
// })