export interface HabitLogModel {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
    note?: string;
}
