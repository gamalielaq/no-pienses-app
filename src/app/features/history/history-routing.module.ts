import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StreakHistoryComponent } from './pages/streak-history.component';

const routes: Routes = [
    {
        path: '',
        component: StreakHistoryComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class HistoryRoutingModule {}
