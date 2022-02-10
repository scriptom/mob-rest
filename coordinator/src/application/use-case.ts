import {ReplicationResult, RestoreRecount, RestoreResult} from "../types";
import {ReplicaService, RestoreService} from "./services";
import {readFileContents, writeContentsToFile} from "../utils";

export abstract class UseCase<T> {
    abstract execute(): Promise<T>;
}

export class ReplicateUseCase implements UseCase<ReplicationResult> {
    constructor(private readonly _replicaService: ReplicaService,
                private readonly _repositoryLocation: string) {
    }

    async execute(): Promise<ReplicationResult> {
        try {
            const contents = await this._fetchRepositoryContents();
            return await this._replicaService.replicateObjects(contents);
        } catch (e) {
            return {
                message: e instanceof Error ? e.message : e as string,
                success: false
            };
        }
    }

    private async _fetchRepositoryContents(): Promise<string> {
        try {
            return await readFileContents(this._repositoryLocation);
        } catch (e) {
            throw e;
        }
    }
}

export class RestoreUseCase implements UseCase<RestoreRecount> {
    private readonly RECOUNT_REGEXP = /<object /g;
    constructor(private readonly _restoreService: RestoreService,
                private readonly _repositoryLocation: string) {
    }

    async execute(): Promise<RestoreRecount> {
        const {contents, error} = await this._restoreService.restoreObjects();
        if (!error) {
            await this._saveRestoredContents(contents);
        }
        const count = this._countRestoredObjects(contents);
        return {error, count};
    }

    private async _saveRestoredContents(contents: string): Promise<boolean> {
        return await writeContentsToFile(this._repositoryLocation, contents);
    }

    private _countRestoredObjects(contents: string): number {
        return (contents.match(this.RECOUNT_REGEXP) || []).length;
    }
}