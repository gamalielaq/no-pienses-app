import { Injectable } from '@angular/core';
import { HabitSeedService } from './habit-seed.service';

export interface StreakEntry {
    date: string;
    completed: boolean;
}

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

    getCurrentStreak(): number {
        return this.getStreakDays();
    }

    getStreaks(days = 30): StreakEntry[] {
        const today = this.parseDate(this.habitSeedService.getTodayDate());
        const streaks: StreakEntry[] = [];

        for (let index = 0; index < days; index += 1) {
            const cursor = new Date(today);
            cursor.setDate(today.getDate() - index);
            const date = this.formatDate(cursor);

            streaks.push({
                date,
                completed: this.habitSeedService.isDayCompleted(date),
            });
        }

        return streaks;
    }

    getBestStreak(): number {
        const habits = this.habitSeedService.getHabits();
        if (!habits.length) {
            return 0;
        }

        const today = this.parseDate(this.habitSeedService.getTodayDate());
        const startsAt = habits
            .map((habit) => new Date(habit.createdAt))
            .filter((date) => !Number.isNaN(date.getTime()))
            .sort((first, second) => first.getTime() - second.getTime())[0] ?? today;

        const startDate = new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate());
        let best = 0;
        let running = 0;
        const cursor = new Date(startDate);

        while (cursor.getTime() <= today.getTime()) {
            const key = this.formatDate(cursor);
            if (this.habitSeedService.isDayCompleted(key)) {
                running += 1;
                best = Math.max(best, running);
            } else {
                running = 0;
            }
            cursor.setDate(cursor.getDate() + 1);
        }

        return best;
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

    private parseDate(key: string): Date {
        return new Date(`${key}T00:00:00`);
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
