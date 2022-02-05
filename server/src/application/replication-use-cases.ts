import {UseCase} from "./use-case";
import ReplicationService, {ReplicationResult, RestoreResult} from "./replication-service";
import {MobObject} from "../domain/mob-object";
import {toString} from "../infrastructure/utils";

export class ReplicateUseCase implements UseCase<boolean> {
    private _error = '';

    constructor(private readonly replicationService: ReplicationService) {
    }

    get error(): string {
        return this._error;
    }

    async execute(): Promise<boolean> {
        try {
            const value: ReplicationResult = await this.replicationService.requestReplication()
            if (!value.success) {
                this._error = value.message;
            }
            return value.success;

        } catch (e) {
            this._error = toString(e as object);
            return false;
        }
    }
}

export class RestoreUseCase implements UseCase<MobObject[]> {
    private _error = '';

    constructor(private readonly replicationService: ReplicationService) {
    }

    get error(): string {
        return this._error;
    }

    async execute(): Promise<MobObject[]> {
        const value: RestoreResult = await this.replicationService.restoreReplicas()
        if (!value.error) {
            return value.data;
        }
        this._error = value.error;
        return [];
    }
}