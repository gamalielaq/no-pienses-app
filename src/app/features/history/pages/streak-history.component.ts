import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HabitSeedService } from '../../../core/services/habit-seed.service';
import { ProgressService, StreakEntry } from '../../../core/services/progress.service';
import {
    IonBackButton,
    IonBadge,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonModal,
    IonProgressBar,
    IonRow,
    IonText,
    IonTitle,
    IonToolbar,
    ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline,
    checkmarkCircle,
    chevronBackOutline,
    chevronForwardOutline,
    ellipseOutline,
    flame,
    flameOutline,
} from 'ionicons/icons';

interface HabitDayState {
    id: string;
    name: string;
    completed: boolean;
}

interface DayDetail {
    date: string;
    completedHabits: number;
    totalHabits: number;
    allCompleted: boolean;
    habits: HabitDayState[];
}

interface CalendarCell {
    date: string;
    day: number;
    completed: boolean;
    isToday: boolean;
}

interface MonthCalendar {
    key: string;
    label: string;
    cells: Array<CalendarCell | null>;
}

@Component({
    selector: 'app-streak-history',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonBackButton,
        IonTitle,
        IonContent,
        IonIcon,
        IonText,
        IonProgressBar,
        IonList,
        IonItem,
        IonLabel,
        IonGrid,
        IonRow,
        IonCol,
        IonBadge,
        IonButton,
        IonModal,
        IonCheckbox,
    ],
    templateUrl: './streak-history.component.html',
    styleUrl: './streak-history.component.scss',
})
export class StreakHistoryComponent {
    private readonly bestRecordStorageKey = 'best_streak_record';
    protected readonly maxGoal = 7;

    protected streaks: StreakEntry[] = [];
    protected bestStreak = 0;
    protected currentStreak = 0;
    protected slotsUnlocked = 0;
    protected selectedDate = '';
    protected selectedDayDetail: DayDetail | null = null;
    protected readonly dayDetails = new Map<string, DayDetail>();
    protected monthCalendars: MonthCalendar[] = [];
    protected showNewBestModal = false;
    protected isNewBest = false;
    protected today = '';

    constructor(
        private readonly habitSeedService: HabitSeedService,
        private readonly progressService: ProgressService,
        private readonly router: Router,
        private readonly toastController: ToastController,
    ) {
        addIcons({
            flame,
            flameOutline,
            checkmarkCircle,
            ellipseOutline,
            calendarOutline,
            chevronBackOutline,
            chevronForwardOutline,
        });
        this.loadData();
    }

    ionViewWillEnter(): void {
        this.loadData();
    }

    protected get progressValue(): number {
        if (!this.maxGoal) {
            return 0;
        }
        return Math.min(this.currentStreak / this.maxGoal, 1);
    }

    protected get tieBestStreak(): boolean {
        return this.currentStreak > 0 && this.currentStreak === this.bestStreak && !this.isNewBest;
    }

    protected get completionLabel(): string {
        if (!this.selectedDayDetail) {
            return 'Selecciona un dia para ver detalle.';
        }

        return `Habito cumplido: ${this.selectedDayDetail.completedHabits} / ${this.selectedDayDetail.totalHabits}`;
    }

    protected get selectedDayCompleted(): boolean {
        return !!this.selectedDayDetail?.allCompleted;
    }

    protected async selectDay(date: string): Promise<void> {
        const detail = this.dayDetails.get(date) ?? this.createDayDetail(date);
        this.selectedDate = date;
        this.selectedDayDetail = detail;

        const toast = await this.toastController.create({
            message: `Habito cumplido: ${detail.completedHabits} / ${detail.totalHabits}`,
            duration: 1100,
            position: 'bottom',
            color: detail.allCompleted ? 'success' : 'medium',
        });

        void toast.present();
    }

    protected closeCelebration(): void {
        this.showNewBestModal = false;
    }

    protected goToDashboard(): void {
        void this.router.navigateByUrl('/tabs/dashboard');
    }

