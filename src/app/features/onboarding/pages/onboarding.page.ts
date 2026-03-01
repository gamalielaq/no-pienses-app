import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
    selector: 'app-onboarding-page',
    standalone: true,
    imports: [IonContent, IonButton, RouterLink],
    templateUrl: './onboarding.page.html',
    styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {}
