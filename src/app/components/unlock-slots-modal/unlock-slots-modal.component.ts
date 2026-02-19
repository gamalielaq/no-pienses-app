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
import { flameOutline, trophyOutline } from 'ionicons/icons';

@Component({
    selector: 'app-unlock-slots-modal',
    standalone: true,
    imports: [CommonModule, IonHeader, IonToolbar, IonContent, IonIcon, IonText, IonButton],
    templateUrl: './unlock-slots-modal.component.html',
    styleUrl: './unlock-slots-modal.component.scss',
})
export class UnlockSlotsModalComponent {
    @Input() title = '';
    @Input() message = '';
    @Input() subtext = '';
    @Input() buttonLabel = 'Entendido';
    @Input() iconName: 'trophy-outline' | 'flame-outline' = 'trophy-outline';

    constructor(private readonly modalController: ModalController) {
        addIcons({
            trophyOutline,
            flameOutline,
        });
    }

    protected close(): void {
        void this.modalController.dismiss();
    }
}
