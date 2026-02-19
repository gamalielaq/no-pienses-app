import { Injectable } from '@angular/core';

export interface Completion {
    date: string;
    completed: boolean;
}

export interface Habit {
    id: string;
    name: string;
    createdAt: string;
    completions: Completion[];
}

export type HabitSeed = Habit;

@Injectable({
    providedIn: 'root',
})
export class HabitSeedService {
    private readonly storageKey = 'habits_data';
    private readonly legacyStorageKey = 'habits_seed';
    private readonly streakStorageKey = 'streak_data';
    private readonly baseMaxHabits = 3;
    private readonly unlockedMaxHabits = 5;
    private readonly streakUnlockThreshold = 7;

    getHabits(): Habit[] {
        const current = this.readHabits(this.storageKey);
        if (current.length) {
            return current;
        }

        const legacy = this.readLegacyHabits();
        if (legacy.length) {
            this.persistHabits(legacy);
            localStorage.removeItem(this.legacyStorageKey);
            return legacy;
        }

        return [];
    }

    addHabit(name: string): Habit[] {
        const trimmed = name.trim();
        const habits = this.getHabits();

        if (!trimmed) {
            throw new Error('Escribe un habito antes de agregar.');
        }

        const limit = this.getHabitLimit();
        if (habits.length >= limit) {
            throw new Error(`Solo puedes definir hasta ${limit} habitos por ahora.`);
        }

        const normalized = trimmed.toLowerCase();
        const isDuplicate = habits.some((habit) => habit.name.trim().toLowerCase() === normalized);
        if (isDuplicate) {
            throw new Error('Ese habito ya existe en tu lista.');
        }

        const next: Habit = {
            id: this.generateId(),
            name: trimmed,
            createdAt: new Date().toISOString(),
            completions: [],
        };

        const updated = [...habits, next];
        this.persistHabits(updated);
        this.persistStreak(this.calculateStreakFromHabits(updated, this.getTodayDate()), this.getRewardClaimed());
        return updated;
    }

    removeHabit(id: string): Habit[] {
        const updated = this.getHabits().filter((habit) => habit.id !== id);
        this.persistHabits(updated);
        this.persistStreak(this.calculateStreakFromHabits(updated, this.getTodayDate()), this.getRewardClaimed());
        return updated;
    }

    setHabitCompletion(habitId: string, completed: boolean, date = this.getTodayDate()): Habit[] {
        const habits = this.getHabits();
        const updated = habits.map((habit) => {
            if (habit.id !== habitId) {
                return habit;
            }

            const completions = [...habit.completions];
            const existingIndex = completions.findIndex((entry) => entry.date === date);
            const completion: Completion = { date, completed };

            if (existingIndex >= 0) {
                completions[existingIndex] = completion;
            } else {
                completions.push(completion);
            }

            return {
                ...habit,
                completions,
            };
        });

        this.persistHabits(updated);
        this.persistStreak(this.calculateStreakFromHabits(updated, this.getTodayDate()), this.getRewardClaimed());
        return updated;
    }

    isHabitCompletedOnDate(habitId: string, date: string): boolean {
        const habit = this.getHabits().find((item) => item.id === habitId);
        if (!habit) {
            return false;
        }
        return habit.completions.some((completion) => completion.date === date && completion.completed);
    }

    isDayCompleted(date: string): boolean {
        const habits = this.getHabits();
        return this.isDayCompletedWithHabits(date, habits);
    }

    calculateStreak(referenceDate = this.getTodayDate()): number {
        const habits = this.getHabits();
        return this.calculateStreakFromHabits(habits, referenceDate);
    }

    getStreak(): number {
        const existing = this.readStreakData();
        if (existing.streak >= 0) {
            return existing.streak;
        }

        const recalculated = this.calculateStreak();
        this.persistStreak(recalculated, existing.rewardClaimed);
        return recalculated;
    }

    getRewardClaimed(): boolean {
        return this.readStreakData().rewardClaimed;
    }

