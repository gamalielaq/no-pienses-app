import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { GameService } from './features/chess/services/game.service';

@Component({
    selector: 'app-root',
    standalone: false,
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    private readonly game = inject(GameService);

    resetGame(): void {
        this.game.reset();
    }
}
