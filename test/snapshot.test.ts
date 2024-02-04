import {newModel, snapshot} from "../";
import {inhibitTest} from "./examples";

it("should render a snapshot", () => {
    const m = newModel({declaration: inhibitTest});
    const svg = snapshot(m);
    expect(svg.startsWith("<svg")).toBeTruthy();
    expect(svg.endsWith("</svg>")).toBeTruthy();
});
