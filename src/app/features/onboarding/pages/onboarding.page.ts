import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-onboarding-page',
    standalone: true,
    imports: [IonContent, IonButton],
    templateUrl: './onboarding.page.html',
    styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
    protected isSigningIn = false;
    protected authError = '';

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {}

    async ionViewWillEnter(): Promise<void> {
        await this.authService.waitForAuthReady();
        if (this.authService.getCurrentUser()) {
            void this.router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
        }
    }

    async signInWithGoogle(): Promise<void> {
        if (this.isSigningIn) {
            return;
        }

        this.authError = '';
        this.isSigningIn = true;

        try {
            await this.authService.signInWithGoogle();
            void this.router.navigateByUrl('/onboarding/create-habits', { replaceUrl: true });
        } catch (error) {
            if (error instanceof Error && error.message === 'REDIRECTING_TO_GOOGLE') {
                return;
            }
            console.error('[Onboarding] Google sign-in failed:', error);
            this.authError = 'No fue posible iniciar sesion con Google.';
        } finally {
            this.isSigningIn = false;
        }
    }
}
