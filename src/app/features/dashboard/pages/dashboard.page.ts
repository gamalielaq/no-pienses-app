import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StreakProgressModalComponent } from '../../../components/streak-progress-modal/streak-progress-modal.component';
import { UnlockSlotsModalComponent } from '../../../components/unlock-slots-modal/unlock-slots-modal.component';
import { HabitSeed, HabitSeedService } from '../../../core/services/habit-seed.service';
import { ProgressService } from '../../../core/services/progress.service';
import {
    IonBadge,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonMenuButton,
    IonProgressBar,
    IonText,
    IonTitle,
    IonToolbar,
    ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, flameOutline } from 'ionicons/icons';

@Component({
    selector: 'app-dashboard-page',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonTitle,
        IonBadge,
        IonContent,
        IonText,
        IonList,
        IonItem,
        IonIcon,
        IonLabel,
        IonCheckbox,
        IonProgressBar,
        IonModal,
        IonButton,
    ],
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
    protected readonly today = new Date();
    protected readonly todayKey: string;
    protected streakDays = 0;
    protected habits: HabitSeed[] = [];
    protected completedHabitIds = new Set<string>();
    protected showUnlockRewardModal = false;
    protected unlockedSlots = 0;

    constructor(
        private readonly habitSeedService: HabitSeedService,
        private readonly progressService: ProgressService,
        private readonly modalController: ModalController,
        private readonly router: Router,
    ) {
        this.todayKey = this.habitSeedService.getTodayDate();
        this.refreshState();
        addIcons({
            checkmarkCircleOutline,
            flameOutline,
        });
    }

    ionViewWillEnter(): void {
        this.refreshState();
    }

    protected get completedCount(): number {
        return this.completedHabitIds.size;
    }

    protected get progressLabel(): string {
        return `${this.completedCount} de ${this.habits.length} completados`;
    }

    protected get progressValue(): number {
        if (!this.habits.length) {
            return 0;
        }
        return this.completedCount / this.habits.length;
    }

    protected get maxHabits(): number {
        return this.habitSeedService.getHabitLimit();
    }

    protected get availableSlots(): number {
        return Math.max(this.maxHabits - this.habits.length, 0);
    }

    protected onSlotsIndicatorClick(): void {
        if (this.streakDays < 7) {
            void this.openSlotsInfoModal({
                title: 'Aun no desbloqueado',
                message: 'Completa 7 dias seguidos para desbloquear 2 nuevos habitos.',
                subtext: `Vas en dia ${this.streakDays} de 7. Sigue asi.`,
                iconName: 'flame-outline',
            });
            return;
        }

        if (this.unlockedSlots > 0) {
            void this.router.navigateByUrl('/create-habits');
            return;
        }

        void this.openSlotsInfoModal({
            title: 'Sin espacios disponibles',
            message: 'Completa tu racha para desbloquear mas habitos.',
            subtext: '',
            iconName: 'trophy-outline',
        });
    }

    protected openStreakModal(): void {
        if (this.streakDays >= 7) {
            void this.router.navigateByUrl('/streak-history');
            return;
        }

        void this.presentStreakModal();
    }

    protected onHabitToggle(habitId: string, checked: boolean | undefined): void {
        this.habitSeedService.setHabitCompletion(habitId, !!checked, this.todayKey);
        this.refreshState();
    }

    protected claimAndGoToCreateHabits(): void {
        this.habitSeedService.claimUnlockReward();
        this.showUnlockRewardModal = false;
        void this.router.navigateByUrl('/onboarding/create-habits');
    }

    protected claimAndContinue(): void {
        this.habitSeedService.claimUnlockReward();
        this.showUnlockRewardModal = false;
        this.refreshState();
    }

    private refreshState(): void {
        this.habits = this.habitSeedService.getHabits();
        this.streakDays = this.progressService.getStreakDays();
        this.unlockedSlots = this.progressService.getUnlockedSlots();
        this.showUnlockRewardModal = this.habitSeedService.shouldShowUnlockReward();

        const completedIds = this.habits
            .filter((habit) => this.habitSeedService.isHabitCompletedOnDate(habit.id, this.todayKey))
            .map((habit) => habit.id);

        this.completedHabitIds = new Set(completedIds);
    }

    private async openSlotsInfoModal(params: {
        title: string;
        message: string;
        subtext: string;
        iconName: 'trophy-outline' | 'flame-outline';
    }): Promise<void> {
        const modal = await this.modalController.create({
            component: UnlockSlotsModalComponent,
            componentProps: {
                title: params.title,
                message: params.message,
                subtext: params.subtext,
                buttonLabel: 'Entendido',
                iconName: params.iconName,
            },
            canDismiss: true,
            backdropDismiss: true,
            showBackdrop: true,
        });

        await modal.present();
    }

    private async presentStreakModal(): Promise<void> {
        const modal = await this.modalController.create({
            component: StreakProgressModalComponent,
            componentProps: {
                streakDays: this.streakDays,
                maxStreakGoal: 7,
            },
            canDismiss: true,
            backdropDismiss: true,
            showBackdrop: true,
        });

        await modal.present();
    }
}
