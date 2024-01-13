import {expect} from "chai";
import {ModelDeclaration, ModelType, newModel} from "../";

function testModel({declaration, type}: { declaration: ModelDeclaration; type: ModelType }) {
    const m = newModel({
        schema: "testInhibitor",
        declaration,
        type,
    });
    const state = m.initialVector();
    const trigger = (action: string, opts?: { expectPass?: boolean; expectFail?: boolean }) => {
        m.fire(state, action, 1,
            () => expect(!!opts?.expectPass).to.be.true,
            () => expect(!!opts?.expectFail).to.be.true,
        );
        console.log({state, action}, "after");
    };
    return {state, trigger, m};
}

const inhibitTest: ModelDeclaration = {
    modelType: ModelType.petriNet,
    version: "v0",
    places: {
        foo: {offset: 0, x: 0, y: 0},
    },
    transitions: {
        bar: {x: 0, y: 0},
    },
    arcs: [
        {source:"bar", target: "foo", weight: 1},
    ],
};

describe("should load a model from object", () => {
    it("should inhibit bar", () => {
        const {trigger} = testModel({declaration: inhibitTest, type: ModelType.petriNet});
        trigger("bar", {expectPass: true});
    });
});
