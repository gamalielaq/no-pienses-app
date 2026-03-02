import { Injectable } from '@angular/core';
import { Timestamp, collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { firestoreDb } from '../firebase/firebase';
import { AuthService } from './auth.service';

export interface HabitRecord {
    id: string;
    name: string;
    streak: number;
    completedToday: boolean;
    createdAt: string;
}

export interface HabitHistoryRecord {
    habitId: string;
    date: string;
    completed: boolean;
}

export interface UserProgressRecord {
    onboardingCompleted: boolean;
    habitLimitUnlocked: boolean;
    rewardClaimed: boolean;
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

    async getUserHistory(): Promise<HabitHistoryRecord[]> {
        const uid = this.requireUid();
        const historyRef = collection(firestoreDb, 'users', uid, 'history');
        const snapshot = await getDocs(historyRef);

        return snapshot.docs
            .map((entry) => {
                const data = entry.data() as Record<string, unknown>;
                return {
                    habitId: String(data['habitId'] ?? ''),
                    date: this.normalizeDateKey(data['date']),
                    completed: Boolean(data['completed']),
                } satisfies HabitHistoryRecord;
            })
            .filter((entry) => !!entry.habitId && !!entry.date);
    }

    async setHistoryCompletion(habitId: string, dateKey: string, completed: boolean): Promise<void> {
        const uid = this.requireUid();
        const historyId = `${habitId}_${dateKey}`;
        const historyRef = doc(firestoreDb, 'users', uid, 'history', historyId);

        if (completed) {
            await setDoc(historyRef, {
                habitId,
                date: dateKey,
                completed: true,
            });
        } else {
            await deleteDoc(historyRef);
        }
    }

    async setHabitCompletedToday(habitId: string, completed: boolean): Promise<void> {
        const uid = this.requireUid();
        await setDoc(
            doc(firestoreDb, 'users', uid, 'habits', habitId),
            {
                completedToday: completed,
                updatedAt: new Date().toISOString(),
            },
            { merge: true },
        );
    }

    async getUserProgress(): Promise<UserProgressRecord> {
        const uid = this.requireUid();
        const snapshot = await getDoc(doc(firestoreDb, 'users', uid));
        if (!snapshot.exists()) {
            return {
                onboardingCompleted: false,
                habitLimitUnlocked: false,
                rewardClaimed: false,
            };
        }

        const data = snapshot.data() as Partial<UserProgressRecord>;
        return {
            onboardingCompleted: !!data.onboardingCompleted,
            habitLimitUnlocked: !!data.habitLimitUnlocked,
            rewardClaimed: !!data.rewardClaimed,
        };
    }

    async updateUserProgress(patch: Partial<UserProgressRecord>): Promise<void> {
        const uid = this.requireUid();
        await setDoc(
            doc(firestoreDb, 'users', uid),
            {
                ...patch,
                updatedAt: new Date().toISOString(),
            },
            { merge: true },
        );
    }

    private requireUid(): string {
        const uid = this.authService.getCurrentUser()?.uid;
        if (!uid) {
            throw new Error('No hay usuario autenticado.');
        }
        return uid;
    }

    private normalizeDateKey(rawDate: unknown): string {
        if (typeof rawDate === 'string') {
            const value = rawDate.trim();
            if (!value) {
                return '';
            }
            return value.length >= 10 ? value.slice(0, 10) : value;
        }

        if (rawDate instanceof Timestamp) {
            return this.formatDateKey(rawDate.toDate());
        }

        if (
            typeof rawDate === 'object' &&
            rawDate !== null &&
            'toDate' in rawDate &&
            typeof (rawDate as { toDate?: unknown }).toDate === 'function'
        ) {
            const date = (rawDate as { toDate: () => Date }).toDate();
            return this.formatDateKey(date);
        }

        return '';
    }

    private formatDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
