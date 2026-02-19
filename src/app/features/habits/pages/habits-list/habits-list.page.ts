import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HabitSeed, HabitSeedService } from '../../../../core/services/habit-seed.service';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonText,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-habits-list-page',
    standalone: true,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonTitle,
        IonContent,
        IonList,
        IonItem,
        IonLabel,
        IonText,
        IonButton,
    ],
    templateUrl: './habits-list.page.html',
    styleUrl: './habits-list.page.scss',
})
export class HabitsListPage {
    protected habits: HabitSeed[] = [];

    constructor(
        private readonly habitSeedService: HabitSeedService,
        private readonly router: Router,
    ) {
        this.refreshState();
    }

    ionViewWillEnter(): void {
        this.refreshState();
    }

    protected get maxHabits(): number {
        return this.habitSeedService.getHabitLimit();
    }

    protected get availableSlots(): number {
        return Math.max(this.maxHabits - this.habits.length, 0);
    }

    protected goToCreateHabits(): void {
        void this.router.navigateByUrl('/onboarding/create-habits');
    }

    private refreshState(): void {
        this.habits = this.habitSeedService.getHabits();
    }
}
