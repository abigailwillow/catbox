import * as fs from 'fs';
import { getDataPath } from './initData';

interface UserData {
    id: string;
    balance: number;
    streak: number;
}

let data: UserData[] = [];

export function addUser(userID: string, balance?: number, streak?: number): void {
    data = JSON.parse(fs.readFileSync(getDataPath('userdata.json'), 'utf-8'))

    if (data.find((x: UserData) => x.id === userID) == null) {
        data.push({
            id: userID,
            balance: (balance == null) ? 0 : balance,
            streak: (streak == null) ? 0 : streak
        })

        saveData()
    }
}

export function saveData(): void {
    fs.writeFileSync(getDataPath('userdata.json'), JSON.stringify(data, null, 4))
}

export function saveHighscore(userID: string, streak: number): boolean {
    data = JSON.parse(fs.readFileSync(getDataPath('userdata.json'), 'utf-8'))

    let user = data.find((x: UserData) => x.id === userID)
    if (user == null) {
        addUser(userID, 0, streak)
        return true
    } else {
        let newhs = (user.streak < streak)
        user.streak = (newhs) ? streak : user.streak
        saveData()
        return newhs
    }
}