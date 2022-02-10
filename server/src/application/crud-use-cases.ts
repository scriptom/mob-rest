import {MobObject, MobObjectRepository} from "../domain/mob-object";
import {UseCase} from "./use-case";

export class AddMobObject implements UseCase<boolean> {
    private _error = '';

    constructor(private readonly repository: MobObjectRepository,
                private readonly name: string) {
    }

    async execute(): Promise<boolean> {
        const {name} = this;
        const timestamp: number = Date.now();
        const mobObject: MobObject = {
            name,
            timestamp
        };
        console.log(`Saving MobObject=${JSON.stringify(mobObject)}`);
        try {
            const saved = await this.repository.save(mobObject);
            return saved.name !== null;
        } catch (err) {
            this._error = err instanceof Error ? err.message : err as string;
            return false;
        }
    }

    get error(): string {
        return this._error;
    }
}

export class GetAllMobObjects implements UseCase<MobObject[]> {
    private _error = '';
    get error(): string {
        return this._error;
    }

    constructor(private readonly repository: MobObjectRepository) {
    }

    execute(): Promise<MobObject[]> {
        try {
            console.log('Getting all mob objects');
            return this.repository.findAll();
        } catch (err) {
            this._error = err instanceof Error ? err.message : err as string;
            return Promise.resolve([]);
        }
    }
}

export class DeleteMobObject implements UseCase<boolean> {
    private _error = '';

    constructor(private readonly repository: MobObjectRepository,
                private readonly name: string) {
    }

    async execute(): Promise<boolean> {
        try {
            await this.repository.delete(this.name);
            return true;
        } catch (err) {
            this._error = err instanceof Error ? err.message : err as string;
            return false;
        }
    }

    get error(): string {
        return this._error;
    }
}

