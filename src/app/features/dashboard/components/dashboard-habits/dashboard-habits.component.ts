import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    IonButton,
    IonCheckbox,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonProgressBar,
    IonSkeletonText,
    IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flameOutline } from 'ionicons/icons';
import { HabitRecord } from '../../../../core/services/habits.service';

@Component({
    selector: 'app-dashboard-habits',
    standalone: true,
    imports: [
        CommonModule,
        IonText,
        IonList,
        IonItem,
        IonLabel,
        IonCheckbox,
        IonIcon,
        IonProgressBar,
        IonSkeletonText,
        IonButton,
        RouterLink,
    ],
    templateUrl: './dashboard-habits.component.html',
    styleUrl: './dashboard-habits.component.scss',
})
export class DashboardHabitsComponent {
    readonly habits = input<HabitRecord[]>([]);
    readonly completedTodayIds = input<Set<string>>(new Set<string>());
    readonly streakDays = input(0);
    readonly isLoading = input(false);
    readonly isUpdating = input(false);
    readonly pendingHabitIds = input<Set<string>>(new Set<string>());
    readonly errorMessage = input('');
    readonly habitToggle = output<{ habitId: string; checked: boolean | undefined }>();

    protected readonly completedCount = computed(() => {
        const completed = this.completedTodayIds();
        return this.habits().reduce((count, habit) => count + (completed.has(habit.id) ? 1 : 0), 0);
    });
    protected readonly progressLabel = computed(
        () => `${this.completedCount()} de ${this.habits().length} completados`,
    );

    protected readonly progressValue = computed(() =>
        this.habits().length ? this.completedCount() / this.habits().length : 0,
    );

    protected isHabitCompleted(habitId: string): boolean {
        return this.completedTodayIds().has(habitId);
    }

    protected onHabitToggle(habitId: string, checked: boolean | undefined): void {
        this.habitToggle.emit({ habitId, checked });
    }

    protected isHabitPending(habitId: string): boolean {
        return this.pendingHabitIds().has(habitId);
    }

    constructor() {
        addIcons({ flameOutline });
    }
}
