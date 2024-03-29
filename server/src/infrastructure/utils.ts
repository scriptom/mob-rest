import * as fs from 'fs/promises';
import path from "path";

export async function readFileContents(relativePath: string): Promise<string> {
    try {
        console.log(`Opening file contents for \`${relativePath}\``);
        return await fs.readFile(path.resolve(process.cwd(), relativePath), {encoding: 'utf-8'});
    } catch (e) {
        console.error(`Error occurred opening "${relativePath}"`);
        throw e;
    }
}

export async function writeContentsToFile(relativePath: string, contents: string): Promise<boolean> {
    console.log(`Writing ${contents} to ${path.resolve(process.cwd(), relativePath)}`);
    await fs.writeFile(path.resolve(process.cwd(), relativePath), contents, {
        encoding: 'utf-8'
    });
    return true;
}

/**
 * Returns a string representation of a variable, even if it's an object with not enough information. Useful for debugging purposes.
 * @param obj The variable to return a string representation of.
 */
export function toString(obj: object | string | number): string {
    if (obj.toString().startsWith('[object ')) {
        return JSON.stringify(obj);
    }

    return obj.toString();
}
