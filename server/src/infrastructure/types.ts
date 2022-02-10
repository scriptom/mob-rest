export interface XmlMobObject {
    name: string;
    dateAdded: string;
}

type AsAttributes<T> = {
    $: T;
}

export type AttributeXmlHelper<T> = {
    [tagName: string]: AsAttributes<T>;
}

export interface XmlRepositoryRoot<T> {
    [rootName: string]: {
        [tagName: string]: AsAttributes<T>[];
    };
}