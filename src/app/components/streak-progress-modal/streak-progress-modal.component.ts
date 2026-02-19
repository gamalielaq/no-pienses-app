import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonText,
    IonToolbar,
    ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flame } from 'ionicons/icons';

@Component({
    selector: 'app-streak-progress-modal',
    standalone: true,
    imports: [CommonModule, IonHeader, IonToolbar, IonContent, IonIcon, IonText, IonButton],
    templateUrl: './streak-progress-modal.component.html',
    styleUrl: './streak-progress-modal.component.scss',
})
export class StreakProgressModalComponent {
    @Input() streakDays = 0;
    @Input() maxStreakGoal = 7;

    constructor(private readonly modalController: ModalController) {
        addIcons({ flame });
    }

    protected get daysTrack(): number[] {
        return Array.from({ length: this.maxStreakGoal }, (_, index) => index + 1);
    }

    protected isActiveDay(day: number): boolean {
        return day <= this.streakDays;
    }

    protected close(): void {
        void this.modalController.dismiss();
    }
}
