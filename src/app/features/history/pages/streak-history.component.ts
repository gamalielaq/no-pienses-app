import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-streak-history',
    standalone: true,
    imports: [
        IonHeader,
        IonToolbar,
        IonButtons,
        IonBackButton,
        IonTitle,
        IonContent,
        IonButton,
        RouterLink,
    ],
    templateUrl: './streak-history.component.html',
    styleUrl: './streak-history.component.scss',
})
export class StreakHistoryComponent {}
