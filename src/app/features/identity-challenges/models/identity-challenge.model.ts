import { Timestamp } from 'firebase/firestore';

export type IdentityParticipantStatus = 'active' | 'left';
export type IdentityRiskLevel = 0 | 1 | 2;
export type IdentityChallengeDuration = 21 | 30 | 60;

export interface IdentityChallengeParticipant {
    uid: string;
    joinedAt: Timestamp;
    status: IdentityParticipantStatus;
    currentStreak: number;
    lastCheckIn: Timestamp | null;
    riskLevel: IdentityRiskLevel;
    displayName?: string;
    photoURL?: string;
}

export interface IdentityChallenge {
    id: string;
    title: string;
    description: string;
    habitId: string;
    creatorUid: string;
    participants: IdentityChallengeParticipant[];
    startDate: Timestamp;
    endDate: Timestamp;
    maxParticipants: number;
    participantUids: string[];
}

export interface CreateIdentityChallengeInput {
    title: string;
    description: string;
    habitId: string;
    durationDays: IdentityChallengeDuration;
}
