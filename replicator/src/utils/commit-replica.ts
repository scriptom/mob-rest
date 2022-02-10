import fs from "fs/promises";
import path from "path";
export default async (contents: string, fileLocation: string) => {
    console.log(`Writing contents into ${fileLocation}`);
    console.log(contents);
    const absPath = path.resolve(process.cwd(), fileLocation);
    await fs.mkdir(path.dirname(absPath), {recursive: true});
    await fs.writeFile(absPath, contents, {
        encoding: 'utf-8'
    });
    return true;
}