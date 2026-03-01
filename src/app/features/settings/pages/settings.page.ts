import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-settings-page',
    standalone: true,
    imports: [IonContent, IonButton],
    template: `
        <ion-content class="ion-padding">
            <section>
                <h1>Ajustes</h1>
                <p>Configuracion general de la aplicacion.</p>
                <ion-button color="medium" fill="outline" [disabled]="isLoggingOut" (click)="logout()">
                    {{ isLoggingOut ? 'Cerrando sesion...' : 'Cerrar sesion' }}
                </ion-button>
            </section>
        </ion-content>
    `,
})
export class SettingsPage {
    protected isLoggingOut = false;

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {}

    async logout(): Promise<void> {
        if (this.isLoggingOut) {
            return;
        }

        this.isLoggingOut = true;
        try {
            await this.authService.logout();
            void this.router.navigateByUrl('/onboarding', { replaceUrl: true });
        } finally {
            this.isLoggingOut = false;
        }
    }
}
