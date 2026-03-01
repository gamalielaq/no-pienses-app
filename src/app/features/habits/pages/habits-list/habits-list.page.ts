import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonMenuButton,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-habits-list-page',
    standalone: true,
    imports: [
        IonHeader,
        IonToolbar,
        IonButtons,
        IonMenuButton,
        IonTitle,
        IonContent,
        IonButton,
        RouterLink,
    ],
    templateUrl: './habits-list.page.html',
    styleUrl: './habits-list.page.scss',
})
export class HabitsListPage {}
