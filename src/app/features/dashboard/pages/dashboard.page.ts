import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
    AlertController,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonText,
    IonMenuButton,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flameOutline, lockClosedOutline, peopleOutline, sparklesOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { HabitRecord } from '../../../core/services/habits.service';
import { DashboardHabitsComponent } from '../components/dashboard-habits/dashboard-habits.component';
import { DashboardHabitsService } from '../services/dashboard-habits.service';

@Component({
    selector: 'app-dashboard-page',
    standalone: true,
    imports: [
        IonHeader,
        IonToolbar,
        IonButton,
        IonButtons,
        IonBadge,
        IonIcon,
        IonMenuButton,
        IonTitle,
        IonContent,
        IonModal,
        IonText,
        DashboardHabitsComponent,
    ],
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
    protected readonly todayLabel = this.buildTodayLabel();
    protected readonly habits = signal<HabitRecord[]>([]);
    protected readonly completedTodayIds = signal<Set<string>>(new Set<string>());
    protected readonly pendingHabitIds = signal<Set<string>>(new Set<string>());
    protected readonly streakDays = signal(0);
    protected readonly habitLimit = signal(3);
    protected readonly habitLimitUnlocked = signal(false);
    protected readonly rewardClaimed = signal(false);
    protected readonly showUnlockRewardModal = signal(false);
    protected readonly isLoading = signal(false);
    protected readonly isUpdating = signal(false);
    protected readonly errorMessage = signal('');

    constructor(
        private readonly authService: AuthService,
        private readonly dashboardHabitsService: DashboardHabitsService,
        private readonly router: Router,
        private readonly alertController: AlertController,
    ) {
        addIcons({
            flameOutline,
            lockClosedOutline,
            peopleOutline,
            sparklesOutline,
        });
    }

    ionViewWillEnter(): void {
        void this.loadDashboard();
    }

    protected onHabitToggle(event: { habitId: string; checked: boolean | undefined }): void {
        void this.toggleHabit(event.habitId, event.checked);
    }

    protected async onUnlockIndicatorClick(): Promise<void> {
        if (this.habitLimitUnlocked()) {
            const alert = await this.alertController.create({
                header: 'Acceso desbloqueado',
                message: 'Ya puedes configurar hasta 5 habitos.',
                buttons: ['Entendido'],
            });
            await alert.present();
            return;
        }

        const pendingDays = Math.max(7 - this.streakDays(), 0);
        const alert = await this.alertController.create({
            header: 'Aun sin acceso',
            message: `Necesitas una racha de 7 dias. Te faltan ${pendingDays} dia(s). Sigue con la racha.`,
            buttons: ['Entendido'],
        });
        await alert.present();
    }

    protected goToIdentityChallenges(): void {
        void this.router.navigateByUrl('/identity-challenges');
    }

    protected async claimRewardAndGoCreateHabits(): Promise<void> {
        await this.dashboardHabitsService.claimUnlockReward();
        this.showUnlockRewardModal.set(false);
        await this.loadDashboard();
        void this.router.navigateByUrl('/onboarding/create-habits');
    }

    protected async claimRewardAndContinue(): Promise<void> {
        await this.dashboardHabitsService.claimUnlockReward();
        this.showUnlockRewardModal.set(false);
        await this.loadDashboard();
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

            const snapshot = await this.dashboardHabitsService.getDashboardSnapshot();
            this.habits.set(snapshot.habits);
            this.completedTodayIds.set(snapshot.completedTodayIds);
            this.streakDays.set(snapshot.streakDays);
            this.habitLimit.set(snapshot.habitLimit);
            this.habitLimitUnlocked.set(snapshot.habitLimitUnlocked);
            this.rewardClaimed.set(snapshot.rewardClaimed);
            this.showUnlockRewardModal.set(snapshot.canUnlockByStreak && !snapshot.rewardClaimed);
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
            this.habits.set(snapshot.habits);
            this.completedTodayIds.set(snapshot.completedTodayIds);
            this.streakDays.set(snapshot.streakDays);
            this.habitLimit.set(snapshot.habitLimit);
            this.habitLimitUnlocked.set(snapshot.habitLimitUnlocked);
            this.rewardClaimed.set(snapshot.rewardClaimed);
            this.showUnlockRewardModal.set(snapshot.canUnlockByStreak && !snapshot.rewardClaimed);
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

    private buildTodayLabel(): string {
        const raw = new Intl.DateTimeFormat('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
        }).format(new Date());
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
}
