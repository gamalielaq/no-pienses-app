import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
    IonButtons,
    IonContent,
    IonHeader,
    IonMenuButton,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';
import { HabitRecord, HabitsService } from '../../../core/services/habits.service';
import { DashboardHabitsComponent } from '../components/dashboard-habits/dashboard-habits.component';
import { DashboardHabitsService } from '../services/dashboard-habits.service';

@Component({
    selector: 'app-dashboard-page',
    standalone: true,
    imports: [
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonTitle,
        IonContent,
        DashboardHabitsComponent,
    ],
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
    protected readonly habits = signal<HabitRecord[]>([]);
    protected readonly completedTodayIds = signal<Set<string>>(new Set<string>());
    protected readonly pendingHabitIds = signal<Set<string>>(new Set<string>());
    protected readonly streakDays = signal(0);
    protected readonly isLoading = signal(false);
    protected readonly isUpdating = signal(false);
    protected readonly errorMessage = signal('');

    constructor(
        private readonly authService: AuthService,
        private readonly habitsService: HabitsService,
        private readonly dashboardHabitsService: DashboardHabitsService,
        private readonly router: Router,
    ) {}

    ionViewWillEnter(): void {
        void this.loadDashboard();
    }

    protected onHabitToggle(event: { habitId: string; checked: boolean | undefined }): void {
        void this.toggleHabit(event.habitId, event.checked);
    }

    private async loadDashboard(): Promise<void> {
        this.isLoading.set(true);
        this.errorMessage.set('');

        try {
            await this.authService.waitForAuthReady();
            if (!this.authService.getCurrentUser()) {
                void this.router.navigateByUrl('/onboarding', { replaceUrl: true });
                return;
            }

            const habits = await this.habitsService.getUserHabits();
            this.habits.set(habits);
            
            const snapshot = await this.dashboardHabitsService.getDashboardSnapshot();
            this.completedTodayIds.set(snapshot.completedTodayIds);
            this.streakDays.set(snapshot.streakDays);
        } catch (error) {
            console.error('[Dashboard] Load failed:', error);
            this.errorMessage.set('No se pudo cargar el dashboard.');
        } finally {
            this.isLoading.set(false);
        }
    }

    private async toggleHabit(habitId: string, checked: boolean | undefined): Promise<void> {
        if (this.pendingHabitIds().has(habitId)) {
            return;
        }

        const completed = !!checked;
        const previous = new Set(this.completedTodayIds());
        const next = new Set(previous);
        if (completed) {
            next.add(habitId);
        } else {
            next.delete(habitId);
        }

        this.completedTodayIds.set(next);
        this.pendingHabitIds.update((ids) => {
            const copy = new Set(ids);
            copy.add(habitId);
            return copy;
        });
        this.isUpdating.set(true);
        this.errorMessage.set('');

        try {
            await this.dashboardHabitsService.setHabitCompletion(habitId, completed);
            const snapshot = await this.dashboardHabitsService.getDashboardSnapshot();
            this.completedTodayIds.set(snapshot.completedTodayIds);
            this.streakDays.set(snapshot.streakDays);
        } catch (error) {
            console.error('[Dashboard] Toggle failed:', error);
            this.completedTodayIds.set(previous);
            this.errorMessage.set('No se pudo actualizar el habito.');
        } finally {
            this.pendingHabitIds.update((ids) => {
                const copy = new Set(ids);
                copy.delete(habitId);
                return copy;
            });
            this.isUpdating.set(false);
        }
    }
}
