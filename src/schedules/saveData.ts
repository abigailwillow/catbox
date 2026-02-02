import * as fs from 'fs';
import { changeBalance } from '../utilities/balance';
import { getDataPath } from '../utilities/initData';
import * as path from 'path';

// TODO: Make this run on a cronjob or something instead of this crude bit of code
setInterval(() => {
    let d = new Date()
    if (d.getMinutes() === 0)
    {
        const data = JSON.parse(fs.readFileSync(getDataPath('userdata.json'), 'utf-8'));
        const temp = JSON.parse(fs.readFileSync(getDataPath('temp.json'), 'utf-8'));
        const backupPath = path.join(path.dirname(getDataPath('userdata.json')), 'backups', `userdata-${d.toISOString().substring(0, 13)}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(data));
        let total = 0;
        let cooldowns: Record<string, any> = {};
        Object.keys(temp.users || {}).forEach((u: string) => {
            changeBalance(u, temp.users[u]);
            total += temp.users[u];
        });
        temp.users = {};
        fs.writeFileSync(getDataPath('temp.json'), JSON.stringify(temp, null, 4));
        cooldowns = {};
        console.log(`Backups were made and ${total} hourly cats given out.`);
    }
}, 60000)