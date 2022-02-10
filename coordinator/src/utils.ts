import path from "path";
import fs from "fs/promises";

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
    console.log(`Writing ${contents} to ${path.join(__dirname, relativePath)}`);
    await fs.writeFile(path.resolve(process.cwd(), relativePath), contents, {
        encoding: 'utf-8'
    });
    return true;
}