import { Injectable } from '@angular/core';
import {
    AuthError,
    GoogleAuthProvider,
    User,
    browserLocalPersistence,
    onAuthStateChanged,
    setPersistence,
    signInWithPopup,
    signInWithRedirect,
    signOut,
} from 'firebase/auth';
import { firebaseAuth } from '../firebase/firebase';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private currentUser: User | null = null;
    private authReadyResolved = false;
    private resolveAuthReady: (() => void) | null = null;
    private readonly authReadyPromise = new Promise<void>((resolve) => {
        this.resolveAuthReady = resolve;
    });

    constructor() {
        void setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
            console.warn('[Auth] Failed to set persistence:', error);
        });

        onAuthStateChanged(firebaseAuth, (user) => {
            this.currentUser = user;
            if (!this.authReadyResolved) {
                this.authReadyResolved = true;
                this.resolveAuthReady?.();
            }
        });
    }

    async waitForAuthReady(): Promise<void> {
        await this.authReadyPromise;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    async signInWithGoogle(): Promise<User> {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            const credentials = await signInWithPopup(firebaseAuth, provider);
            return credentials.user;
        } catch (error) {
            const authError = error as AuthError;
            if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/cancelled-popup-request') {
                await signInWithRedirect(firebaseAuth, provider);
                throw new Error('REDIRECTING_TO_GOOGLE');
            }

            throw error;
        }
    }

    async logout(): Promise<void> {
        await signOut(firebaseAuth);
    }
}
