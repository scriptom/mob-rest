import {Action} from "../domain/mob-object";

export interface ReplicationResult {
    message: string;
    success: boolean;
}

export interface RestoreResult {
    error: string | null;
    count: number
}

export default abstract class ReplicationService {
    abstract requestReplication(action: Action): Promise<ReplicationResult>;

    abstract restoreReplicas(): Promise<RestoreResult>;
}