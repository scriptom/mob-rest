import {UseCase} from "./use-case";
import ReplicationService, {ReplicationResult, RestoreResult} from "./replication-service";
import {toString} from "../infrastructure/utils";
import {Action} from "../domain/mob-object";

export class ReplicateUseCase implements UseCase<boolean> {
    private _error = '';

    constructor(private readonly replicationService: ReplicationService,
                private readonly action: Action) {
    }

    get error(): string {
        return this._error;
    }

    async execute(): Promise<boolean> {
        try {
            const value: ReplicationResult = await this.replicationService.requestReplication(this.action);
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

export class RestoreUseCase implements UseCase<RestoreResult> {
    private _error = '';

    constructor(private readonly replicationService: ReplicationService) {
    }

    get error(): string {
        return this._error;
    }

    async execute(): Promise<RestoreResult> {
        const value: RestoreResult = await this.replicationService.restoreReplicas()
        if (!value.error) {
            return value;
        }
        this._error = value.error;
        return {
            error: value.error,
            count: -1
        };
    }
}