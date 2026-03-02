import { Routes } from '@angular/router';

export const tabsChildRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () =>
            import('../../features/dashboard/pages/dashboard.page').then((m) => m.DashboardPage),
    },
    {
        path: 'habits',
        loadComponent: () =>
            import('../../features/habits/pages/habit-management/habit-management.component').then(
                (m) => m.HabitManagementComponent,
            ),
    },
    {
        path: 'history',
        loadComponent: () =>
            import('../../features/history/pages/streak-history.component').then(
                (m) => m.StreakHistoryComponent,
            ),
    },
    {
        path: 'mood',
        loadComponent: () => import('../../features/mood/pages/mood.page').then((m) => m.MoodPage),
    },
    {
        path: 'settings',
        loadComponent: () =>
            import('../../features/settings/pages/settings.page').then((m) => m.SettingsPage),
    },
    {
        path: 'identity-challenges',
        loadComponent: () =>
            import('../../features/identity-challenges/pages/identity-challenges.page').then(
                (m) => m.IdentityChallengesPage,
            ),
    },
    {
        path: 'saturation',
        loadComponent: () =>
            import('../../features/saturation-mode/pages/saturation.page').then(
                (m) => m.SaturationPage,
            ),
    },
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
    },
];
