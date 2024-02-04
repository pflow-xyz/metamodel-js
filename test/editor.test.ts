import {expect} from "chai";
import {DeclarationFunction, ModelType, newModel, Dsl} from "../";


function testModel({declaration, type}: { declaration: DeclarationFunction; type: ModelType }) {
    const m = newModel({
        declaration,
        type,
    });
    const state = m.initialVector();
    const trigger = (action: string, opts?: { expectPass?: boolean; expectFail?: boolean }) => {
        m.fire(state, action, 1,
            () => expect(opts?.expectPass).to.be.true,
            () => expect(opts?.expectFail).to.be.true,
        );
        console.log({state, action}, "after");
    };
    return {m, state, trigger};
}

export function pos(x: number, y: number): { x: number; y: number } {
    return {x: x * 80, y: y * 80};
}

export function declaration({fn, cell, role}: Dsl): void {
    const defaultRole = role("default");
    const foo = cell("foo", 1, 0, pos(6, 2));
    const bar = fn("bar", defaultRole, pos(5, 4));
    const baz = fn("baz", defaultRole, pos(7, 4));
    foo.guard(1, baz);
    foo.tx(1, bar);
}

describe("editorTest", () => {
    it("should rename places", () => {
        const { m, trigger } = testModel({declaration, type: ModelType.petriNet});
        trigger("baz", {expectFail: true});
        trigger("bar", {expectPass: true});
        m.renamePlace("foo", "foo2");
        console.log(JSON.stringify( m.toObject("full"), null, 2));
    });
});

