import {readFileContents, toString, writeContentsToFile} from "../utils";
import {Builder, parseStringPromise} from "xml2js";
import {AttributeXmlHelper, XmlMobObject, XmlRepositoryRoot} from "../types";
import {MobObject, MobObjectRepository} from "../../domain/mob-object";


export function mapXmlToMobObject(xmlMobObject: XmlMobObject): MobObject {
    return <MobObject>{
        name: xmlMobObject.name,
        timestamp: Date.parse(xmlMobObject.dateAdded)
    };
}

/**
 * Converts a MobObject into an XML Object
 * @param mobObject
 */
export function mapMobObjectToXml(mobObject: MobObject): XmlMobObject {
    return {
        name: mobObject.name,
        dateAdded: new Date(mobObject.timestamp).toLocaleDateString('es-VE')
    };
}

export default class XmlMobObjectRepository implements MobObjectRepository {
    constructor(private readonly xmlPath: string) {
    }

    private async _parseXmlContents(): Promise<MobObject[]> {
        const xmlString: string = await readFileContents(this.xmlPath);
        console.log(`xmlString=${xmlString}`);
        try {
            const result: XmlRepositoryRoot<XmlMobObject> = await parseStringPromise(xmlString, {
            });
            console.log(`result=${toString(result)}`);
            if (!result) {
                console.log(`No Results - returning empty list`);
                return [];
            }
            return result.objects.object.map(({$: xmlMobObject}) => mapXmlToMobObject(xmlMobObject));
        } catch (e: any) {
            throw `Could not read file ${this.xmlPath} - Error message: ${toString(e)}`;
        }
    }

    private async _persistList(mobObjects: MobObject[]): Promise<boolean> {
        console.log(`persisting list - ${toString(mobObjects)}`);
        const builder: Builder = new Builder({
            rootName: 'objects',
            headless: true
        });
        console.log(`✔ Builder`)
        try {
            const xmlObjects: AttributeXmlHelper<XmlMobObject>[] = mobObjects
                .map(mapMobObjectToXml)
                .map((obj): AttributeXmlHelper<XmlMobObject> => ({
                    object: {
                        $: obj
                    }
                }));
            console.log(`✔ Mapped - ${toString(xmlObjects)}`);
            const xmlString = builder.buildObject(xmlObjects);
            console.log(`✔ xmlString created - ${xmlString}`);
            console.log(`Persisting...`);
            return await writeContentsToFile(this.xmlPath, xmlString);
        } catch (e) {
            throw `Could not persist list - ${e instanceof Error ? e.message : e as string}`;
        }
    }

    async delete(name: string): Promise<void> {
        const objects: MobObject[] = await this.findAll();
        const index: number = objects.findIndex(mobObject => mobObject.name === name);
        if (index !== -1) {
            objects.splice(index, 1);
            await this._persistList(objects);
        } else {
            throw `Not found: ${name}`;
        }
    }

    async findAll(): Promise<MobObject[]> {
        try {
            return await this._parseXmlContents();
        } catch (e) {
            throw `Could not findAll: ${e instanceof Error ? e.message : e as string}`;
        }
    }

    async save(mobObject: MobObject): Promise<MobObject> {
        try {
            const all = await this.findAll();
            console.log(`all=${all}`);
            if (all.find(obj => obj.name === mobObject.name) !== undefined) {
                throw `Object with name ${mobObject.name} already exists.`;
            }
            console.log(`no duplicates found. Pushing ${toString(mobObject)}`);
            all.push(mobObject);
            await this._persistList(all);
            return mobObject;
        } catch (e: any) {
            throw `Could not save entity: ${toString(e)}`;
        }
    }
}