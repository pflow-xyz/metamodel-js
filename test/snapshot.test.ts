import {newModel} from "../src";
import {tictactoe} from "../src/examples";
import {snapshot} from "../src/snapshot";

it("should render a snapshot", () => {
    const model = newModel("game", tictactoe);
    const svg = snapshot(model);
    expect(svg.startsWith("<svg")).toBeTruthy();
    expect(svg.endsWith("</svg>")).toBeTruthy();
});