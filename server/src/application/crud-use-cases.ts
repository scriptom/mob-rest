import {Action, MobObject, MobObjectRepository} from "../domain/mob-object";
import {toString} from "../infrastructure/utils";
import {UseCase} from "./use-case";

export class AddMobObject implements UseCase<boolean> {
    private _error = '';

    constructor(private readonly repository: MobObjectRepository,
                private readonly name: string,
                private readonly action: Action) {
    }

    async execute(): Promise<boolean> {
        const {name, action} = this;
        const timestamp: number = Date.now();
        const mobObject: MobObject = {
            name,
            action,
            timestamp
        };
        console.log(`Saving MobObject=${JSON.stringify(mobObject)}`);
        try {
            const saved = await this.repository.save(mobObject);
            return saved.name !== null;
        } catch (err) {
            this._error = toString(err);
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
        console.log('Getting all mob objects');
        return this.repository.findAll();
    }
}

export class GetMobObjectsByAction implements UseCase<MobObject[]> {
    private _error = '';
    get error(): string {
        return this._error;
    }

    constructor(private readonly repository: MobObjectRepository,
                private readonly action: string) {
    }

    execute(): Promise<MobObject[]> {
        console.log(`Getting all mob objects with action=${this.action}`);
        return this.repository.findMany(this.action);
    }
}

export class GetMobObjectByName implements UseCase<MobObject | undefined> {
    get error(): string {
        return '';
    }

    constructor(private readonly repository: MobObjectRepository,
                private readonly name: string) {
    }

    execute(): Promise<MobObject | undefined> {
        console.log(`Getting mob object with name=${this.name}`);
        return this.repository.findOne(this.name);
    }
}

export class DeleteMobObject implements UseCase<boolean> {
    constructor(private readonly repository: MobObjectRepository,
                private readonly name: string) {
    }

    async execute(): Promise<boolean> {
        try {
            await this.repository.delete(this.name);
            return true;
        } catch {
            return false;
        }
    }

    get error(): string {
        return '';
    }
}

