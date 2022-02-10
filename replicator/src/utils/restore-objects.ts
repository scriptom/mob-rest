import fs from "fs/promises";
import path from "path";

export default async (fileLocation: string): Promise<string> => {
    const absPath = path.resolve(process.cwd(), fileLocation);
    try {
        console.log(`Restoring contents from ${absPath}`);
        await fs.mkdir(path.dirname(absPath), {recursive: true});
        return await fs.readFile(absPath, {encoding: 'utf-8'});
    } catch (e) {
        const err = e instanceof Error ? e.message : e as string;
        throw new Error(`Could not restore contents from ${absPath}: ${err}`);
    }
};