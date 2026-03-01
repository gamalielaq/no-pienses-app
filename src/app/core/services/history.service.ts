import { Injectable } from '@angular/core';

export interface HabitHistoryDocument {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    async markCompleted(_habitId: string, _date: string): Promise<void> {}

    async unmarkCompleted(_habitId: string, _date: string): Promise<void> {}

    async deleteByHabit(_habitId: string, _dates: string[]): Promise<void> {}
}
