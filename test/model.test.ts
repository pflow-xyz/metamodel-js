import {expect} from "chai";
import {tictactoe} from "./examples";
import {Cell, Declaration, Fn, ModelType, newModel, PlaceNode, Role, TxNode} from "../src";

function testElementaryValid(fn: Fn, cell: Cell, role: Role): {
    p1: PlaceNode;
    p2: PlaceNode;
    p3: PlaceNode;
    t1: TxNode;
} {
    const r = role("default");

    const p1 = cell("p0", 1, 1, {x: 100, y: 100});
    const t1 = fn("t1", r, {x: 200, y: 100});
    const p2 = cell("p2", 0, 1, {x: 300, y: 100});
    const p3 = cell("p3", 0, 1, {x: 400, y: 100});

    p1.tx(1, t1);
    t1.tx(1, p2);
    return {p1, t1, p2, p3};
}

function testElementaryInvalid(fn: Fn, cell: Cell, role: Role): void {
    const base = testElementaryValid(fn, cell, role);
    base.t1.tx(1, base.p3); // add an extra output making this invalid
}


function testModel({declaration, type}: { declaration: Declaration; type: ModelType }) {
    const m = newModel({
        schema: "testElementary",
        declaration,
        type,
    });
    const state = m.initialVector();
    return (action: string, opts?: { expectPass?: boolean; expectFail?: boolean }) => {
        m.fire(state, action, 1,
            () => expect(opts?.expectPass).to.be.true,
            () => expect(opts?.expectFail).to.be.true,
        );
    };
}

describe("metamodel", () => {
    describe("petriNet", () => {
        it("should be able to play tic-tac-toe", () => {
            const m = newModel({schema: "game", declaration: tictactoe});
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

        it("should still work for invalid elementary models", () => {
            const trigger = testModel({declaration: testElementaryInvalid, type: ModelType.petriNet});
            trigger("t1", {expectPass: true});
            trigger("t1", {expectFail: true});
        });

    });

    describe("elementary", () => {
        it("should work for valid models", () => {
            const trigger = testModel({declaration: testElementaryValid, type: ModelType.elementary});
            trigger("t1", {expectPass: true});
            trigger("t1", {expectFail: true});
        });

        it("should not work for invalid models", () => {
            const trigger = testModel({declaration: testElementaryInvalid, type: ModelType.elementary});
            trigger("t1", {expectFail: true});
            trigger("t1", {expectFail: true});
        });
    });
});

