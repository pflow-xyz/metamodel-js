import {newModel, snapshot} from "../";
import {tictactoe} from "./examples";

it("should render a snapshot", () => {
    const m = newModel({schema: "game", declaration: tictactoe});
    const svg = snapshot(m);
    expect(svg.startsWith("<svg")).toBeTruthy();
    expect(svg.endsWith("</svg>")).toBeTruthy();
});
