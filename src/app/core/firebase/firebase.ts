import { initializeApp, getApp, getApps } from 'firebase/app';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyBpyXBgOYbWmp8bkgqdigJ4n_-7lGZZeBg',
    authDomain: 'streaks-app-f6d4a.firebaseapp.com',
    projectId: 'streaks-app-f6d4a',
    storageBucket: 'streaks-app-f6d4a.firebasestorage.app',
    messagingSenderId: '891517542883',
    appId: '1:891517542883:web:da29d70716b4d1bda800d6',
    measurementId: 'G-F8RHLZHJQG',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(firebaseApp);
export const firebaseAuth = getAuth(firebaseApp);

let analyticsPromise: Promise<Analytics | null> | null = null;

export const getFirebaseAnalytics = (): Promise<Analytics | null> => {
    if (analyticsPromise) {
        return analyticsPromise;
    }

    analyticsPromise = (async () => {
        if (typeof window === 'undefined') {
            return null;
        }

        const supported = await isSupported();
        if (!supported) {
            return null;
        }

        return getAnalytics(firebaseApp);
    })();

    return analyticsPromise;
};
