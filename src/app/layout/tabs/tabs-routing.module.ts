import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
    {
        path: '',
        component: TabsPage,
        children: [
            {
                path: 'dashboard',
                loadChildren: () =>
                    import('../../features/dashboard/dashboard.module').then(
                        (m) => m.DashboardModule,
                    ),
            },
            {
                path: 'habits',
                loadChildren: () =>
                    import('../../features/habits/habits.module').then((m) => m.HabitsModule),
            },
            {
                path: 'history',
                loadChildren: () =>
                    import('../../features/history/history.module').then((m) => m.HistoryModule),
            },
            {
                path: 'mood',
                loadChildren: () =>
                    import('../../features/mood/mood.module').then((m) => m.MoodModule),
            },
            {
                path: 'settings',
                loadChildren: () =>
                    import('../../features/settings/settings.module').then((m) => m.SettingsModule),
            },
            {
                path: 'saturation',
                loadChildren: () =>
                    import('../../features/saturation-mode/saturation.module').then(
                        (m) => m.SaturationModule,
                    ),
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TabsRoutingModule {}
