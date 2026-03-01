import { Injectable } from '@angular/core';
import { logEvent } from 'firebase/analytics';
import { getFirebaseAnalytics } from '../firebase/firebase';

@Injectable({
    providedIn: 'root',
})
export class AnalyticsService {
    trackEvent(eventName: string, payload?: Record<string, unknown>): void {
        void this.sendToFirebase(eventName, payload);
    }

    private async sendToFirebase(eventName: string, payload?: Record<string, unknown>): Promise<void> {
        try {
            const analytics = await getFirebaseAnalytics();
            if (!analytics) {
                return;
            }

            logEvent(analytics, eventName, payload);
        } catch (error) {
            console.warn('[Analytics] Firebase Analytics is unavailable:', error);
        }
    }
}