    protected async onHabitToggle(habitId: string, checked: boolean | undefined): Promise<void> {
        if (!this.selectedDate) {
            return;
        }

        this.habitSeedService.setHabitCompletion(habitId, !!checked, this.selectedDate);
        this.triggerHaptic();
        this.loadData(this.selectedDate);

        const toast = await this.toastController.create({
            message: checked ? 'Marcado como completado.' : 'Marcado como pendiente.',
            duration: 900,
            position: 'bottom',
            color: checked ? 'success' : 'medium',
        });

        void toast.present();
    }

    protected trackByDate(_: number, item: StreakEntry): string {
        return item.date;
    }

    protected trackByHabit(_: number, habit: HabitDayState): string {
        return habit.id;
    }

    protected daySummary(date: string): string {
        const detail = this.dayDetails.get(date);
        if (!detail) {
            return '0/0';
        }
        return `${detail.completedHabits}/${detail.totalHabits}`;
    }

    private loadData(selectedDate?: string): void {
        this.streaks = this.progressService.getStreaks(30);
        this.today = this.streaks[0]?.date ?? '';
        this.bestStreak = this.progressService.getBestStreak();
        this.currentStreak = this.progressService.getCurrentStreak();
        this.slotsUnlocked = this.progressService.getUnlockedSlots();

        this.dayDetails.clear();
        this.streaks.forEach((entry) => {
            this.dayDetails.set(entry.date, this.createDayDetail(entry.date));
        });

        this.selectedDate = selectedDate ?? this.today;
        this.selectedDayDetail =
            this.dayDetails.get(this.selectedDate) ?? this.createDayDetail(this.selectedDate);

        this.monthCalendars = this.buildMonthCalendars();
        this.resolveCelebrationState();
    }

    private resolveCelebrationState(): void {
        const storedBest = Number(localStorage.getItem(this.bestRecordStorageKey) ?? '0');
        this.isNewBest = this.currentStreak > 0 && this.currentStreak === this.bestStreak && this.bestStreak > storedBest;
        this.showNewBestModal = this.isNewBest;

        if (this.bestStreak > storedBest) {
            localStorage.setItem(this.bestRecordStorageKey, String(this.bestStreak));
        }
    }

    private createDayDetail(date: string): DayDetail {
        const habits = this.habitSeedService
            .getHabits()
            .filter((habit) => this.isHabitActiveOnDate(habit.createdAt, date))
            .map((habit) => ({
                id: habit.id,
                name: habit.name,
                completed: this.habitSeedService.isHabitCompletedOnDate(habit.id, date),
            }));

        const totalHabits = habits.length;
        const completedHabits = habits.filter((habit) => habit.completed).length;

        return {
            date,
            completedHabits,
            totalHabits,
            allCompleted: totalHabits > 0 && completedHabits === totalHabits,
            habits,
        };
    }

    private buildMonthCalendars(): MonthCalendar[] {
        const today = new Date(`${this.today}T00:00:00`);
        const monthsToBuild = [-1, 0, 1];

        return monthsToBuild.map((offset) => this.buildSingleMonth(today, offset));
    }

    private buildSingleMonth(baseDate: Date, monthOffset: number): MonthCalendar {
        const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
        const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset + 1, 0);
        const leadingGaps = (monthStart.getDay() + 6) % 7;
        const cells: Array<CalendarCell | null> = Array.from({ length: leadingGaps }, () => null);

        for (let day = 1; day <= monthEnd.getDate(); day += 1) {
            const current = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
            const date = this.formatDate(current);
            const detail = this.createDayDetail(date);
            cells.push({
                date,
                day,
                completed: detail.allCompleted,
                isToday: date === this.today,
            });
        }

        return {
            key: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`,
            label: monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
            cells,
        };
    }

    private isHabitActiveOnDate(createdAt: string, dateKey: string): boolean {
        const createdAtDate = new Date(createdAt);
        if (Number.isNaN(createdAtDate.getTime())) {
            return true;
        }

        return this.formatDate(createdAtDate) <= dateKey;
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private triggerHaptic(): void {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(14);
        }
    }
}
