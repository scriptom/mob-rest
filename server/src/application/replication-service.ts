import {MobObject} from "../domain/mob-object";

export interface ReplicationResult {
    message: string;
    success: boolean;
}

export interface RestoreResult {
    error: any | null;
    data: MobObject[];
    count: number
}

export default abstract class ReplicationService {
    abstract requestReplication(): Promise<ReplicationResult>;
    abstract restoreReplicas(): Promise<RestoreResult>;
}