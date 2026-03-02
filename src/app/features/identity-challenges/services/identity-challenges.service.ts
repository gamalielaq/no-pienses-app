import { Injectable } from '@angular/core';
import {
    Timestamp,
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { firebaseAuth, firestoreDb } from '../../../core/firebase/firebase';
import {
    CreateIdentityChallengeInput,
    IdentityChallenge,
    IdentityChallengeParticipant,
    IdentityRiskLevel,
} from '../models/identity-challenge.model';

const MAX_PARTICIPANTS = 5;

@Injectable({
    providedIn: 'root',
})
export class IdentityChallengesService {
    private readonly challengesCollection = collection(firestoreDb, 'identityChallenges');

    getMyChallenges$(): Observable<IdentityChallenge[]> {
        return new Observable<IdentityChallenge[]>((subscriber) => {
            const uid = this.requireUid();
            const challengesQuery = query(
                this.challengesCollection,
                where('participantUids', 'array-contains', uid),
            );

            const unsubscribe = onSnapshot(
                challengesQuery,
                (snapshot) => {
                    const challenges = snapshot.docs.map((entry) => this.parseChallenge(entry.id, entry.data()));
                    challenges.forEach((challenge) => {
                        void this.applyRiskValidation(challenge.id);
                    });
                    subscriber.next(challenges);
                },
                (error) => subscriber.error(error),
            );

            return () => unsubscribe();
        });
    }

    async createChallenge(input: CreateIdentityChallengeInput): Promise<string> {
        const user = this.requireUser();
        const now = Timestamp.now();
        const endDate = Timestamp.fromDate(
            new Date(now.toDate().getTime() + input.durationDays * 24 * 60 * 60 * 1000),
        );
        const challengeRef = doc(this.challengesCollection);
        const creatorParticipant: IdentityChallengeParticipant = {
            uid: user.uid,
            joinedAt: now,
            status: 'active',
            currentStreak: 0,
            lastCheckIn: null,
            riskLevel: 0,
            displayName: user.displayName ?? user.email ?? user.uid,
            photoURL: user.photoURL ?? undefined,
        };

        await setDoc(challengeRef, {
            title: input.title.trim(),
            description: input.description.trim(),
            habitId: input.habitId.trim(),
            creatorUid: user.uid,
            participants: [creatorParticipant],
            startDate: now,
            endDate,
            maxParticipants: MAX_PARTICIPANTS,
            participantUids: [user.uid],
        });

        return challengeRef.id;
    }

    async inviteParticipant(challengeId: string, invitedUid: string): Promise<void> {
        const currentUid = this.requireUid();
        const normalizedUid = invitedUid.trim();
        if (!normalizedUid) {
            throw new Error('UID invalido.');
        }

        const challengeRef = doc(this.challengesCollection, challengeId);
        const snapshot = await getDoc(challengeRef);
        if (!snapshot.exists()) {
            throw new Error('Reto no encontrado.');
        }

        const challenge = this.parseChallenge(snapshot.id, snapshot.data());
        if (challenge.creatorUid !== currentUid) {
            throw new Error('Solo el creador puede invitar participantes.');
        }

        const activeParticipants = challenge.participants.filter((item) => item.status === 'active');
        if (activeParticipants.length >= MAX_PARTICIPANTS) {
            throw new Error('El reto ya alcanzo el maximo de 5 participantes.');
        }

        if (challenge.participants.some((item) => item.uid === normalizedUid)) {
            throw new Error('Ese usuario ya esta en el reto.');
        }

        const newParticipant: IdentityChallengeParticipant = {
            uid: normalizedUid,
            joinedAt: Timestamp.now(),
            status: 'active',
            currentStreak: 0,
            lastCheckIn: null,
            riskLevel: 0,
            displayName: normalizedUid,
        };

        await updateDoc(challengeRef, {
            participants: [...challenge.participants, newParticipant],
            participantUids: [...new Set([...challenge.participantUids, normalizedUid])],
        });
    }

    async checkIn(challengeId: string): Promise<void> {
        const uid = this.requireUid();
        const challengeRef = doc(this.challengesCollection, challengeId);
        const snapshot = await getDoc(challengeRef);
        if (!snapshot.exists()) {
            throw new Error('Reto no encontrado.');
        }

        const challenge = this.parseChallenge(snapshot.id, snapshot.data());
        const participant = challenge.participants.find((item) => item.uid === uid && item.status === 'active');
        if (!participant) {
            throw new Error('No perteneces a este reto.');
        }

        const todayKey = this.formatDateKey(new Date());
        const alreadyChecked = participant.lastCheckIn
            ? this.formatDateKey(participant.lastCheckIn.toDate()) === todayKey
            : false;

        if (alreadyChecked) {
            throw new Error('Ya hiciste check-in hoy.');
        }

        const updatedParticipants = challenge.participants.map((item) => {
            if (item.uid !== uid) {
                return item;
            }

            return {
                ...item,
                currentStreak: item.currentStreak + 1,
                lastCheckIn: Timestamp.now(),
                riskLevel: 0 as IdentityRiskLevel,
            };
        });

        await updateDoc(challengeRef, {
            participants: updatedParticipants,
        });
    }

    async applyRiskValidation(challengeId: string): Promise<void> {
        const challengeRef = doc(this.challengesCollection, challengeId);
        const snapshot = await getDoc(challengeRef);
        if (!snapshot.exists()) {
            return;
        }

        const challenge = this.parseChallenge(snapshot.id, snapshot.data());
        const nowMs = Date.now();
        let changed = false;

        const validatedParticipants = challenge.participants.map((item) => {
            if (item.status !== 'active') {
                return item;
            }

            const baseDate = item.lastCheckIn?.toDate() ?? item.joinedAt.toDate();
            const hoursWithoutCheckIn = (nowMs - baseDate.getTime()) / (1000 * 60 * 60);
            let nextRisk: IdentityRiskLevel = 0;
            if (hoursWithoutCheckIn >= 48) {
                nextRisk = 2;
            } else if (hoursWithoutCheckIn >= 24) {
                nextRisk = 1;
            }

            if (nextRisk !== item.riskLevel) {
                changed = true;
                return {
                    ...item,
                    riskLevel: nextRisk,
                };
            }

            return item;
        });

        if (!changed) {
            return;
        }

        await updateDoc(challengeRef, {
            participants: validatedParticipants,
        });
    }

    private parseChallenge(id: string, data: Record<string, unknown>): IdentityChallenge {
        return {
            id,
            title: String(data['title'] ?? ''),
            description: String(data['description'] ?? ''),
            habitId: String(data['habitId'] ?? ''),
            creatorUid: String(data['creatorUid'] ?? ''),
            participants: (data['participants'] as IdentityChallengeParticipant[] | undefined) ?? [],
            startDate: (data['startDate'] as Timestamp | undefined) ?? Timestamp.now(),
            endDate: (data['endDate'] as Timestamp | undefined) ?? Timestamp.now(),
            maxParticipants: Number(data['maxParticipants'] ?? MAX_PARTICIPANTS),
            participantUids: (data['participantUids'] as string[] | undefined) ?? [],
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

    private formatDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
