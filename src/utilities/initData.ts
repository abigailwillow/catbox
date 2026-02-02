import * as path from 'path';
import { initializeDatabase, getTempData, setTempData } from './database';

// Resolve paths relative to project root
const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'data');

export interface UserData {
    id: string;
    balance: number;
    streak: number;
}

// Default temp data structure
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
 * Initialize SQLite database and default temp data
 */
export function initializeDataFiles(): void {
    // Initialize the SQLite database (creates tables if they don't exist)
    initializeDatabase();

    // Initialize temp data with defaults if not present
    if (!getTempData('guessRound')) {
        setTempData('guessRound', defaultTempData.guessRound);
    }
    if (!getTempData('channels')) {
        setTempData('channels', defaultTempData.channels);
    }
    if (!getTempData('users')) {
        setTempData('users', defaultTempData.users);
    }
    if (getTempData('bots') === null) {
        setTempData('bots', defaultTempData.bots);
    }
    if (!getTempData('odds')) {
        setTempData('odds', defaultTempData.odds);
    }
    if (!getTempData('deltaOdds')) {
        setTempData('deltaOdds', defaultTempData.deltaOdds);
    }
}

/**
 * Get the absolute path to a data file
 * Kept for backward compatibility
 */
export function getDataPath(filename: string): string {
    return path.join(dataDir, filename);
}
