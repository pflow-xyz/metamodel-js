import {expect} from "chai";
import {inhibitTest} from "./examples";
import {Declaration, ModelType, newModel} from "../";


function testModel({declaration, type}: { declaration: Declaration; type: ModelType }) {
    const m = newModel({
        schema: "testInhibitor",
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
    return {state, trigger};
}

describe("inhibitTest", () => {
    it("should inhibit bar", () => {
        const {trigger} = testModel({declaration: inhibitTest, type: ModelType.petriNet});
        trigger("baz", {expectFail: true});
        trigger("bar", {expectPass: true});
        trigger("baz", {expectPass: true});
        trigger("bar", {expectFail: true});
    });
});

