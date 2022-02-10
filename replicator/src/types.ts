export type Action = 'COMMIT' | 'ABORT' | 'AZAR';
export type Vote = 'VOTE_COMMIT' | 'VOTE_ABORT';
export type Command = 'GLOBAL_COMMIT' | 'GLOBAL_ABORT';

export interface RestoreResult {
    error: string;
    contents: string;
}

export interface ReplicationResult {
    message: string;
    success: boolean;
}
