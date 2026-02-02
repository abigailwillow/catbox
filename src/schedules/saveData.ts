import * as path from 'path';
import { changeBalance } from '../utilities/balance';
import { getTempData, setTempData, backupDatabase, getDatabasePath } from '../utilities/database';

// TODO: Make this run on a cronjob or something instead of this crude bit of code
setInterval(() => {
    let d = new Date()
    if (d.getMinutes() === 0)
    {
        // Create database backup
        const backupPath = path.join(path.dirname(getDatabasePath()), 'backups', `catbox-${d.toISOString().substring(0, 13)}.db`);
        backupDatabase(backupPath);
        
        // Process hourly cats
        const tempUsers = getTempData('users') || {};
        let total = 0;
        
        Object.keys(tempUsers).forEach((u: string) => {
            changeBalance(u, tempUsers[u]);
            total += tempUsers[u];
        });
        
        // Clear hourly users
        setTempData('users', {});
        
        console.log(`Backups were made and ${total} hourly cats given out.`);
    }
}, 60000)