import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuToggle,
    IonRouterOutlet,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-tabs-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        IonMenu,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonList,
        IonItem,
        IonLabel,
        IonMenuToggle,
        IonRouterOutlet,
    ],
    templateUrl: './tabs.page.html',
    styleUrl: './tabs.page.scss',
})
export class TabsPage {

}
