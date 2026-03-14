import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/dashboard/pages/dashboard-page.component').then(
                        (m) => m.DashboardPageComponent,
                    ),
            },
        ],
    },
    {
        path: '**',
        redirectTo: '',
    },
];
