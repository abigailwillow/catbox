import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'data');
const dbPath = path.join(dataDir, 'catbox.db');

let db: Database.Database | null = null;

export interface UserData {
    id: string;
    balance: number;
    streak: number;
}

export interface TempData {
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

/**
 * Initialize SQLite database and create tables if they don't exist
 */
export function initializeDatabase(): Database.Database {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory');
    }

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(dataDir, 'backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
        console.log('Created data/backups directory');
    }

    db = new Database(dbPath);
    
    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL');
    
    // Create users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            balance INTEGER NOT NULL DEFAULT 0,
            streak INTEGER NOT NULL DEFAULT 0
        )
    `);

    // Create temp_data table for storing temporary game state
    db.exec(`
        CREATE TABLE IF NOT EXISTS temp_data (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);

    console.log('SQLite database initialized');
    return db;
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Add a new user to the database
 */
export function addUser(userID: string, balance: number = 0, streak: number = 0): void {
    const db = getDatabase();
    const stmt = db.prepare('INSERT OR IGNORE INTO users (id, balance, streak) VALUES (?, ?, ?)');
    stmt.run(userID, balance, streak);
}

/**
 * Get a user's balance
 */
export function getBalance(userID: string): number {
    const db = getDatabase();
    const stmt = db.prepare('SELECT balance FROM users WHERE id = ?');
    const row = stmt.get(userID) as { balance: number } | undefined;
    return row ? row.balance : 0;
}

/**
 * Change a user's balance by the specified amount
 */
export function changeBalance(userID: string, amount: number): void {
    const db = getDatabase();
    
    // Check if user exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE id = ?');
    const userExists = checkStmt.get(userID);
    
    if (userExists) {
        const updateStmt = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?');
        updateStmt.run(amount, userID);
    } else {
        // Add new user with the amount as initial balance
        addUser(userID, amount, 0);
    }
}

/**
 * Get a user's streak
 */
export function getStreak(userID: string): number {
    const db = getDatabase();
    const stmt = db.prepare('SELECT streak FROM users WHERE id = ?');
    const row = stmt.get(userID) as { streak: number } | undefined;
    return row ? row.streak : 0;
}

/**
 * Save a user's highscore streak
 */
export function saveHighscore(userID: string, streak: number): boolean {
    const db = getDatabase();
    
    // Check if user exists
    const checkStmt = db.prepare('SELECT streak FROM users WHERE id = ?');
    const row = checkStmt.get(userID) as { streak: number } | undefined;
    
    if (!row) {
        addUser(userID, 0, streak);
        return true;
    } else {
        const isNewHighscore = row.streak < streak;
        if (isNewHighscore) {
            const updateStmt = db.prepare('UPDATE users SET streak = ? WHERE id = ?');
            updateStmt.run(streak, userID);
        }
        return isNewHighscore;
    }
}

/**
 * Get all users sorted by balance
 */
export function getUsersByBalance(limit?: number): UserData[] {
    const db = getDatabase();
    const query = limit 
        ? 'SELECT id, balance, streak FROM users ORDER BY balance DESC LIMIT ?'
        : 'SELECT id, balance, streak FROM users ORDER BY balance DESC';
    
    const stmt = db.prepare(query);
    const rows = limit ? stmt.all(limit) : stmt.all();
    return rows as UserData[];
}

/**
 * Get all users sorted by streak
 */
export function getUsersByStreak(limit?: number): UserData[] {
    const db = getDatabase();
    const query = limit 
        ? 'SELECT id, balance, streak FROM users ORDER BY streak DESC LIMIT ?'
        : 'SELECT id, balance, streak FROM users ORDER BY streak DESC';
    
    const stmt = db.prepare(query);
    const rows = limit ? stmt.all(limit) : stmt.all();
    return rows as UserData[];
}

/**
 * Get all users
 */
export function getAllUsers(): UserData[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, balance, streak FROM users');
    return stmt.all() as UserData[];
}

/**
 * Get a user by ID
 */
export function getUser(userID: string): UserData | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, balance, streak FROM users WHERE id = ?');
    return stmt.get(userID) as UserData | undefined;
}

/**
 * Store temporary data (like guess rounds, hourly earnings)
 */
export function setTempData(key: string, value: any): void {
    const db = getDatabase();
    const stmt = db.prepare('INSERT OR REPLACE INTO temp_data (key, value) VALUES (?, ?)');
    stmt.run(key, JSON.stringify(value));
}

/**
 * Get temporary data
 */
export function getTempData(key: string): any {
    const db = getDatabase();
    const stmt = db.prepare('SELECT value FROM temp_data WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : null;
}

/**
 * Delete temporary data
 */
export function deleteTempData(key: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM temp_data WHERE key = ?');
    stmt.run(key);
}

/**
 * Create a backup of the database
 */
export function backupDatabase(backupPath: string): void {
    const db = getDatabase();
    db.backup(backupPath);
}

/**
 * Get the database file path
 */
export function getDatabasePath(): string {
    return dbPath;
}
