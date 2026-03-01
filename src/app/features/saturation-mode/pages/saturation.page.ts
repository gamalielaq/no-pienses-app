import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
    selector: 'app-saturation-page',
    standalone: true,
    imports: [IonContent, IonButton, RouterLink],
    template: `
        <ion-content class="ion-padding">
            <section>
                <h1>Saturation Mode</h1>
                <p>Pantalla base para reimplementar el modo enfoque.</p>
                <ion-button fill="outline" routerLink="/tabs/dashboard">Volver</ion-button>
            </section>
        </ion-content>
    `,
})
export class SaturationPage {}
