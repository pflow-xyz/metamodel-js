import {expect} from "chai";
import {inhibitTest} from "./examples";
import {DeclarationFunction, ModelType, newModel} from "../";
import {reverseInhibitTest} from "./examples/inhibitTest";


function testModel({declaration, type}: { declaration: DeclarationFunction; type: ModelType }) {
    const m = newModel({
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

describe("inhibitTest", () => {
    it("should inhibit bar", () => {
        const {trigger} = testModel({declaration: inhibitTest, type: ModelType.petriNet});
        trigger("baz", {expectFail: true});
        trigger("bar", {expectPass: true});
        trigger("baz", {expectPass: true});
        trigger("bar", {expectFail: true});
    });
});

describe("reverse inhibitTest", () => {
    it("should inhibit bar", () => {
        const {state, trigger} = testModel({declaration: reverseInhibitTest, type: ModelType.petriNet});
        //console.log(JSON.stringify(m.toObject("sparse"), null, 2));
        trigger("baz", {expectFail: true});
        trigger("bar", {expectPass: true});
        trigger("baz", {expectFail: true});
        expect(state[0]).to.equal(2);
        trigger("bar", {expectPass: true});
        trigger("baz", {expectPass: true});
        expect(state[0]).to.equal(3);
        trigger("baz", {expectPass: true});
    });
});
