import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { HabitReminderService } from './core/services/habit-reminder.service';

@Component({
    selector: 'app-root',
    imports: [IonApp, IonRouterOutlet],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    constructor(private readonly habitReminderService: HabitReminderService) {
        document.body.classList.add('dark');
        this.habitReminderService.start();
    }
}
