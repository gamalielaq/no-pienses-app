// import { Injectable } from '@angular/core';
// import { CanActivate, Router, UrlTree } from '@angular/router';
// import { AuthService } from '../services/auth.service';
// import { HabitSeedService } from '../services/habit-seed.service';

// @Injectable({
//     providedIn: 'root',
// })
// export class OnboardingGuard implements CanActivate {
//     constructor(
//         private readonly router: Router,
//         private readonly authService: AuthService,
//         private readonly habitSeedService: HabitSeedService,
//     ) {}

//     async canActivate(): Promise<boolean | UrlTree> {
//         await this.authService.waitForAuthReady();

//         const user = this.authService.getCurrentUser();
//         if (!user) {
//             return this.router.parseUrl('/onboarding');
//         }

//         await this.authService.waitForUserDocReady();
//         const userDoc = this.authService.getCurrentUserDoc();
//         if (userDoc?.onboardingCompleted) {
//             return true;
//         }

//         await this.habitSeedService.waitForReady();
//         const hasHabits = this.habitSeedService.hasHabitsConfigured();
//         return hasHabits ? true : this.router.parseUrl('/onboarding/create-habits');
//     }
// }
