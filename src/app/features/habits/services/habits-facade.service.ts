import { Injectable } from '@angular/core';

import { Habit } from '../models/habit.model';

@Injectable({
    providedIn: 'root',
})
export class HabitsFacadeService {
    getHabits(): Habit[] {
        return [];
    }
}
