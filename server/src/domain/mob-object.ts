export enum Action {
    REPLICATE = 'REPLICAR',
    RESTORE = 'RESTORE'
}

export interface MobObject {
    readonly timestamp: number;
    readonly name: string;
    readonly action: Action;
}

export abstract class MobObjectRepository {
    abstract findAll(): Promise<MobObject[]>;
    abstract findOne(name: string): Promise<MobObject | undefined>;
    abstract findMany(action: string): Promise<MobObject[]>;
    abstract save(mobObject: MobObject): Promise<MobObject>;
    abstract replace(name: string, mobObject: MobObject): Promise<MobObject>;
    abstract delete(name: string): Promise<void>;
}