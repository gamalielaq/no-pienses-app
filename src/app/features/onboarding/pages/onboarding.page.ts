import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
    selector: 'app-onboarding-page',
    standalone: true,
    imports: [IonContent, IonButton],
    templateUrl: './onboarding.page.html',
    styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
    protected readonly logoSrc = '/cerebro.png';

    constructor(private readonly router: Router) {}

    completeOnboarding(): void {
        void this.router.navigateByUrl('/onboarding/create-habits');
    }
}
