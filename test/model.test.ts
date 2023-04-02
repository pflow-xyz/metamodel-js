import {expect} from "chai";
import {tictactoe} from "../src/examples";
import {newModel} from "../src";

describe("metamodel", () => {
    it("should be able to play tic-tac-toe", () => {
        const m = newModel("game", tictactoe);
        expect(m.def.type).to.equal("petriNet");
        const state = m.initialVector();
        expect(m.emptyVector()).to.deep.equal([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(state).to.deep.equal([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]);
        expect(m.capacityVector()).to.deep.equal([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);

        m.fire(state, "X11", 1);
        expect(state).to.deep.equal([1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1]);
        m.fire(state, "O01", 1);
        expect(state).to.deep.equal([1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0]);
    });
    // TODO: test inhibitor arcs
});

