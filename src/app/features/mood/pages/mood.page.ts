import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular/standalone';

@Component({
    selector: 'app-mood-page',
    standalone: true,
    imports: [IonContent, IonButton, RouterLink],
    template: `
        <ion-content class="ion-padding">
            <section>
                <h1>Mood</h1>
                <p>Plantilla base de estado de animo.</p>
                <ion-button fill="outline" routerLink="/tabs/dashboard">Volver</ion-button>
            </section>
        </ion-content>
    `,
})
export class MoodPage {}
