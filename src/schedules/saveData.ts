// TODO: Make this run on a cronjob or something instead of this crude bit of code
setInterval(() => {
    let d = new Date()
    if (d.getMinutes() === 0)
    {
        file.writeFile(`./data/backups/userdata-${d.toISOString().substr(0, 13)}.json`, JSON.stringify(data), () => {})
        let total = 0
        Object.keys(temp.users).forEach(u => {
            changeBalance(u, temp.users[u])
            total += temp.users[u]
        })
        temp.users = {}
        file.writeFile('./data/temp.json', JSON.stringify(temp, null, 4), () => {})
        cooldowns = {}
        print(`Backups were made and ${total} hourly cats given out.`)
    }
}, 60000)