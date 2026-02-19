import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class OnboardingGuard implements CanActivate {
    constructor(private readonly router: Router) {}

    canActivate(): boolean | UrlTree {
        const onboardingDone = localStorage.getItem('onboarding_done') === 'true';
        return onboardingDone ? true : this.router.parseUrl('/onboarding');
    }
}
