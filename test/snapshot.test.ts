import {newModel, snapshot} from "../src";
import {tictactoe} from "../src/examples";

it("should render a snapshot", () => {
    const m = newModel({schema: "game", declaration: tictactoe});
    const svg = snapshot(m);
    expect(svg.startsWith("<svg")).toBeTruthy();
    expect(svg.endsWith("</svg>")).toBeTruthy();
});