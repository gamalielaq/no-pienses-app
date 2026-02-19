import { Injectable, OnDestroy } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { HabitSeedService } from './habit-seed.service';

type ReminderFiredMap = Record<string, string[]>;

@Injectable({
    providedIn: 'root',
})
export class HabitReminderService implements OnDestroy {
    private readonly firedStorageKey = 'habit_reminder_fired';
    private readonly checkIntervalMs = 20_000;
    private lastCheckedAtMs = Date.now();
    private timerId: ReturnType<typeof setInterval> | null = null;
    private started = false;

    constructor(
        private readonly habitSeedService: HabitSeedService,
        private readonly toastController: ToastController,
    ) {}

    start(): void {
        if (this.started) {
            return;
        }
        this.started = true;
        this.lastCheckedAtMs = Date.now() - this.checkIntervalMs;
        if (typeof window !== 'undefined') {
            (
                window as Window & {
                    __habitReminderDebug?: { clearFired: () => void; fireNow: () => Promise<void> };
                }
            ).__habitReminderDebug = {
                clearFired: () => {
                    localStorage.removeItem(this.firedStorageKey);
                    console.log('[HabitReminder] fired history cleared');
                },
                fireNow: async () => {
                    this.triggerVibration();
                    const toast = await this.toastController.create({
                        header: 'Recordatorio',
                        message: 'Prueba manual de notificacion',
                        duration: 3000,
                        position: 'top',
                        color: 'primary',
                    });
                    void toast.present();
                    console.log('[HabitReminder] manual fire triggered');
                },
            };
        }
        this.checkAndNotify();
        this.timerId = setInterval(() => {
            this.checkAndNotify();
        }, this.checkIntervalMs);
    }

    ngOnDestroy(): void {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    private async checkAndNotify(): Promise<void> {
        const nowMs = Date.now();
        const previousCheckMs = this.lastCheckedAtMs;
        this.lastCheckedAtMs = nowMs;

        const today = this.habitSeedService.getTodayDate();
        const nowLabel = new Date(nowMs).toLocaleTimeString('es-ES', { hour12: false });
        const allWithReminder = this.habitSeedService.getHabits().filter((habit) => !!habit.reminderTime);

        const evaluations = allWithReminder.map((habit) => {
            const reminderTime = habit.reminderTime as string;
            const due = this.isReminderDue(reminderTime, previousCheckMs, nowMs, today);
            const fired = this.hasFired(today, habit.id, reminderTime);
            return {
                id: habit.id,
                name: habit.name,
                reminderTime,
                due,
                fired,
            };
        });

        const habits = evaluations
            .filter((item) => item.due && !item.fired)
            .map((item) => allWithReminder.find((habit) => habit.id === item.id)!)
            .filter(Boolean);

        console.log('[HabitReminder] check', {
            now: nowLabel,
            today,
            previousCheckMs,
            nowMs,
            totalWithReminder: allWithReminder.length,
            evaluations,
            dueNow: habits.map((habit) => ({
                id: habit.id,
                name: habit.name,
                reminderTime: habit.reminderTime,
            })),
        });

        for (const habit of habits) {
            console.log('[HabitReminder] firing', {
                id: habit.id,
                name: habit.name,
                reminderTime: habit.reminderTime,
                at: nowLabel,
            });
            this.markAsFired(today, habit.id, habit.reminderTime as string);
            this.triggerVibration();
            const toast = await this.toastController.create({
                header: 'Recordatorio',
                message: `Es hora de: ${habit.name}`,
                duration: 4500,
                position: 'top',
                color: 'primary',
                buttons: [{ text: 'Ok', role: 'cancel' }],
            });
            void toast.present();
        }
    }

    private hasFired(dateKey: string, habitId: string, reminderTime: string): boolean {
        const current = this.readFiredMap();
        return (current[dateKey] ?? []).includes(this.buildFiredToken(habitId, reminderTime));
    }

    private markAsFired(dateKey: string, habitId: string, reminderTime: string): void {
        const current = this.readFiredMap();
        const existing = current[dateKey] ?? [];
        const token = this.buildFiredToken(habitId, reminderTime);
        if (existing.includes(token)) {
            return;
        }
        current[dateKey] = [...existing, token];
        this.cleanupHistory(current);
        localStorage.setItem(this.firedStorageKey, JSON.stringify(current));
    }

    private cleanupHistory(map: ReminderFiredMap): void {
        const keys = Object.keys(map).sort((a, b) => b.localeCompare(a));
        const maxDays = 7;
        keys.slice(maxDays).forEach((key) => {
            delete map[key];
        });
    }

    private readFiredMap(): ReminderFiredMap {
        const raw = localStorage.getItem(this.firedStorageKey);
        if (!raw) {
            return {};
        }

        try {
            const parsed = JSON.parse(raw) as ReminderFiredMap;
            if (!parsed || typeof parsed !== 'object') {
                return {};
            }
            return parsed;
        } catch {
            return {};
        }
    }

    private triggerVibration(): void {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate([120, 80, 140]);
        }
    }

    private isReminderDue(
        reminderTime: string,
        previousCheckMs: number,
        nowMs: number,
        todayKey: string,
    ): boolean {
        const reminderTimeMs = this.toDateTimeMs(todayKey, reminderTime);
        if (reminderTimeMs === null) {
            return false;
        }

        // Treat reminder as a 1-minute window: [HH:mm:00.000, HH:mm:59.999]
        const reminderWindowStart = reminderTimeMs;
        const reminderWindowEnd = reminderTimeMs + 59_999;

        // Trigger when check window (previousCheckMs, nowMs] overlaps reminder window.
        return reminderWindowEnd > previousCheckMs && reminderWindowStart <= nowMs;
    }

    private toDateTimeMs(dateKey: string, timeValue: string): number | null {
        const timeMatch = timeValue.match(/^(\d{2}):(\d{2})$/);
        if (!timeMatch) {
            return null;
        }

        const hours = Number(timeMatch[1]);
        const minutes = Number(timeMatch[2]);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }

        const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            return null;
        }

        const year = Number(match[1]);
        const month = Number(match[2]) - 1;
        const day = Number(match[3]);
        return new Date(year, month, day, hours, minutes, 0, 0).getTime();
    }

    private buildFiredToken(habitId: string, reminderTime: string): string {
        return `${habitId}@${reminderTime}`;
    }

}
