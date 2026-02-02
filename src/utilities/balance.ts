import * as fs from 'fs';
import { addUser, saveData } from './data';
import { getDataPath } from './initData';

interface UserData {
    id: string;
    balance: number;
    streak: number;
}

let data: UserData[] = [];

export function getBalance(userID: string): number {
    data = JSON.parse(fs.readFileSync(getDataPath('userdata.json'), 'utf-8'))

    let user = data.find((x: UserData) => x.id === userID)
    return (user == null) ? 0 : user.balance
}

export function changeBalance(userID: string, amount: number): void {
    data = JSON.parse(fs.readFileSync(getDataPath('userdata.json'), 'utf-8'))

    let user = data.find((x: UserData) => x.id === userID)

    if (user !== undefined) {
        user.balance += amount
    } else {
        addUser(userID, amount)
    }

    saveData()
}