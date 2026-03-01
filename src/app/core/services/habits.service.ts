import { Injectable } from '@angular/core';
import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { firestoreDb } from '../firebase/firebase';
import { AuthService } from './auth.service';

export interface HabitRecord {
    id: string;
    name: string;
    streak: number;
    completedToday: boolean;
    createdAt: string;
}

@Injectable({
    providedIn: 'root',
})
export class HabitsService {
    constructor(private readonly authService: AuthService) {}

    async getUserHabits(): Promise<HabitRecord[]> {
        const uid = this.requireUid();
        const habitsRef = collection(firestoreDb, 'users', uid, 'habits');
        const snapshot = await getDocs(habitsRef);

        return snapshot.docs
            .map((entry) => {
                const data = entry.data() as Omit<HabitRecord, 'id'>;
                return {
                    id: entry.id,
                    name: data.name,
                    streak: Number(data.streak ?? 0),
                    completedToday: Boolean(data.completedToday),
                    createdAt: data.createdAt ?? new Date().toISOString(),
                } satisfies HabitRecord;
            })
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    async saveInitialHabits(names: string[]): Promise<void> {
        const uid = this.requireUid();
        const normalizedNames = names.map((item) => item.trim()).filter(Boolean);
        const habitsRef = collection(firestoreDb, 'users', uid, 'habits');
        const existing = await getDocs(habitsRef);
        const batch = writeBatch(firestoreDb);

        existing.forEach((entry) => {
            batch.delete(entry.ref);
        });

        const now = new Date().toISOString();
        normalizedNames.forEach((name) => {
            const habitDoc = doc(habitsRef);
            batch.set(habitDoc, {
                name,
                streak: 0,
                completedToday: false,
                createdAt: now,
            });
        });

        batch.set(
            doc(firestoreDb, 'users', uid),
            {
                onboardingCompleted: true,
                updatedAt: now,
            },
            { merge: true },
        );

        await batch.commit();
    }

    private requireUid(): string {
        const uid = this.authService.getCurrentUser()?.uid;
        if (!uid) {
            throw new Error('No hay usuario autenticado.');
        }
        return uid;
    }
}
