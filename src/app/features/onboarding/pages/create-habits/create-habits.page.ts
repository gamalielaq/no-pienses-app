import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonProgressBar,
    IonText,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../../core/services/auth.service';
import { HabitsService } from '../../../../core/services/habits.service';

@Component({
    selector: 'app-create-habits-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonInput,
        IonButton,
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
    authService = inject(AuthService);
    habitsService = inject(HabitsService);
    router = inject(Router);

    readonly maxHabits = signal(3);
    readonly habitName = signal('');
    readonly habits = signal<string[]>([]);
    readonly validationMessage = signal('');
    readonly isLoading = signal(false);
    readonly isSaving = signal(false);

    readonly progressLabel = computed(
        () => `${this.habits().length} de ${this.maxHabits()} configurados`,
    );

    protected readonly progressValue = computed(() => {
        const max = this.maxHabits();
        return max ? this.habits().length / max : 0;
    });

    async ionViewWillEnter(): Promise<void> {
        this.isLoading.set(true);
        this.validationMessage.set('');

        try {
            await this.authService.waitForAuthReady();
            if (!this.authService.getCurrentUser()) {
                void this.router.navigateByUrl('/onboarding', { replaceUrl: true });
                return;
            }

            const progress = await this.habitsService.getUserProgress();
            const limit = progress.habitLimitUnlocked ? 5 : 3;
            this.maxHabits.set(limit);

            const existing = await this.habitsService.getUserHabits();
            this.habits.set(existing.map((item) => item.name).slice(0, limit));

        } catch (error) {
            console.error('[CreateHabits] Error loading habits:', error);
            this.validationMessage.set('No se pudieron cargar tus habitos.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected addHabit(): void {
        const name = this.habitName().trim();

        if (!name) {
            this.validationMessage.set('Escribe un habito antes de agregar.');
            return;
        }

        if (this.habits().length >= this.maxHabits()) {
            this.validationMessage.set(`Solo puedes registrar ${this.maxHabits()} habitos.`);
            return;
        }

        const duplicated = this.habits().some((item) => item.toLowerCase() === name.toLowerCase());
        if (duplicated) {
            this.validationMessage.set('Ese habito ya existe en la lista.');
            return;
        }

        this.habits.update((items) => [...items, name]);
        this.habitName.set('');
        this.validationMessage.set('');
    }

    protected removeHabit(index: number): void {
        this.habits.update((items) => items.filter((_, position) => position !== index));
        this.validationMessage.set('');
    }

    protected async saveHabits(): Promise<void> {
        if (this.isSaving() || this.isLoading()) {
            return;
        }

        if (!this.habits().length) {
            this.validationMessage.set('Agrega al menos un habito para continuar.');
            return;
        }

        this.isSaving.set(true);
        this.validationMessage.set('');

        try {
            await this.habitsService.saveInitialHabits(this.habits());
            void this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        } catch (error) {
            console.error('[CreateHabits] Error saving habits:', error);
            this.validationMessage.set('No se pudieron guardar tus habitos. Intenta de nuevo.');
        } finally {
            this.isSaving.set(false);
        }
    }
}
