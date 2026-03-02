import { Injectable } from '@angular/core';
import { HabitHistoryRecord, HabitRecord, HabitsService } from '../../../core/services/habits.service';

export interface DashboardSnapshot {
    habits: HabitRecord[];
    completedTodayIds: Set<string>;
    streakDays: number;
    todayKey: string;
    habitLimit: number;
    habitLimitUnlocked: boolean;
    rewardClaimed: boolean;
    canUnlockByStreak: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class DashboardHabitsService {
    constructor(private readonly habitsService: HabitsService) {}

    async getDashboardSnapshot(): Promise<DashboardSnapshot> {
        const habits = await this.habitsService.getUserHabits();
        const activeHabitIds = new Set(habits.map((habit) => habit.id));
        const todayKey = this.getTodayDateKey();
        const history = (await this.habitsService.getUserHistory()).filter(
            (entry) => !!entry.completed && activeHabitIds.has(entry.habitId),
        );

        const completedTodayIds = new Set(
            history
                .filter((entry) => entry.date === todayKey && activeHabitIds.has(entry.habitId))
                .map((entry) => entry.habitId),
        );
        const streakDays = this.calculateStreakDays(habits, history, todayKey);
        const progress = await this.habitsService.getUserProgress();
        const canUnlockByStreak = streakDays >= 7;
        const habitLimitUnlocked = progress.habitLimitUnlocked || canUnlockByStreak;

        return {
            habits,
            completedTodayIds,
            streakDays,
            todayKey,
            habitLimit: habitLimitUnlocked ? 5 : 3,
            habitLimitUnlocked,
            rewardClaimed: progress.rewardClaimed,
            canUnlockByStreak,
        };
    }

    async setHabitCompletion(habitId: string, completed: boolean): Promise<void> {
        const todayKey = this.getTodayDateKey();
        await this.habitsService.setHistoryCompletion(habitId, todayKey, completed);
        await this.habitsService.setHabitCompletedToday(habitId, completed);
    }

    async claimUnlockReward(): Promise<void> {
        await this.habitsService.updateUserProgress({
            habitLimitUnlocked: true,
            rewardClaimed: true,
        });
    }

    async seedSevenDayStreakForTesting(): Promise<void> {
        const habits = await this.habitsService.getUserHabits();
        if (!habits.length) {
            throw new Error('No hay habitos para generar racha.');
        }

        const writes: Array<Promise<void>> = [];
        for (let offset = 6; offset >= 0; offset -= 1) {
            const date = new Date();
            date.setDate(date.getDate() - offset);
            const dateKey = this.formatDateKey(date);

            habits.forEach((habit) => {
                writes.push(this.habitsService.setHistoryCompletion(habit.id, dateKey, true));
                if (offset === 0) {
                    writes.push(this.habitsService.setHabitCompletedToday(habit.id, true));
                }
            });
        }

        await Promise.all(writes);
    }

    private getTodayDateKey(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private calculateStreakDays(
        habits: HabitRecord[],
        history: HabitHistoryRecord[],
        todayKey: string,
    ): number {
        if (!habits.length) {
            return 0;
        }

        const completedByDate = new Map<string, Set<string>>();
        history.forEach((entry) => {
            const existing = completedByDate.get(entry.date) ?? new Set<string>();
            existing.add(entry.habitId);
            completedByDate.set(entry.date, existing);
        });

        const requiredIds = new Set(habits.map((item) => item.id));
        let streak = 0;
        let cursor = new Date(`${todayKey}T00:00:00`);

        while (true) {
            const key = this.formatDateKey(cursor);
            const completed = completedByDate.get(key);
            const allCompleted =
                !!completed &&
                completed.size === requiredIds.size &&
                [...requiredIds].every((id) => completed.has(id));

            if (!allCompleted) {
                break;
            }

            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    }

    private formatDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
