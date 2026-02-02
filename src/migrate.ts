import * as fs from 'fs';
import * as path from 'path';
import { initializeDatabase, addUser, setTempData, closeDatabase } from './utilities/database';

interface UserDataJSON {
    id: string;
    balance: number;
    streak: number;
}

interface TempDataJSON {
    guessRound: {
        num: number | false;
        max: number;
        total: number;
        guessed: number[];
    };
    channels: string[];
    users: Record<string, number>;
    bots: boolean;
    odds: number;
    deltaOdds: number;
}

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'data');

/**
 * Migrate data from JSON files to SQLite database
 */
function migrateToSQLite() {
    console.log('Starting migration from JSON to SQLite...');

    // Initialize the database
    const db = initializeDatabase();

    // Backup existing JSON files
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupDir = path.join(dataDir, 'backups');
    
    const userdataPath = path.join(dataDir, 'userdata.json');
    const tempPath = path.join(dataDir, 'temp.json');

    if (fs.existsSync(userdataPath)) {
        const backupUserdataPath = path.join(backupDir, `userdata-pre-migration-${timestamp}.json`);
        fs.copyFileSync(userdataPath, backupUserdataPath);
        console.log(`Backed up userdata.json to ${backupUserdataPath}`);
    }

    if (fs.existsSync(tempPath)) {
        const backupTempPath = path.join(backupDir, `temp-pre-migration-${timestamp}.json`);
        fs.copyFileSync(tempPath, backupTempPath);
        console.log(`Backed up temp.json to ${backupTempPath}`);
    }

    // Migrate user data
    if (fs.existsSync(userdataPath)) {
        const userdataContent = fs.readFileSync(userdataPath, 'utf-8');
        const userData: UserDataJSON[] = JSON.parse(userdataContent);

        console.log(`Migrating ${userData.length} users...`);
        
        // Use a transaction for better performance
        const insertMany = db.transaction((users: UserDataJSON[]) => {
            for (const user of users) {
                addUser(user.id, user.balance, user.streak);
            }
        });

        insertMany(userData);
        console.log(`Successfully migrated ${userData.length} users`);
    } else {
        console.log('No userdata.json found, skipping user migration');
    }

    // Migrate temp data
    if (fs.existsSync(tempPath)) {
        const tempContent = fs.readFileSync(tempPath, 'utf-8');
        const tempData: TempDataJSON = JSON.parse(tempContent);

        console.log('Migrating temporary data...');
        setTempData('guessRound', tempData.guessRound);
        setTempData('channels', tempData.channels);
        setTempData('users', tempData.users);
        setTempData('bots', tempData.bots);
        setTempData('odds', tempData.odds);
        setTempData('deltaOdds', tempData.deltaOdds);
        console.log('Successfully migrated temporary data');
    } else {
        console.log('No temp.json found, skipping temp data migration');
    }

    closeDatabase();
    console.log('Migration completed successfully!');
    console.log('\nYou can now start your bot. The JSON files have been backed up.');
    console.log('After verifying the migration, you may delete the old JSON files if desired.');
}

// Run migration
migrateToSQLite();
