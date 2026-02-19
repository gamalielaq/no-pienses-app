import { Routes } from '@angular/router';
import { OnboardingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'onboarding',
    },
    {
        path: 'onboarding',
        loadComponent: () =>
            import('./features/onboarding/pages/onboarding.page').then((m) => m.OnboardingPage),
    },
    {
        path: 'onboarding/create-habits',
        loadComponent: () =>
            import('./features/onboarding/pages/create-habits/create-habits.page').then(
                (m) => m.CreateHabitsPage,
            ),
    },
    {
        path: 'create-habits',
        pathMatch: 'full',
        redirectTo: 'onboarding/create-habits',
    },
    {
        path: 'dashboard',
        pathMatch: 'full',
        redirectTo: 'tabs/dashboard',
    },
    {
        path: 'habit-management',
        pathMatch: 'full',
        redirectTo: 'tabs/habits',
    },
    {
        path: 'tabs',
        canActivate: [OnboardingGuard],
        loadComponent: () => import('./layout/tabs/tabs.page').then((m) => m.TabsPage),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/dashboard/pages/dashboard.page').then(
                        (m) => m.DashboardPage,
                    ),
            },
            {
                path: 'habits',
                loadComponent: () =>
                    import('./features/habits/pages/habit-management/habit-management.component').then(
                        (m) => m.HabitManagementComponent,
                    ),
            },
            {
                path: 'history',
                loadComponent: () =>
                    import('./features/history/pages/streak-history.component').then(
                        (m) => m.StreakHistoryComponent,
                    ),
            },
            {
                path: 'mood',
                loadComponent: () =>
                    import('./features/mood/pages/mood.page').then((m) => m.MoodPage),
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./features/settings/pages/settings.page').then((m) => m.SettingsPage),
            },
            {
                path: 'saturation',
                loadComponent: () =>
                    import('./features/saturation-mode/pages/saturation.page').then(
                        (m) => m.SaturationPage,
                    ),
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
        ],
    },
    {
        path: 'streak-history',
        loadComponent: () =>
            import('./features/history/pages/streak-history.component').then(
                (m) => m.StreakHistoryComponent,
            ),
    },
    {
        path: '**',
        redirectTo: 'tabs',
    },
];
