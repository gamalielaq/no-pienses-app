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
    selector: 'app-habit-management',
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
    templateUrl: './habit-management.component.html',
    styleUrl: './habit-management.component.scss',
})
export class HabitManagementComponent {}