    shouldShowUnlockReward(): boolean {
        return this.getStreak() >= this.streakUnlockThreshold && !this.getRewardClaimed();
    }

    claimUnlockReward(): void {
        const current = this.readStreakData();
        this.persistStreak(current.streak, true);
    }

    getHabitLimit(): number {
        const isUnlocked = this.getRewardClaimed() || this.getStreak() >= this.streakUnlockThreshold;
        return isUnlocked
            ? this.unlockedMaxHabits
            : this.baseMaxHabits;
    }

    getTodayDate(): string {
        const now = new Date();
        return this.formatDate(now);
    }

    clearHabits(): void {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.legacyStorageKey);
        this.persistStreak(0, false);
    }

    private readHabits(key: string): Habit[] {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw) as Habit[];
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed
                .filter((habit) => !!habit?.id && !!habit?.name && !!habit?.createdAt)
                .map((habit) => ({
                    id: habit.id,
                    name: habit.name.trim(),
                    createdAt: habit.createdAt,
                    completions: Array.isArray(habit.completions)
                        ? habit.completions
                              .filter((entry) => !!entry?.date)
                              .map((entry) => ({
                                  date: entry.date,
                                  completed: !!entry.completed,
                              }))
                        : [],
                }));
        } catch {
            return [];
        }
    }

    private readLegacyHabits(): Habit[] {
        const raw = localStorage.getItem(this.legacyStorageKey);
        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw) as Array<{ id: string; name: string; createdAt: string }>;
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed
                .filter((habit) => !!habit?.id && !!habit?.name && !!habit?.createdAt)
                .map((habit) => ({
                    id: habit.id,
                    name: habit.name.trim(),
                    createdAt: habit.createdAt,
                    completions: [],
                }));
        } catch {
            return [];
        }
    }

    private isDayCompletedWithHabits(date: string, habits: Habit[]): boolean {
        if (!habits.length) {
            return false;
        }

        const activeHabits = habits.filter((habit) => this.isHabitActiveOnDate(habit, date));
        if (!activeHabits.length) {
            return false;
        }

        return activeHabits.every((habit) =>
            habit.completions.some((completion) => completion.date === date && completion.completed),
        );
    }

    private calculateStreakFromHabits(habits: Habit[], referenceDate: string): number {
        let streak = 0;
        let cursor = new Date(`${referenceDate}T00:00:00`);
        const referenceKey = this.formatDate(cursor);

        // If today's set is still in progress, preserve the streak up to yesterday.
        if (!this.isDayCompletedWithHabits(referenceKey, habits)) {
            cursor.setDate(cursor.getDate() - 1);
        }

        while (this.isDayCompletedWithHabits(this.formatDate(cursor), habits)) {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    }

    private persistHabits(habits: Habit[]): void {
        localStorage.setItem(this.storageKey, JSON.stringify(habits));
    }

    private readStreakData(): { streak: number; rewardClaimed: boolean } {
        const raw = localStorage.getItem(this.streakStorageKey);
        if (!raw) {
            return { streak: -1, rewardClaimed: false };
        }

        try {
            const parsed = JSON.parse(raw) as { streak?: number; value?: number; rewardClaimed?: boolean };
            const streakValue =
                typeof parsed?.streak === 'number'
                    ? parsed.streak
                    : typeof parsed?.value === 'number'
                      ? parsed.value
                      : -1;

            return {
                streak: streakValue >= 0 ? streakValue : -1,
                rewardClaimed: !!parsed?.rewardClaimed,
            };
        } catch {
            return { streak: -1, rewardClaimed: false };
        }
    }

    private persistStreak(streak: number, rewardClaimed: boolean): void {
        localStorage.setItem(
            this.streakStorageKey,
            JSON.stringify({
                streak,
                rewardClaimed,
                updatedAt: new Date().toISOString(),
            }),
        );
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private isHabitActiveOnDate(habit: Habit, date: string): boolean {
        const createdDate = new Date(habit.createdAt);
        if (Number.isNaN(createdDate.getTime())) {
            return true;
        }

        return this.formatDate(createdDate) <= date;
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
