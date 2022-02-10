import {ReplicationResult, RestoreResult} from "../types";

export abstract class RestoreService {
    abstract restoreObjects(): Promise<RestoreResult>;
}

export abstract class ReplicaService {
    abstract replicateObjects(objects: string): Promise<ReplicationResult>;
}