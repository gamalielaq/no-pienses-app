import { CommonModule } from '@angular/common';
import { Component, NgZone, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonProgressBar,
    IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline, sparklesOutline } from 'ionicons/icons';
import { HabitSeed, HabitSeedService } from '../../../../core/services/habit-seed.service';

@Component({
    selector: 'app-create-habits-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonInput,
        IonButton,
        IonIcon,
        IonList,
        IonItem,
        IonLabel,
        IonText,
        IonProgressBar,
    ],
    templateUrl: './create-habits.page.html',
    styleUrl: './create-habits.page.scss',
})
export class CreateHabitsPage {
    @ViewChild('habitInputEl') private inputRef?: IonInput;

    protected habitName = '';
    protected habits: HabitSeed[] = [];
    protected validationMessage = '';

    constructor(
        private readonly habitSeedService: HabitSeedService,
        private readonly ngZone: NgZone,
        private readonly router: Router,
    ) {
        addIcons({
            addOutline,
            closeOutline,
            sparklesOutline,
        });
        this.habits = this.habitSeedService.getHabits();
    }

    protected get maxHabits(): number {
        return this.habitSeedService.getHabitLimit();
    }

    protected get progressLabel(): string {
        return `${this.habits.length} de ${this.maxHabits} habitos definidos`;
    }

    protected get progressValue(): number {
        return this.habits.length / this.maxHabits;
    }

    protected get canContinue(): boolean {
        return this.habits.length >= 1;
    }

    protected addHabit(): void {
        this.validationMessage = '';

        try {
            this.habits = this.habitSeedService.addHabit(this.habitName);
            this.habitName = '';
            this.focusInput();
        } catch (error) {
            this.validationMessage =
                error instanceof Error ? error.message : 'No se pudo agregar el habito.';
            this.focusInput();
        }
    }

    protected removeHabit(id: string): void {
        this.validationMessage = '';
        this.habits = this.habitSeedService.removeHabit(id);
        this.focusInput();
    }

    protected continueToDashboard(): void {
        debugger
        if (!this.canContinue) {
            return;
        }

        localStorage.setItem('onboarding_done', 'true');
        (document.activeElement as HTMLElement | null)?.blur();

        void this.router.navigate(['/tabs', 'dashboard'], { replaceUrl: true });
        // setTimeout(() => {
        //     this.ngZone.run(() => {
        //     });
        // }, 0);
    }

    protected onEnterKey(event: Event): void {
        event.preventDefault();
        this.addHabit();
    }

    private focusInput(): void {
        queueMicrotask(() => void this.inputRef?.setFocus());
    }
}
