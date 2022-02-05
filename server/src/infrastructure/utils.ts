import * as fs from 'fs/promises';
import path from "path";

export async function readFileContents(relativePath: string): Promise<string> {
    try {
        console.trace(`Opening file contents for \`${relativePath}\``);
        console.log(`full path: ${path.join(__dirname, relativePath)}`);
        return await fs.readFile(path.join(__dirname, relativePath), {encoding: 'utf-8'});
    } catch (e) {
        console.error(`Error occurred opening "${relativePath}"`);
        throw e;
    }
}

export async function writeContentsToFile(relativePath: string, contents: string): Promise<boolean> {
    console.log(`Writing ${contents} to ${path.join(__dirname, relativePath)}`);
    await fs.writeFile(path.join(__dirname, relativePath), contents, {
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
