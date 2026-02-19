import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonMenuToggle,
    IonRouterOutlet,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline,
    homeOutline,
    settingsOutline,
    sparklesOutline,
} from 'ionicons/icons';
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
        IonIcon,
        IonLabel,
        IonMenuToggle,
        IonRouterOutlet,
    ],
    templateUrl: './tabs.page.html',
    styleUrl: './tabs.page.scss',
})
export class TabsPage {
    protected readonly menuItems = [
        { label: 'Dashboard', icon: 'home-outline', link: '/tabs/dashboard' },
        { label: 'Gestionar habitos', icon: 'sparkles-outline', link: '/tabs/habits' },
        { label: 'Historial', icon: 'calendar-outline', link: '/tabs/history' },
        { label: 'Configuracion', icon: 'settings-outline', link: '/tabs/settings' },
    ];

    constructor() {
        addIcons({
            homeOutline,
            sparklesOutline,
            calendarOutline,
            settingsOutline,
        });
    }
}
