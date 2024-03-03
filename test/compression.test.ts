import {compressBrotliEncode, decompressBrotliDecode} from "../compression";

describe("compression", () => {
    it("should compress and decompress", async () => {
        const data = "Hello, World!";
        const compressed = compressBrotliEncode(data);
        expect(compressed).toEqual( "CwaASGVsbG8sIFdvcmxkIQM=");
        const decompressed = await decompressBrotliDecode(compressed);
        expect(decompressed).toEqual(data);
    });

});