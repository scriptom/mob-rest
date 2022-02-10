export type Action = 'COMMIT' | 'ABORT' | 'AZAR';

export interface MobObject {
    readonly timestamp: number;
    readonly name: string;
}

export abstract class MobObjectRepository {
    abstract findAll(): Promise<MobObject[]>;
    abstract save(mobObject: MobObject): Promise<MobObject>;
    abstract delete(name: string): Promise<void>;
}