import { Injectable } from '@angular/core';
import { HabitSeedService } from './habit-seed.service';

@Injectable({
    providedIn: 'root',
})
export class ProgressService {
    private readonly unlockThreshold = 7;
    private readonly baseHabits = 3;
    private readonly unlockedExtraHabits = 2;

    constructor(private readonly habitSeedService: HabitSeedService) {}

    getStreakDays(): number {
        return this.habitSeedService.getStreak();
    }

    getUnlockedSlots(): number {
        const streakDays = this.getStreakDays();
        if (streakDays < this.unlockThreshold) {
            return 0;
        }

        const habitsCount = this.habitSeedService.getHabits().length;
        const usedExtraSlots = Math.max(habitsCount - this.baseHabits, 0);
        return Math.max(this.unlockedExtraHabits - usedExtraSlots, 0);
    }
}
