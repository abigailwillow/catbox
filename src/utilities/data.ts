import { addUser as dbAddUser, saveHighscore as dbSaveHighscore } from './database';

export interface UserData {
    id: string;
    balance: number;
    streak: number;
}

export function addUser(userID: string, balance?: number, streak?: number): void {
    dbAddUser(userID, balance ?? 0, streak ?? 0);
}

// Deprecated: saveData is no longer needed with SQLite as writes are immediate
// Kept for backward compatibility but does nothing
export function saveData(): void {
    // SQLite writes are immediate, no need to save
}

export function saveHighscore(userID: string, streak: number): boolean {
    return dbSaveHighscore(userID, streak);
}