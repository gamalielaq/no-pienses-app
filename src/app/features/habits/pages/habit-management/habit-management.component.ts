import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HabitInterval, HabitSeed, HabitSeedService } from '../../../../core/services/habit-seed.service';
import {
    AlertController,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonText,
    IonTitle,
    IonToolbar,
    IonMenuButton,
    ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline,
    alarmOutline,
    checkmarkCircleOutline,
    createOutline,
    flameOutline,
    medalOutline,
    trashOutline,
} from 'ionicons/icons';

interface HabitFormState {
    id: string | null;
    name: string;
    interval: HabitInterval;
    reminderTime: string;
}

interface HabitCalendarDay {
    date: string;
    dayLabel: string;
    dayNumber: number;
    completed: boolean;
    isToday: boolean;
}

interface ReminderOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-habit-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonTitle,
        IonContent,
        IonText,
        IonButton,
        IonList,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardSubtitle,
        IonCardContent,
        IonIcon,
        IonNote,
        IonFab,
        IonFabButton,
        IonModal,
        IonItem,
        IonLabel,
        IonInput,
        IonSegment,
        IonSegmentButton,
    ],
    templateUrl: './habit-management.component.html',
    styleUrl: './habit-management.component.scss',
})
export class HabitManagementComponent {
    protected habits: HabitSeed[] = [];
    protected isModalOpen = false;
    protected isEditMode = false;
    protected validationMessage = '';
    protected recentlySavedHabitId: string | null = null;
    protected deletingHabitId: string | null = null;

    protected readonly calendarWindow = 14;
    protected readonly editCalendarWindow = 30;
    protected todayKey = '';
    protected readonly intervalOptions: Array<{ value: HabitInterval; label: string }> = [
        { value: 'daily', label: 'Diario' },
        { value: 'weekly', label: 'Semanal' },
        { value: 'monthly', label: 'Mensual' },
    ];
    protected readonly reminderOptions: ReminderOption[] = this.buildReminderOptions(30);

    protected form: HabitFormState = this.emptyForm();

    constructor(
        private readonly habitSeedService: HabitSeedService,
        private readonly alertController: AlertController,
        private readonly toastController: ToastController,
    ) {
        addIcons({
            addOutline,
            createOutline,
            trashOutline,
            alarmOutline,
            flameOutline,
            medalOutline,
            checkmarkCircleOutline,
        });
        this.todayKey = this.habitSeedService.getTodayDate();
        this.refreshHabits();
    }

    ionViewWillEnter(): void {
        this.refreshHabits();
    }

    protected openCreateModal(): void {
        this.form = this.emptyForm();
        this.validationMessage = '';
        this.isEditMode = false;
        this.isModalOpen = true;
    }

    protected openEditModal(habit: HabitSeed): void {
        this.form = {
            id: habit.id,
            name: habit.name,
            interval: habit.interval,
            reminderTime: habit.reminderTime ?? '',
        };
        this.validationMessage = '';
        this.isEditMode = true;
        this.isModalOpen = true;
    }

    protected closeModal(): void {
        this.isModalOpen = false;
        this.validationMessage = '';
    }

    protected async saveHabit(): Promise<void> {
        this.validationMessage = '';
        const trimmedName = this.form.name.trim();
        if (!trimmedName) {
            this.validationMessage = 'El nombre del habito es obligatorio.';
            return;
        }

        const normalizedReminder = this.form.reminderTime
            ? this.normalizeTimeInput(this.form.reminderTime)
            : null;
        if (this.form.reminderTime && !normalizedReminder) {
            this.validationMessage = 'Hora invalida. Usa formato HH:mm.';
            return;
        }
        this.form.reminderTime = normalizedReminder ?? '';

        try {
            let updatedHabits: HabitSeed[];
            let affectedHabitId = this.form.id;

            if (this.isEditMode && this.form.id) {
                updatedHabits = this.habitSeedService.updateHabit(this.form.id, {
                    name: trimmedName,
                    interval: this.form.interval,
                    reminderTime: this.form.reminderTime || null,
                });
            } else {
                updatedHabits = this.habitSeedService.createHabit({
                    name: trimmedName,
                    interval: this.form.interval,
                    reminderTime: this.form.reminderTime || null,
                });
                affectedHabitId = updatedHabits[updatedHabits.length - 1]?.id ?? null;
            }

            this.habits = updatedHabits;
            this.isModalOpen = false;
            this.flagSavedHabit(affectedHabitId);

            const toast = await this.toastController.create({
                message: this.isEditMode ? 'Habito actualizado.' : 'Habito creado.',
                duration: 900,
                color: 'success',
                position: 'bottom',
            });
            void toast.present();
        } catch (error) {
            this.validationMessage =
                error instanceof Error ? error.message : 'No fue posible guardar el habito.';
        }
    }

