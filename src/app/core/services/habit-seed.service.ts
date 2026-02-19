import { Injectable } from '@angular/core';

export interface Completion {
    date: string;
    completed: boolean;
}

export type HabitInterval = 'daily' | 'weekly' | 'monthly';

export interface Habit {
    id: string;
    name: string;
    interval: HabitInterval;
    currentStreak: number;
    bestStreak: number;
    history: Completion[];
    reminderTime?: string | null;
    createdAt: string;
    lastCompleted: string | null;
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
            this.persistHabits(current);
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
        return this.createHabit({
            name,
            interval: 'daily',
        });
    }

    createHabit(input: { name: string; interval: HabitInterval; reminderTime?: string | null }): Habit[] {
        const trimmed = input.name.trim();
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

        const nowIso = new Date().toISOString();
        const next: Habit = {
            id: this.generateId(),
            name: trimmed,
            interval: input.interval,
            currentStreak: 0,
            bestStreak: 0,
            history: [],
            reminderTime: input.reminderTime?.trim() || null,
            createdAt: nowIso,
            lastCompleted: null,
            completions: [],
        };

        const updated = [...habits, next];
        this.persistHabits(updated);
        this.persistStreak(this.calculateStreakFromHabits(updated, this.getTodayDate()), this.getRewardClaimed());
        return updated;
    }

    updateHabit(
        id: string,
        input: {
            name: string;
            interval: HabitInterval;
            reminderTime?: string | null;
        },
    ): Habit[] {
        const habits = this.getHabits();
        const trimmedName = input.name.trim();
        if (!trimmedName) {
            throw new Error('El nombre del habito es obligatorio.');
        }

        const duplicate = habits.some(
            (habit) =>
                habit.id !== id && habit.name.trim().toLowerCase() === trimmedName.toLowerCase(),
        );
        if (duplicate) {
            throw new Error('Ya existe otro habito con ese nombre.');
        }

        const updated = habits.map((habit) => {
            if (habit.id !== id) {
                return habit;
            }

            const next: Habit = {
                ...habit,
                name: trimmedName,
                interval: input.interval,
                reminderTime: input.reminderTime?.trim() || null,
            };

            return this.recalculateHabitStats(next);
        });

        this.persistHabits(updated);
        this.persistStreak(this.calculateStreakFromHabits(updated, this.getTodayDate()), this.getRewardClaimed());
        return updated;
    }

    deleteHabit(id: string): Habit[] {
        return this.removeHabit(id);
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

            const next: Habit = {
                ...habit,
                history: completions,
                completions,
            };
            return this.recalculateHabitStats(next);
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
        return habit.history.some((completion) => completion.date === date && completion.completed);
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
            const parsed = JSON.parse(raw) as Array<
                Partial<Habit> & {
                    completions?: Completion[];
                    history?: Completion[];
                }
            >;
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed
                .filter((habit) => !!habit?.id && !!habit?.name && !!habit?.createdAt)
                .map((habit) => this.normalizeHabit(habit));
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
                    interval: 'daily' as HabitInterval,
                    currentStreak: 0,
                    bestStreak: 0,
                    history: [],
                    reminderTime: null,
                    createdAt: habit.createdAt,
                    lastCompleted: null,
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

        const dueHabits = activeHabits.filter((habit) => this.isHabitDueOnDate(habit, date));
        if (!dueHabits.length) {
            return false;
        }

        return dueHabits.every((habit) =>
            habit.history.some((completion) => completion.date === date && completion.completed),
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
        const createdDate = this.parseDateKey(habit.createdAt);
        if (Number.isNaN(createdDate.getTime())) {
            return true;
        }

        return this.formatDate(createdDate) <= date;
    }

    private isHabitDueOnDate(habit: Habit, dateKey: string): boolean {
        if (habit.interval === 'daily') {
            return true;
        }

        const createdAt = this.parseDateKey(habit.createdAt);
        const target = this.parseDateKey(dateKey);
        if (target < createdAt) {
            return false;
        }

        if (habit.interval === 'weekly') {
            return createdAt.getDay() === target.getDay();
        }

        const createdDay = createdAt.getDate();
        const monthLastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        return target.getDate() === Math.min(createdDay, monthLastDay);
    }

    private normalizeHabit(
        habit: Partial<Habit> & {
            completions?: Completion[];
            history?: Completion[];
        },
    ): Habit {
        const historySource = Array.isArray(habit.history)
            ? habit.history
            : Array.isArray(habit.completions)
              ? habit.completions
              : [];

        const history = historySource
            .filter((entry) => !!entry?.date)
            .map((entry) => ({
                date: entry.date,
                completed: !!entry.completed,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const normalized: Habit = {
            id: `${habit.id ?? ''}`,
            name: `${habit.name ?? ''}`.trim(),
            interval: this.normalizeInterval(habit.interval),
            currentStreak: 0,
            bestStreak: 0,
            history,
            reminderTime: habit.reminderTime?.trim() || null,
            createdAt: `${habit.createdAt ?? new Date().toISOString()}`,
            lastCompleted: null,
            completions: history,
        };

        const completedDates = history.filter((entry) => entry.completed).map((entry) => entry.date);
        normalized.lastCompleted = completedDates.length
            ? completedDates[completedDates.length - 1]
            : null;

        normalized.currentStreak =
            typeof habit.currentStreak === 'number'
                ? habit.currentStreak
                : this.calculateCurrentHabitStreak(normalized);

        normalized.bestStreak =
            typeof habit.bestStreak === 'number'
                ? habit.bestStreak
                : this.calculateBestHabitStreak(normalized);

        return this.recalculateHabitStats(normalized);
    }

    private recalculateHabitStats(habit: Habit): Habit {
        const currentStreak = this.calculateCurrentHabitStreak(habit);
        const calculatedBest = this.calculateBestHabitStreak(habit);
        const bestStreak = Math.max(habit.bestStreak || 0, calculatedBest);
        const completedDates = habit.history.filter((entry) => entry.completed).map((entry) => entry.date);

        return {
            ...habit,
            currentStreak,
            bestStreak,
            lastCompleted: completedDates.length ? completedDates[completedDates.length - 1] : null,
            completions: [...habit.history],
        };
    }

    private calculateCurrentHabitStreak(habit: Habit): number {
        const today = this.getTodayDate();
        const completed = new Set(
            habit.history.filter((entry) => entry.completed).map((entry) => entry.date),
        );

        let cursor = this.getMostRecentDueDate(habit, today);
        if (!cursor) {
            return 0;
        }

        let streak = 0;
        while (cursor) {
            if (!completed.has(cursor)) {
                if (!streak) {
                    cursor = this.getPreviousDueDate(habit, cursor);
                    continue;
                }
                break;
            }

            streak += 1;
            cursor = this.getPreviousDueDate(habit, cursor);
        }

        return streak;
    }

    private calculateBestHabitStreak(habit: Habit): number {
        const completedDates = habit.history
            .filter((entry) => entry.completed)
            .map((entry) => entry.date)
            .sort((a, b) => a.localeCompare(b));

        if (!completedDates.length) {
            return 0;
        }

        let best = 1;
        let current = 1;

        for (let index = 1; index < completedDates.length; index += 1) {
            const previous = completedDates[index - 1];
            const expected = this.getNextDueDate(habit, previous);
            const currentDate = completedDates[index];

            if (expected === currentDate) {
                current += 1;
                best = Math.max(best, current);
            } else if (previous !== currentDate) {
                current = 1;
            }
        }

        return best;
    }

    private getMostRecentDueDate(habit: Habit, referenceDateKey: string): string | null {
        const createdDate = this.parseDateKey(habit.createdAt);
        const referenceDate = this.parseDateKey(referenceDateKey);
        if (referenceDate < createdDate) {
            return null;
        }

        if (habit.interval === 'daily') {
            return referenceDateKey;
        }

        if (habit.interval === 'weekly') {
            const diff = (referenceDate.getDay() - createdDate.getDay() + 7) % 7;
            const dueDate = new Date(referenceDate);
            dueDate.setDate(referenceDate.getDate() - diff);
            return this.formatDate(dueDate);
        }

        const dueDate = this.resolveMonthlyDueDate(createdDate, referenceDate);
        if (dueDate > referenceDate) {
            dueDate.setMonth(dueDate.getMonth() - 1);
            dueDate.setDate(1);
            dueDate.setDate(this.resolveMonthDay(createdDate.getDate(), dueDate));
        }
        return this.formatDate(dueDate);
    }

    private getPreviousDueDate(habit: Habit, dateKey: string): string | null {
        const current = this.parseDateKey(dateKey);
        const createdDate = this.parseDateKey(habit.createdAt);
        let previous = new Date(current);

        if (habit.interval === 'daily') {
            previous.setDate(previous.getDate() - 1);
        } else if (habit.interval === 'weekly') {
            previous.setDate(previous.getDate() - 7);
        } else {
            previous.setMonth(previous.getMonth() - 1);
            previous.setDate(1);
            previous.setDate(this.resolveMonthDay(createdDate.getDate(), previous));
        }

        if (previous < createdDate) {
            return null;
        }

        return this.formatDate(previous);
    }

    private getNextDueDate(habit: Habit, dateKey: string): string {
        const current = this.parseDateKey(dateKey);
        const createdDate = this.parseDateKey(habit.createdAt);
        const next = new Date(current);

        if (habit.interval === 'daily') {
            next.setDate(next.getDate() + 1);
        } else if (habit.interval === 'weekly') {
            next.setDate(next.getDate() + 7);
        } else {
            next.setMonth(next.getMonth() + 1);
            next.setDate(1);
            next.setDate(this.resolveMonthDay(createdDate.getDate(), next));
        }

        return this.formatDate(next);
    }

    private resolveMonthlyDueDate(createdDate: Date, referenceDate: Date): Date {
        const dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        dueDate.setDate(this.resolveMonthDay(createdDate.getDate(), dueDate));
        return dueDate;
    }

    private resolveMonthDay(createdDay: number, monthDate: Date): number {
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        return Math.min(createdDay, lastDay);
    }

    private normalizeInterval(value: unknown): HabitInterval {
        if (value === 'weekly' || value === 'monthly') {
            return value;
        }
        return 'daily';
    }

    private parseDateKey(value: string): Date {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return new Date(`${value}T00:00:00`);
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? new Date(`${this.getTodayDate()}T00:00:00`) : parsed;
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
