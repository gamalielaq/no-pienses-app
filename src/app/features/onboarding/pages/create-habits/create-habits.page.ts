import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonProgressBar,
    IonText,
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-create-habits-page',
    standalone: true,
    imports: [
        IonContent,
        IonInput,
        IonButton,
        IonList,
        IonItem,
        IonLabel,
        IonText,
        IonProgressBar,
        RouterLink,
    ],
    templateUrl: './create-habits.page.html',
    styleUrl: './create-habits.page.scss',
})
export class CreateHabitsPage {}