    protected async askDeleteHabit(): Promise<void> {
        if (!this.form.id) {
            return;
        }

        const alert = await this.alertController.create({
            header: 'Eliminar habito',
            message: 'Seguro quieres eliminar este habito?',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => {
                        this.deleteHabit(this.form.id as string);
                    },
                },
            ],
        });

        await alert.present();
    }

    protected intervalLabel(interval: HabitInterval): string {
        return this.intervalOptions.find((option) => option.value === interval)?.label ?? 'Diario';
    }

    protected miniCalendar(habit: HabitSeed): HabitCalendarDay[] {
        return this.buildCalendar(habit, this.calendarWindow);
    }

    protected editCalendar(habit: HabitSeed): HabitCalendarDay[] {
        return this.buildCalendar(habit, this.editCalendarWindow);
    }

    protected async toggleSelectedHabitDay(date: string): Promise<void> {
        if (!this.selectedHabit) {
            return;
        }

        const isCompleted = this.selectedHabit.history.some(
            (entry) => entry.date === date && entry.completed,
        );
        this.habits = this.habitSeedService.setHabitCompletion(this.selectedHabit.id, !isCompleted, date);

        const toast = await this.toastController.create({
            message: !isCompleted ? 'Dia marcado como completado.' : 'Dia marcado como pendiente.',
            duration: 850,
            position: 'bottom',
            color: !isCompleted ? 'success' : 'medium',
        });
        void toast.present();
    }

    protected pickReminderTime(value: string): void {
        this.form.reminderTime = value;
        this.validationMessage = '';
    }

    protected onManualReminderInput(event: Event): void {
        const target = event.target as HTMLInputElement | null;
        const raw = target?.value ?? '';
        this.form.reminderTime = raw;
        this.validationMessage = '';
    }

    protected normalizeManualReminder(): void {
        if (!this.form.reminderTime) {
            return;
        }
        const normalized = this.normalizeTimeInput(this.form.reminderTime);
        if (!normalized) {
            this.validationMessage = 'Hora invalida. Usa formato HH:mm.';
            return;
        }
        this.form.reminderTime = normalized;
        this.validationMessage = '';
    }

    private buildCalendar(habit: HabitSeed, windowDays: number): HabitCalendarDay[] {
        const completedDates = new Set(
            habit.history.filter((entry) => entry.completed).map((entry) => entry.date),
        );
        const baseDate = new Date(`${this.todayKey}T00:00:00`);
        const cells: HabitCalendarDay[] = [];

        for (let day = windowDays - 1; day >= 0; day -= 1) {
            const date = new Date(baseDate);
            date.setDate(date.getDate() - day);
            const key = this.formatDate(date);
            cells.push({
                date: key,
                dayLabel: date.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 2),
                dayNumber: date.getDate(),
                completed: completedDates.has(key),
                isToday: key === this.todayKey,
            });
        }

        return cells;
    }

    protected get selectedHabit(): HabitSeed | undefined {
        if (!this.form.id) {
            return undefined;
        }
        return this.habits.find((habit) => habit.id === this.form.id);
    }

    private deleteHabit(id: string): void {
        this.isModalOpen = false;
        this.deletingHabitId = id;

        setTimeout(() => {
            this.habits = this.habitSeedService.deleteHabit(id);
            this.deletingHabitId = null;
        }, 220);
    }

    private flagSavedHabit(id: string | null): void {
        if (!id) {
            return;
        }
        this.recentlySavedHabitId = id;
        setTimeout(() => {
            if (this.recentlySavedHabitId === id) {
                this.recentlySavedHabitId = null;
            }
        }, 1400);
    }

    private refreshHabits(): void {
        this.habits = this.habitSeedService.getHabits();
    }

    private emptyForm(): HabitFormState {
        return {
            id: null,
            name: '',
            interval: 'daily',
            reminderTime: '',
        };
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private buildReminderOptions(stepMinutes: number): ReminderOption[] {
        const options: ReminderOption[] = [];
        for (let hour = 0; hour < 24; hour += 1) {
            for (let minute = 0; minute < 60; minute += stepMinutes) {
                const hh = String(hour).padStart(2, '0');
                const mm = String(minute).padStart(2, '0');
                const value = `${hh}:${mm}`;
                options.push({
                    value,
                    label: value,
                });
            }
        }
        return options;
    }

    private normalizeTimeInput(raw: string): string | null {
        const trimmed = raw.trim();
        if (!trimmed) {
            return null;
        }

        const colonMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
        if (colonMatch) {
            const hours = Number(colonMatch[1]);
            const minutes = Number(colonMatch[2]);
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                return null;
            }
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        const digits = trimmed.replace(/\D/g, '');
        if (digits.length === 3 || digits.length === 4) {
            const hours = Number(digits.slice(0, digits.length - 2));
            const minutes = Number(digits.slice(-2));
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                return null;
            }
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }

        return null;
    }
}
