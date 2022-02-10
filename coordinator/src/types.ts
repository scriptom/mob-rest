export type Action = 'COMMIT' | 'ABORT' | 'AZAR';
export type Vote = 'VOTE_COMMIT' | 'VOTE_ABORT';
export type ReplicationCommand = 'GLOBAL_COMMIT' | 'GLOBAL_ABORT';

export interface RestoreResult {
    error: string;
    contents: string;
}

export type RestoreRecount = RestoreResult | {count: number};

export interface ReplicationResult {
    message: string;
    success: boolean;
}

export enum KnownServices {
    REPLICATE = 'ReplicarObjetos',
    RESTORE = 'RestaurarObjetos'
}
