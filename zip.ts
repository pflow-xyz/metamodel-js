import JSZip from "jszip";
import {Model, ModelDeclaration, newModel} from "./model";

// zip and base64 encode
export function zip(data: string): Promise<string> {
    const zip = new JSZip();
    zip.file("model.json", data);
    return zip.generateAsync({type: "base64"});
}

export async function unzip(data: string, filename: string): Promise<string> {
    return JSZip.loadAsync(data, { base64: true })
        .then((z)=> {
            const f =  z.file(filename);
            if (f) {
                return f.async("string").then((json) => {
                    return json;
                });
            }
            return "";
        }).catch((e) => {
            console.error(e);
            return Promise.reject(e);
        });
}

export async function unzipModel(data: string, filename: string = "model.json", version: string = "v0"): Promise<Model> {
    return unzip(data, filename).then((json) => {
        const m = JSON.parse(json) as ModelDeclaration;
        if (m.version !== version) {
            throw new Error(`Invalid model version: ${m.version} expected: ${version}`);
        }
        return newModel({
            declaration: m,
            type: m.modelType,
        });
    });
}
