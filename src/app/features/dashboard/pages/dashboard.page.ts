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
    selector: 'app-dashboard-page',
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
    templateUrl: './dashboard.page.html',
    styleUrl: './dashboard.page.scss',
})
export class DashboardPage {}
