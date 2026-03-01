import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { tabsChildRoutes } from './layout/tabs/tabs.routes';

export const routes: Routes = [
    {
        path: 'onboarding',
        loadComponent: () =>
            import('./features/onboarding/pages/onboarding.page').then((m) => m.OnboardingPage),
    },
    {
        path: 'onboarding/create-habits',
        canActivate: [authGuard],
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
        path: 'habit-management',
        pathMatch: 'full',
        redirectTo: 'habits',
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/tabs/tabs.page').then((m) => m.TabsPage),
        children: tabsChildRoutes,
    },
    {
        path: 'streak-history',
        pathMatch: 'full',
        redirectTo: 'history',
    },
    {
        path: '**',
        redirectTo: 'dashboard',
    },
];
