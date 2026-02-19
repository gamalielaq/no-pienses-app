import { Injectable } from '@angular/core';

import { StorageService } from './storage.service';

export interface MoodEntry {
    date: string;
    mood: number;
    note?: string;
}

@Injectable({
    providedIn: 'root',
})
export class MoodDataService {
    private readonly key = 'mood_entries';

    constructor(private readonly storage: StorageService) {}

    getEntries(): MoodEntry[] {
        return this.storage.get<MoodEntry[]>(this.key) ?? [];
    }

    saveEntries(entries: MoodEntry[]): void {
        this.storage.set(this.key, entries);
    }
}
