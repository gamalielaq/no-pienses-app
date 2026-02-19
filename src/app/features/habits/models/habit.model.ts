export interface Habit {
    id: string;
    name: string;
    description?: string;
    streak: number;
    completedToday: boolean;
    createdAt: string;
}
