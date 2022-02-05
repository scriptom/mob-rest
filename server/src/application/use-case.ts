export abstract class UseCase<T> {
    abstract execute(): Promise<T>;

    abstract get error(): string;
}