import { expect } from "chai";
import { domodel} from "../src/metamodel";
import { tictactoe } from "../src/examples";

describe("metamodel", () => {
    it("should be able to play tic-tac-toe", () => {
        const m = domodel("octothorpe", tictactoe);
        const state = m.initialVector();
        expect(m.emptyVector()).to.deep.equal( [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(state).to.deep.equal( [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]);
        expect(m.capacityVector()).to.deep.equal( [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);

        m.fire(state, "X11", 1);
        expect(state).to.deep.equal( [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1]);
        m.fire(state, "O01", 1);
        expect(state).to.deep.equal( [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0]);
    });
    // TODO: test inhibitor arcs
});

