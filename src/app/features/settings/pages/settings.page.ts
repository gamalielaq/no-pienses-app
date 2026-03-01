import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
    selector: 'app-settings-page',
    standalone: true,
    imports: [IonContent, IonButton, RouterLink],
    template: `
        <ion-content class="ion-padding">
            <section>
                <h1>Ajustes</h1>
                <p>Configuracion general de la aplicacion.</p>
                <ion-button color="medium" fill="outline" routerLink="/onboarding">
                    Ir a onboarding
                </ion-button>
            </section>
        </ion-content>
    `,
})
export class SettingsPage {}
