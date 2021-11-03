import { expect } from "chai";
import { ModelDsl, Model } from "../src/metamodel";
import { octothorpe } from "../src/examples";

describe("Model", () => {
    it("should load model from using DSL", () => {
        const m = new Model({ schema: "octoe" });
        m.loadDef(({ fn, cell, role }: ModelDsl) => {
            const r = role("default");
            const foo = cell("foo", 1, 1, {x: 0, y: 0});
            expect(foo.isPlace()).to.be.true;
            expect(foo.isTransition()).to.be.false;

            const bar = fn("bar", r, {x:0, y: 0});
            expect(bar.isTransition()).to.be.true;
            expect(bar.isPlace()).to.be.false;

            foo.tx(1, bar);

            const baz = fn("baz", r, {x:0, y: 0});
            foo.guard(1, baz);
        });
        expect(Object.keys(m.places)).to.include("foo");
        const sim = m.toMetaModel().startSimulation();

        const [out, flag] = sim.canFire("bar", 1);
        expect(out.length).to.equal(1);
        expect(out[0]).to.equal(0);
        expect(flag).to.be.true;

        const [out2, flag2] = sim.canFire("baz", 1);
        expect(out2[0]).to.equal(1);
        expect(flag2).to.be.false;

        expect(sim.state[0]).to.equal(1);
        sim.fire("bar", 1);
        expect(sim.state[0]).to.equal(0);
    });

    it("should be able to play tic-tac-toe", () => {
        const m = new Model({ schema: "octothorpe" })
            .loadDef(octothorpe)
            .toMetaModel();

        m.startSimulation();

        const move = (oid: string, ) => {
            const p = oid.substr(1,3);
            expect(m.getTokenCount(p)).to.equal(1);
            m.fire(oid, 1);
            expect(m.getTokenCount(p)).to.equal(0);
        };

        move("X11");
        move("O10");
        move("X00");
        move("O20");
        move("X22");

        m.stopSimulation();
    });
});

