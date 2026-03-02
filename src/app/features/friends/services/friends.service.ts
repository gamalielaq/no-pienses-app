import { Injectable } from '@angular/core';
import {
    Timestamp,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { firebaseAuth, firestoreDb } from '../../../core/firebase/firebase';
import { AppUserProfile, FriendRequest } from '../models/friend-request.model';

@Injectable({
    providedIn: 'root',
})
export class FriendsService {
    private readonly usersCollection = collection(firestoreDb, 'users');
    private readonly requestsCollection = collection(firestoreDb, 'friendRequests');

    getAllUsers$(): Observable<AppUserProfile[]> {
        return new Observable<AppUserProfile[]>((subscriber) => {
            const currentUid = this.requireUid();
            const unsubscribe = onSnapshot(
                this.usersCollection,
                (snapshot) => {
                    const users = snapshot.docs
                        .map((entry) => this.parseUser(entry.id, entry.data()))
                        .filter((user) => user.uid !== currentUid);
                    subscriber.next(users);
                },
                (error) => subscriber.error(error),
            );

            return () => unsubscribe();
        });
    }

    getIncomingRequests$(): Observable<FriendRequest[]> {
        return new Observable<FriendRequest[]>((subscriber) => {
            const currentUid = this.requireUid();
            const incomingQuery = query(
                this.requestsCollection,
                where('toUid', '==', currentUid),
                where('status', '==', 'pending'),
            );

            const unsubscribe = onSnapshot(
                incomingQuery,
                (snapshot) => {
                    const requests = snapshot.docs.map((entry) => this.parseRequest(entry.id, entry.data()));
                    subscriber.next(requests);
                },
                (error) => subscriber.error(error),
            );

            return () => unsubscribe();
        });
    }

    getMyRelatedRequests$(): Observable<FriendRequest[]> {
        return new Observable<FriendRequest[]>((subscriber) => {
            const currentUid = this.requireUid();
            const sentQuery = query(this.requestsCollection, where('fromUid', '==', currentUid));
            const receivedQuery = query(this.requestsCollection, where('toUid', '==', currentUid));

            let sent: FriendRequest[] = [];
            let received: FriendRequest[] = [];

            const emit = () => {
                const merged = new Map<string, FriendRequest>();
                [...sent, ...received].forEach((request) => merged.set(request.id, request));
                subscriber.next([...merged.values()]);
            };

            const unsubSent = onSnapshot(
                sentQuery,
                (snapshot) => {
                    sent = snapshot.docs.map((entry) => this.parseRequest(entry.id, entry.data()));
                    emit();
                },
                (error) => subscriber.error(error),
            );

            const unsubReceived = onSnapshot(
                receivedQuery,
                (snapshot) => {
                    received = snapshot.docs.map((entry) => this.parseRequest(entry.id, entry.data()));
                    emit();
                },
                (error) => subscriber.error(error),
            );

            return () => {
                unsubSent();
                unsubReceived();
            };
        });
    }

    async sendFollowRequest(toUid: string): Promise<void> {
        const fromUid = this.requireUid();
        const currentUser = this.requireUser();
        const normalizedToUid = toUid.trim();
        if (!normalizedToUid) {
            throw new Error('UID invalido.');
        }
        if (normalizedToUid === fromUid) {
            throw new Error('No puedes enviarte solicitud a ti mismo.');
        }

        const existing = await this.getRelationshipRequests(fromUid, normalizedToUid);
        const blocked = existing.find((request) => request.status === 'pending' || request.status === 'accepted');
        if (blocked) {
            throw new Error('Ya existe una relacion o solicitud activa con este usuario.');
        }

        const requestRef = doc(this.requestsCollection);
        const now = Timestamp.now();
        await setDoc(requestRef, {
            fromUid,
            toUid: normalizedToUid,
            fromDisplayName: currentUser.displayName ?? currentUser.email ?? 'Usuario',
            fromPhotoURL: currentUser.photoURL ?? null,
            fromEmail: currentUser.email ?? '',
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        });
    }

    async respondToRequest(requestId: string, accept: boolean): Promise<void> {
        const uid = this.requireUid();
        const requestRef = doc(this.requestsCollection, requestId);
        const requestSnapshot = await getDoc(requestRef);
        if (!requestSnapshot.exists()) {
            throw new Error('Solicitud no encontrada.');
        }

        const request = this.parseRequest(requestSnapshot.id, requestSnapshot.data());
        if (request.toUid !== uid) {
            throw new Error('No tienes permisos para responder esta solicitud.');
        }

        await updateDoc(requestRef, {
            status: accept ? 'accepted' : 'rejected',
            updatedAt: Timestamp.now(),
        });
    }

    async unfollowUser(userUid: string): Promise<void> {
        const currentUid = this.requireUid();
        const relations = await this.getRelationshipRequests(currentUid, userUid);
        const acceptedRelation = relations.find((request) => request.status === 'accepted');

        if (!acceptedRelation) {
            throw new Error('No existe una relacion activa con este usuario.');
        }

        await updateDoc(doc(this.requestsCollection, acceptedRelation.id), {
            status: 'rejected',
            updatedAt: Timestamp.now(),
        });
    }

    private async getRelationshipRequests(uidA: string, uidB: string): Promise<FriendRequest[]> {
        const queryA = query(
            this.requestsCollection,
            where('fromUid', '==', uidA),
            where('toUid', '==', uidB),
        );
        const queryB = query(
            this.requestsCollection,
            where('fromUid', '==', uidB),
            where('toUid', '==', uidA),
        );

        const [snapshotA, snapshotB] = await Promise.all([getDocs(queryA), getDocs(queryB)]);
        return [...snapshotA.docs, ...snapshotB.docs].map((entry) => this.parseRequest(entry.id, entry.data()));
    }

    private parseUser(uid: string, data: Record<string, unknown>): AppUserProfile {
        const displayName = String(data['displayName'] ?? data['email'] ?? 'Usuario');
        const email = String(data['email'] ?? '');
        const photoURL = (data['photoURL'] as string | null | undefined) ?? null;
        const streakFromDoc = Number(data['streakDays'] ?? data['currentStreak'] ?? data['streak'] ?? 0);

        return {
            uid,
            displayName,
            email,
            photoURL,
            streak: Number.isFinite(streakFromDoc) ? streakFromDoc : 0,
        };
    }

    private parseRequest(id: string, data: Record<string, unknown>): FriendRequest {
        return {
            id,
            fromUid: String(data['fromUid'] ?? ''),
            toUid: String(data['toUid'] ?? ''),
            fromDisplayName: String(data['fromDisplayName'] ?? ''),
            fromPhotoURL: (data['fromPhotoURL'] as string | null | undefined) ?? null,
            fromEmail: String(data['fromEmail'] ?? ''),
            status: (data['status'] as FriendRequest['status']) ?? 'pending',
            createdAt: (data['createdAt'] as Timestamp | undefined) ?? Timestamp.now(),
            updatedAt: (data['updatedAt'] as Timestamp | undefined) ?? Timestamp.now(),
        };
    }

    private requireUid(): string {
        const uid = firebaseAuth.currentUser?.uid;
        if (!uid) {
            throw new Error('No hay usuario autenticado.');
        }
        return uid;
    }

    private requireUser() {
        const user = firebaseAuth.currentUser;
        if (!user) {
            throw new Error('No hay usuario autenticado.');
        }
        return user;
    }
}
