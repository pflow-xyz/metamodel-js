import {compressBrotliEncode, decompressBrotliDecode} from "../compression";

describe("compression", () => {
    it("should compress and decompress", async () => {
        const data = "Hello, World!";
        const compressed = compressBrotliEncode(data);
        expect(compressed).toEqual( "CwaASGVsbG8sIFdvcmxkIQM=");
        const decompressed = await decompressBrotliDecode(compressed);
        expect(decompressed).toEqual(data);
    });

    it("should decompress data from browser", async () => {
        const compressedData = "GzkCIBwHdqMPWUYyo7XgaT/B09w+1fHywu1u31IMRQwiCxaRsTAxQRT6UodF4e9vcmthITygLrPfojnB4nxsskw21O/iE3GRG82+n/aPgzT++TW8fY5765PjEAvRHLk1fa0Atw8uCVzrgniE9AOCxwJt0eNbZxX3GlCwKSXlDBVIj2qWMSpoWCuQ0SZF4WJKQu7IYz8DzVzPNGg5hqbWWqtzXBixNz9qkiODzShUClkETwDocbjtBJp9Wh5QW8T8PXrgq9nCDI3qaA==";
        const decompressed = await decompressBrotliDecode(compressedData);
        console.log(decompressed);

    });

});
