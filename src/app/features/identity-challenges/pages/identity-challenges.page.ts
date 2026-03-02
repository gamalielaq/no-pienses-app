import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firebaseAuth } from '../../../core/firebase/firebase';
import {
    IonAvatar,
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonText,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    CreateIdentityChallengeInput,
    IdentityChallenge,
    IdentityChallengeDuration,
} from '../models/identity-challenge.model';
import {
    IdentityChallengesService,
    IdentityUserLookup,
} from '../services/identity-challenges.service';

@Component({
    selector: 'app-identity-challenges-page',
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
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonItem,
        IonLabel,
        IonInput,
        IonButton,
        IonSegment,
        IonSegmentButton,
        IonList,
        IonAvatar,
        IonBadge,
        IonText,
        IonNote,
    ],
    templateUrl: './identity-challenges.page.html',
    styleUrl: './identity-challenges.page.scss',
})
export class IdentityChallengesPage {
    private readonly destroyRef = inject(DestroyRef);
    private readonly identityChallengesService = inject(IdentityChallengesService);

    protected readonly challenges = signal<IdentityChallenge[]>([]);
    protected readonly selectedChallengeId = signal<string | null>(null);
    protected readonly isLoading = signal(false);
    protected readonly errorMessage = signal('');
    protected readonly successMessage = signal('');
    protected readonly myUid = signal(firebaseAuth.currentUser?.uid ?? '');

    protected readonly createTitle = signal('');
    protected readonly createDescription = signal('');
    protected readonly createHabitId = signal('');
    protected readonly createDurationDays = signal<IdentityChallengeDuration>(21);
    protected readonly inviteUid = signal('');
    protected readonly inviteSearchTerm = signal('');
    protected readonly inviteSuggestions = signal<IdentityUserLookup[]>([]);

    protected readonly selectedChallenge = computed(() => {
        const selectedId = this.selectedChallengeId();
        if (!selectedId) {
            return null;
        }
        return this.challenges().find((item) => item.id === selectedId) ?? null;
    });

    constructor() {
        this.identityChallengesService
            .getMyChallenges$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (challenges) => {
                    this.myUid.set(firebaseAuth.currentUser?.uid ?? '');
                    this.challenges.set(challenges);
                    if (!this.selectedChallengeId() && challenges.length) {
                        this.selectedChallengeId.set(challenges[0].id);
                    }
                },
                error: (error) => {
                    console.error('[IdentityChallenges] subscription failed:', error);
                    this.errorMessage.set('No se pudieron cargar los retos de identidad.');
                },
            });
    }

    protected selectChallenge(challengeId: string): void {
        this.selectedChallengeId.set(challengeId);
        this.errorMessage.set('');
        this.successMessage.set('');
    }

    protected async createChallenge(): Promise<void> {
        if (this.isLoading()) {
            return;
        }

        const payload: CreateIdentityChallengeInput = {
            title: this.createTitle().trim(),
            description: this.createDescription().trim(),
            habitId: this.createHabitId().trim(),
            durationDays: this.createDurationDays(),
        };

        if (!payload.title || !payload.description || !payload.habitId) {
            this.errorMessage.set('Completa titulo, descripcion y habitId.');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            const challengeId = await this.identityChallengesService.createChallenge(payload);
            this.selectedChallengeId.set(challengeId);
            this.createTitle.set('');
            this.createDescription.set('');
            this.createHabitId.set('');
            this.createDurationDays.set(21);
            this.successMessage.set('Reto creado correctamente.');
        } catch (error) {
            console.error('[IdentityChallenges] create failed:', error);
            this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo crear el reto.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async checkIn(): Promise<void> {
        const challenge = this.selectedChallenge();
        if (!challenge || this.isLoading()) {
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            await this.identityChallengesService.checkIn(challenge.id);
            this.successMessage.set('Check-in diario registrado.');
        } catch (error) {
            console.error('[IdentityChallenges] check-in failed:', error);
            this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo registrar check-in.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async inviteParticipant(): Promise<void> {
        const challenge = this.selectedChallenge();
        if (!challenge || this.isLoading()) {
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            await this.identityChallengesService.inviteParticipant(challenge.id, this.inviteUid());
            this.inviteUid.set('');
            this.successMessage.set('Invitacion enviada al reto.');
        } catch (error) {
            console.error('[IdentityChallenges] invite failed:', error);
            this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo invitar al usuario.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async searchUsersToInvite(): Promise<void> {
        const term = this.inviteSearchTerm().trim();
        if (!term) {
            this.inviteSuggestions.set([]);
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            const users = await this.identityChallengesService.searchUsers(term);
            this.inviteSuggestions.set(users);
            if (!users.length) {
                this.errorMessage.set('No se encontraron usuarios. Usa UID manual si no aparece.');
            }
        } catch (error) {
            console.error('[IdentityChallenges] user search failed:', error);
            this.errorMessage.set(
                'No se pudo buscar usuarios (verifica reglas Firestore). Puedes invitar por UID manual.',
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    protected selectInviteUser(user: IdentityUserLookup): void {
        this.inviteUid.set(user.uid);
        this.inviteSuggestions.set([]);
        this.inviteSearchTerm.set(user.email || user.displayName || user.uid);
        this.successMessage.set('Usuario seleccionado para invitacion.');
        this.errorMessage.set('');
    }

    protected async copyMyUid(): Promise<void> {
        const uid = this.myUid();
        if (!uid) {
            return;
        }

        try {
            await navigator.clipboard.writeText(uid);
            this.successMessage.set('Tu UID fue copiado.');
            this.errorMessage.set('');
        } catch (error) {
            console.error('[IdentityChallenges] copy uid failed:', error);
            this.errorMessage.set('No se pudo copiar UID. Copialo manualmente.');
        }
    }

    protected async validateRisk(): Promise<void> {
        const challenge = this.selectedChallenge();
        if (!challenge || this.isLoading()) {
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            await this.identityChallengesService.applyRiskValidation(challenge.id);
            this.successMessage.set('Riesgo validado para participantes.');
        } catch (error) {
            console.error('[IdentityChallenges] risk validation failed:', error);
            this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo validar riesgo.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected challengeDaysLabel(challenge: IdentityChallenge): string {
        const start = challenge.startDate.toDate().getTime();
        const end = challenge.endDate.toDate().getTime();
        const now = Date.now();
        const total = Math.max(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 1);
        const elapsed = Math.max(Math.ceil((Math.min(now, end) - start) / (1000 * 60 * 60 * 24)), 0);
        return `${elapsed} / ${total} dias`;
    }

    protected riskColor(level: number): 'success' | 'warning' | 'danger' {
        if (level === 0) {
            return 'success';
        }
        if (level === 1) {
            return 'warning';
        }
        return 'danger';
    }

    protected riskLabel(level: number): string {
        if (level === 0) {
            return 'Estable';
        }
        if (level === 1) {
            return 'En riesgo';
        }
        return 'Desconectado';
    }
}
