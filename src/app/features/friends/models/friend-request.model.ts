import { Timestamp } from 'firebase/firestore';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface AppUserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    streak: number;
}

export interface FriendRequest {
    id: string;
    fromUid: string;
    toUid: string;
    fromDisplayName?: string;
    fromPhotoURL?: string | null;
    fromEmail?: string;
    status: FriendRequestStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
