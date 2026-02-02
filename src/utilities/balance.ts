import { getBalance as dbGetBalance, changeBalance as dbChangeBalance } from './database';

export interface UserData {
    id: string;
    balance: number;
    streak: number;
}

export function getBalance(userID: string): number {
    return dbGetBalance(userID);
}

export function changeBalance(userID: string, amount: number): void {
    dbChangeBalance(userID, amount);
}