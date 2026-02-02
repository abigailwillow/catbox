export function randomInt(min: number, max: number): number {
    return Math.round(Math.random() * (max - min) + min)
}

export function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min
}