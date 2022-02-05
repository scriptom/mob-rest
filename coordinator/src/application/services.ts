import {MobObject} from "../domain/mob-object";

export interface RestoreResult {
    error: string;
    data: MobObject[];
}

export interface ReplicationResult {
    error: string;
}

export abstract class RestoreService {
    abstract restoreObjects(): Promise<RestoreResult>;
}

export abstract class ReplicaService {
    abstract replicateObjects(objects: string): Promise<ReplicationResult>;
}