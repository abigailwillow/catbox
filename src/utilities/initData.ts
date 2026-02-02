import * as fs from 'fs';
import * as path from 'path';

// Resolve paths relative to project root
// process.cwd() returns the directory from which the process was started (project root when using npm scripts)
const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'data');
const backupsDir = path.join(dataDir, 'backups');

interface UserData {
    id: string;
    balance: number;
    streak: number;
}

// Default data structures
const defaultUserData: UserData[] = [];
const defaultTempData = {
    "guessRound": {
        "num": false,
        "max": 100,
        "total": 0,
        "guessed": []
    },
    "channels": [],
    "users": {},
    "bots": false,
    "odds": 0.5,
    "deltaOdds": 0
};

/**
 * Initialize data directory and required JSON files with sensible defaults
 */
export function initializeDataFiles(): void {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory');
    }

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
        console.log('Created data/backups directory');
    }

    // Create userdata.json if it doesn't exist
    const userdataPath = path.join(dataDir, 'userdata.json');
    if (!fs.existsSync(userdataPath)) {
        fs.writeFileSync(userdataPath, JSON.stringify(defaultUserData, null, 4));
        console.log('Created userdata.json with default values');
    }

    // Create temp.json if it doesn't exist
    const tempPath = path.join(dataDir, 'temp.json');
    if (!fs.existsSync(tempPath)) {
        fs.writeFileSync(tempPath, JSON.stringify(defaultTempData, null, 4));
        console.log('Created temp.json with default values');
    }
}

/**
 * Get the absolute path to a data file
 */
export function getDataPath(filename: string): string {
    return path.join(dataDir, filename);
}
