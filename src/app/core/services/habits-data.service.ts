import { Injectable } from '@angular/core';

import { StorageService } from './storage.service';

export interface Habit {
    id: string;
    name: string;
    completed: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class HabitsDataService {
    private readonly key = 'habits';

    constructor(private readonly storage: StorageService) {}

    getHabits(): Habit[] {
        return this.storage.get<Habit[]>(this.key) ?? [];
    }

    saveHabits(habits: Habit[]): void {
        this.storage.set(this.key, habits);
    }
}
