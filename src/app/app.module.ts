import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { BoardComponent } from './features/chess/components/board/board.component';
import { SquareComponent } from './features/chess/components/square/square.component';
import { GameService } from './features/chess/services/game.service';

@NgModule({
    declarations: [AppComponent, BoardComponent, SquareComponent],
    imports: [BrowserModule, BrowserAnimationsModule, CommonModule],
    providers: [GameService],
    bootstrap: [AppComponent],
})
export class AppModule {}
