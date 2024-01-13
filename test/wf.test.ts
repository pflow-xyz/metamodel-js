import {ModelDeclaration, ModelType, newModel, snapshot} from "../";
import fs from "fs";

const wfNet: ModelDeclaration = {
  "modelType": ModelType.workflow,
  "version": "v0",
  "places": {
    "entry": { "offset": 0, "initial": 1, "capacity": 0, "x": 852, "y": 54 },
    "exit": { "offset": 1, "initial": 0, "capacity": 0, "x": 863, "y": 546 },
    "place2": { "offset": 2, "initial": 0, "capacity": 0, "x": 738, "y": 367 },
    "place3": { "offset": 3, "initial": 0, "capacity": 0, "x": 962, "y": 359 }
  },
  "transitions": {
    "txn0": { "x": 728, "y": 155 },
    "txn1": { "x": 964, "y": 147 },
    "txn6": { "x": 861, "y": 455 }
  },
  "arcs": [
    { "source": "entry", "target": "txn0", "weight": 1 },
    { "source": "entry", "target": "txn1", "weight": 1 },
    { "source": "place3", "target": "txn6", "weight": 1 },
    { "source": "place2", "target": "txn6", "weight": 1 },
    { "source": "txn6", "target": "exit", "weight": 1 },
    { "source": "txn0", "target": "place2", "weight": 1 },
    { "source": "txn1", "target": "place3", "weight": 1 }
  ]
};

describe("metamodel", () => {
    describe("workflow", () => {
        it("should not work for invalid models", () => {
          const m = newModel({schema: "wfNet", declaration: wfNet, type: wfNet["modelType"]});
          expect(m.def.type).toEqual("workflow");
          const svg = snapshot(m, { state: [0, 0, 1, 0]});
          fs.writeFileSync("test.svg", svg); // FIXME: assert this generates a valid SVG
          const state = m.initialVector();
          const entry = m.def.places.get("entry");
          expect(entry).toBeDefined();
          expect(entry.offset).toEqual(0);
          expect(state[entry.offset]).toEqual(1);
          expect(entry.initial).toEqual(1);
          expect(entry.capacity).toEqual(0);

          expect(m.fire(state, "txn6", 1).ok).toBeFalsy();
          expect(state).toEqual([1, 0, 0, 0]);
          expect(m.fire(state, "txn0", 1).ok).toBeTruthy();
          expect(state).toEqual([0, 0, 1, 0]);
          expect(m.fire(state, "txn6", 1).ok).toBeTruthy();
          expect(state).toEqual([0, 1, 0, 0]);
        });
    });
});

