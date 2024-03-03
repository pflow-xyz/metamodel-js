import {Model, ModelDeclaration, newModel} from "./model";
import {compress, decompress} from "brotli-wasm";

export function compressBrotliEncode(data: string): string {
    return Buffer.from(
        compress(Buffer.from(data))
    ).toString("base64");
}

export async function decompressBrotliDecode(data: string): Promise<string> {
    return Buffer.from(
        decompress(Buffer.from(data, "base64"))
    ).toString();
}

export async function decompressModel(data: string, version: string = "v0"): Promise<Model> {
    return decompressBrotliDecode(data).then((json) => {
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
