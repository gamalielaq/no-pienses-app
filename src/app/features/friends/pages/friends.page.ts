import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
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
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonNote,
    IonText,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppUserProfile, FriendRequest } from '../models/friend-request.model';
import { FriendsService } from '../services/friends.service';

type RelationState = 'none' | 'pending-sent' | 'pending-received' | 'accepted';

@Component({
    selector: 'app-friends-page',
    standalone: true,
    imports: [
        CommonModule,
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
        IonList,
        IonItem,
        IonLabel,
        IonAvatar,
        IonButton,
        IonBadge,
        IonNote,
        IonText,
    ],
    templateUrl: './friends.page.html',
    styleUrl: './friends.page.scss',
})
export class FriendsPage {
    private readonly destroyRef = inject(DestroyRef);
    private readonly friendsService = inject(FriendsService);

    protected readonly users = signal<AppUserProfile[]>([]);
    protected readonly requests = signal<FriendRequest[]>([]);
    protected readonly incomingRequests = signal<FriendRequest[]>([]);
    protected readonly isLoading = signal(false);
    protected readonly message = signal('');
    protected readonly errorMessage = signal('');

    protected readonly incomingRequestCount = computed(() => this.incomingRequests().length);
    protected readonly myUid = computed(() => firebaseAuth.currentUser?.uid ?? '');
    protected readonly friends = computed(() => {
        const uid = this.myUid();
        if (!uid) {
            return [];
        }

        const friendUids = this.requests()
            .filter((request) => request.status === 'accepted')
            .map((request) => (request.fromUid === uid ? request.toUid : request.fromUid));

        const uniqueFriendUids = [...new Set(friendUids)];
        return uniqueFriendUids
            .map((friendUid) => this.users().find((user) => user.uid === friendUid))
            .filter((user): user is AppUserProfile => !!user);
    });

    constructor() {
        this.friendsService
            .getAllUsers$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (users) => this.users.set(users),
                error: (error) => {
                    console.error('[Friends] load users failed:', error);
                    this.errorMessage.set('No se pudieron cargar los usuarios.');
                },
            });

        this.friendsService
            .getMyRelatedRequests$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (requests) => this.requests.set(requests),
                error: (error) => {
                    console.error('[Friends] load relations failed:', error);
                    this.errorMessage.set('No se pudieron cargar relaciones.');
                },
            });

        this.friendsService
            .getIncomingRequests$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (requests) => this.incomingRequests.set(requests),
                error: (error) => {
                    console.error('[Friends] load notifications failed:', error);
                    this.errorMessage.set('No se pudieron cargar notificaciones.');
                },
            });
    }

    protected async sendFollowRequest(user: AppUserProfile): Promise<void> {
        this.isLoading.set(true);
        this.message.set('');
        this.errorMessage.set('');
        try {
            await this.friendsService.sendFollowRequest(user.uid);
            this.message.set(`Solicitud enviada a ${user.displayName}.`);
        } catch (error) {
            this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo enviar solicitud.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected async acceptRequest(request: FriendRequest): Promise<void> {
        await this.respondToRequest(request, true);
    }

    protected async rejectRequest(request: FriendRequest): Promise<void> {
        await this.respondToRequest(request, false);
    }

    protected async unfollow(user: AppUserProfile): Promise<void> {
        this.isLoading.set(true);
        this.message.set('');
        this.errorMessage.set('');
        try {
            await this.friendsService.unfollowUser(user.uid);
            this.message.set(`Dejaste de seguir a ${user.displayName}.`);
        } catch (error) {
            this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo dejar de seguir.');
        } finally {
            this.isLoading.set(false);
        }
    }

    protected relationState(userUid: string): RelationState {
        const relationship = this.requests().find(
            (request) =>
                (request.fromUid === userUid || request.toUid === userUid) &&
                (request.status === 'pending' || request.status === 'accepted'),
        );

        if (!relationship) {
            return 'none';
        }

        if (relationship.status === 'accepted') {
            return 'accepted';
        }

        if (relationship.fromUid === userUid) {
            return 'pending-received';
        }

        return 'pending-sent';
    }

    protected userByUid(uid: string): AppUserProfile | undefined {
        return this.users().find((user) => user.uid === uid);
    }

    protected requesterName(request: FriendRequest): string {
        return this.userByUid(request.fromUid)?.displayName || request.fromDisplayName || 'Usuario';
    }

    protected requesterPhoto(request: FriendRequest): string | null {
        return this.userByUid(request.fromUid)?.photoURL || request.fromPhotoURL || null;
    }

    protected requesterSubtitle(request: FriendRequest): string {
        return this.userByUid(request.fromUid)?.email || request.fromEmail || 'Miembro activo';
    }

    private async respondToRequest(request: FriendRequest, accept: boolean): Promise<void> {
        this.isLoading.set(true);
        this.message.set('');
        this.errorMessage.set('');
        try {
            await this.friendsService.respondToRequest(request.id, accept);
            this.message.set(accept ? 'Solicitud aceptada.' : 'Solicitud rechazada.');
        } catch (error) {
            this.errorMessage.set(error instanceof Error ? error.message : 'No se pudo responder solicitud.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
