import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AnalyticsService {
    trackEvent(eventName: string, payload?: Record<string, unknown>): void {
        // Future analytics integration (Firebase, PostHog, etc.)
        console.debug('[Analytics]', eventName, payload);
    }
}
