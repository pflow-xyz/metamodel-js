import assert from "assert";

interface Position {
  x: number;
  y: number;
}

type elementRef = {
  label: string;
}

type Role = elementRef;

type RoleMap = {
  [key: string]: Role;
}

type Vector = Array<number>;

type Place = {
  label: string;
  offset: number;
  initial?: number;
  capacity?: number;
  position?: Position;
}

type Guard = {
  label: string;
  delta: Vector;
}

type GuardMap = {
  [key: string]: Guard;
}

type Transition = {
  label: string;
  role: Role;
  offset: number;
  delta: Vector;
  guards: GuardMap;
  position?: Position;
}

type PlaceMap = {
  [key: string]: Place;
}

type TransitionMap = {
  [key: string]: Transition;
}

interface Node {
  element: Place | Transition;
  tx(weight: number, target: Node): Node;
  guard(weight: number, target: Node): Node;
  isPlace(): boolean;
  isTransition(): boolean;
  place: Place;
  transition: Transition;
}

type Arc = {
  source: Node;
  target: Node;
  weight: number;
  inhibitor?: boolean;
}

interface PetriNet {
  schema: string;
  places: PlaceMap;
  transitions: TransitionMap;
}

export const errMsg = {
  FrozenModel: "dsl cannot be applied to an already frozen model",
  BadInhibitorSource: "inhibitor source must be a place",
  BadInhibitorTarget: "inhibitor target must be a transitions",
  BadArcWeight: "arc weight must be positive integers",
  BadArcTransition: "source and target are both transitions",
  BadArcPlace: "source and target are both places",
  InvalidArc: "invalid arc",
  InvalidPlace: "invalid place",
  InvalidAction: "invalid action",
  InvalidOutput: "output cannot be negative",
  ExceedsCapacity: "output exceeds capacity",
  GuardCheckFailure: "guard condition failure"
};

type Commit = {
  seq: number;
  action: string;
  multiple: number;
  state: Vector;
}

class Simulation {
  transitions: TransitionMap;
  state: Vector;
  capacity: Vector;
  history: Commit[];

  constructor(model: PetriNet) {
    this.history = [];
    this.state = [];
    this.capacity = [];
    this.transitions = model.transitions;

    for (const i in model.places) {
      this.capacity[model.places[i].offset] = model.places[i].capacity;
      this.state[model.places[i].offset] = model.places[i].initial;
    }
  }

  vectorAdd(state: Vector, delta: Vector, multiple: number): [Vector, boolean] {
    const out: Vector = [];
    let valid = true;
    for ( const i in state) {
      out[i] = state[i] + delta[i] * multiple;

      if (out[i] < 0 ) {
        valid = false;
      } else if (this.capacity[i] > 0 && this.capacity[i] - out[i] < 0) {
        valid = false;
      }
    }

    return [out, valid];
  }

  guardFails(oid: string, multiple: number): boolean {
    let res = null;
    const t = this.transitions[oid];
    for (const place in t.guards) {
      res = this.vectorAdd(this.state, t.guards[place]["delta"], multiple);
      if (res[1]) {
        return true;
      }
    }
    return false;
  }

  transitionFails(oid: string, multiple: number): boolean {
    const t = this.transitions[oid];
    const res = this.vectorAdd(this.state, t.delta, multiple);
    return !res[1];
  }

  canFire(oid: string, multiple: number): [Vector, boolean] {
    if (multiple != null && multiple < 0) {
      return [this.state, false];
    }
    const t = this.transitions[oid];

    if (this.guardFails(oid, multiple || 1)) {
      return [this.state, false];
    }

    return this.vectorAdd(this.state, t.delta, multiple || 1);
  }

  fire(oid: string, multiple: number, resolve?: Function, reject?: Function) {
    const [out, ok] = this.canFire(oid, multiple);
    if (ok) {
      this.history.push({ seq: this.history.length+1, action: oid, multiple,  state: out });
      this.state = out;
      if (!!resolve) {
        resolve();
      }
    } else {
      if (!!reject) {
        reject();
      }
    }
  }
}

export interface ModelDef {
  Place: (def: (p: Place) => void) => Place;
  Transition: (def: (t: Transition) => void) => Transition;
  Arc: (source: elementRef, target: elementRef, weight?: number) => void;
  Guard: (source: elementRef, target: elementRef, weight?: number) => void;
}

class MetaModel implements PetriNet, ModelDef {
  schema: string;
  places: PlaceMap;
  transitions: TransitionMap;
  simulation: Simulation;

  constructor(model: PetriNet) {
    this.schema = model.schema;
    this.places = model.places;
    this.transitions = model.transitions;
  }

  define(): ModelDef {
    return this;
  }

  startSimulation(): Simulation {
    this.simulation = new Simulation(this);
    return this.simulation;
  }

  stopSimulation() {
    this.simulation = null;
  }

  isRunning(): boolean {
    return !!this.simulation;
  }

  assertRunning(): void {
    assert(!!this.simulation, "NOT_RUNNING");
  }

  getTokenCount(oid: string): number {
    if (oid in (this.places)) {
      if (this.isRunning()) {
        return this.simulation.state[this.places[oid].offset];
      } else {
        return this.places[oid].initial;
      }
    } else {
      return -1;
    }
  }

  fire(oid: string, multiple: number): boolean {
    this.assertRunning();
    let updated = false;
    if (this.isRunning()) {
      this.simulation.fire(oid, multiple || 1, () => {
        updated = true;
      });
    }
    return updated;
  }

  canFire(oid: string, role?: string): boolean {
    const t = this.transitions[oid] as Transition;
    if (role && t.role.label !== role) {
      return false;
    }

    if (this.isRunning() && oid in this.transitions) {
      const [, ok] = this.simulation.canFire(oid, 1);
      return ok;
    } else {
      return false;
    }
  }

  guardFails(oid: string, multiple?: number): boolean {
    this.assertRunning();
    return this.simulation.guardFails(oid, multiple || 1);
  }

  transitionFails(oid: string, multiple?: number): boolean {
    this.assertRunning();
    return this.simulation.transitionFails(oid, multiple || 1);
  }

  emptyVector(): Vector {
    return Object.keys(this.places).map(() => 0);
  }

  private placeSeq(): string {
    let x = 0;
    while ("place"+x in this.places) {
      x++;
    }
    return "place"+x;
  }

  private transitionSeq(): string {
    let x = 0;
    while ("txn"+x in this.transitions) {
      x++;
    }
    return "txn"+x;
  }

  Place(def: (p: Place) => void): Place {
    const offset = Object.keys(this.places).length;
    const label = this.placeSeq();
    const p = {
      label: label,
      initial: 0,
      capacity: 0,
      offset,
      position: {x: 0, y: 0},
    };
    def(p);
    this.places[p.label] = p;

    // extend delta vector size
    for (const oid in this.transitions) {
      this.transitions[oid].delta[offset] = 0;
    }

    return p;
  }

  Transition(def: (t: Transition) => void): Transition {
    const oid = this.transitionSeq();
    const t = {
      offset: Object.keys(this.transitions).length,
      label: oid,
      role: { label: "default" },
      delta: this.emptyVector(),
      position: {x: 0, y: 0},
      guards: {}
    };
    def(t);
    this.transitions[t.label] = t;
    return t;
  }

  validArc(source: string, target: string): boolean {
    return (
        (source in this.places && target in this.transitions) ||
        (source in this.transitions && target in this.places)
    );
  }

  arc(source: elementRef, target: elementRef, weight?: number, guard?: boolean) {
    let t;
    let p;
    let unit = 0;
    const w = weight || 1;

    if (source.label in this.transitions) {
      unit = 1;
      t = this.transitions[source.label];
      p = this.places[target.label];
    } else {
      unit = -1;
      t = this.transitions[target.label];
      p = this.places[source.label];
    }

    if (!!guard) {
      // FIXME define guard
    } else {
      t.delta[p.offset] = w*unit;
    }
  }

  Arc(source: elementRef, target: elementRef, weight?: number) {
    this.arc(source, target, weight || 1);
  }

  Guard(source: elementRef, target: elementRef, weight?: number) {
    this.arc(source, target, weight || 1, true);
  }

  delTransition(oid: string) {
    const t = this.transitions[oid];
    delete this.transitions[oid];
    for (const txn in this.transitions) {
      if (this.transitions[txn].offset > t.offset) {
        this.transitions[txn].offset = this.transitions[txn].offset - 1
      }
    }
  }

  delPlace(oid: string) {
    const offset = this.places[oid].offset;
    for (const txn in this.transitions) {
      delete this.transitions[txn].delta[offset];
      delete this.transitions[txn].guards[oid];
    }
    delete this.places[oid];
  }

  delArc(obj: { source: string; target: string }) {
    let p;
    let t;

    if (obj.source in this.places) {
      p = obj.source;
      t = obj.target;
    } else {
      t = obj.source;
      p = obj.target;
    }

    const offset = this.places[p].offset;
    this.transitions[t].delta[offset] = 0;
    delete this.transitions[t].guards[p];
  }

  toggleInhibitor(arc: { source: string; target: string}): boolean {
    if (arc.source in this.transitions) {
      return false;
    }

    const label = arc.source;
    const p = this.places[arc.source] as Place;
    const t = this.transitions[arc.target] as Transition;

    if (t.delta[p.offset] !== 0) {
      const delta = this.emptyVector();
      delta[p.offset] = t.delta[p.offset];
      t.delta[p.offset] = 0; // remove transition
      t.guards[label] = {delta, label};
    } else {
      t.delta[p.offset] = t.guards[label]["delta"][p.offset];
      delete t.guards[label];
    }
    return true;
  }

  // REVIEW: should we accept oid instead of transition as arg?
  addGuardToken(t: Transition, pid: string, offset: number, delta: number): boolean {
    let v = t.guards[pid]["delta"][offset];

    if (v > 0) {
      v += delta;
    }
    if (v < 0) {
      v -= delta;
    }

    if (v === 0) {
      return false;
    }

    t.guards[pid]["delta"][offset] = v;
    return true;
  }

  addArcToken(arc: { source: string; target: string }, delta: number): boolean {
    let t;
    let p;
    let pid;
    if (arc.source in this.transitions) {
      t = this.transitions[arc.source];
      p = this.places[arc.target];
      pid = arc.target;
    } else {
      t = this.transitions[arc.target];
      p = this.places[arc.source];
      pid = arc.source;
    }

    if (t.delta[p.offset] === 0) { // if arc doesn't exist
      return this.addGuardToken(t, pid, p.offset, delta);
    }

    let v = t.delta[p.offset];

    if (v > 0) {
      v += delta;
    }
    if (v < 0) {
      v -= delta;
    }

    if (v === 0) {
      return false;
    }

    t.delta[p.offset] = v;
    return true;
  }

}

interface Graph {
  arcs: Arc[];
}

class Element implements Node {
  element: Place | Transition;
  private graph: Graph;

  constructor(net: Graph) {
    this.graph = net;
  }

  isPlace(): boolean {
    const initial = (this.element as Place).initial;
    return initial === 0 || initial > 0;
  }

  isTransition(): boolean {
    return !!(this.element as Transition).delta;
  }

  get place(): Place {
    return this.element as Place;
  }

  set place(p: Place) {
    this.element = p;
  }

  get transition(): Transition {
    return this.element as Transition;
  }

  set transition(t: Transition) {
    this.element = t;
  }

  guard(weight: number, target: Node): Node {
    if (!this.isPlace()) {
      throw new Error(errMsg.BadInhibitorSource);
    }

    if (!target.isTransition()) {
      throw new Error(errMsg.BadInhibitorTarget);
    }
    this.graph.arcs.push({
      source: this,
      target: target,
      weight: weight,
      inhibitor: true,
    });
    return this;
  }

  tx(weight: number, target: Node): Node {
    if (weight <= 0) {
      throw new Error(errMsg.BadArcWeight);
    }
    if (this.isPlace() && target.isPlace()) {
      throw new Error (errMsg.BadArcPlace);
    }
    if (this.isTransition() && target.isTransition()) {
      throw new Error (errMsg.BadArcTransition);
    }

    this.graph.arcs.push({
      source: this,
      target: target,
      weight: weight,
    });
    return this;
  }

}

class StateMachine implements PetriNet {
  schema: string;
  places: PlaceMap;
  transitions: TransitionMap;

  constructor() {
    this.places = {};
    this.transitions = {};
  }

  emptyVector(): Vector {
    return Object.keys(this.places).map(() => 0);
  }

  initialState(): Vector {
    const out = [];
    for ( const label in this.places) {
      const p = this.places[label];
      out[p.offset] = p.initial || 0;
    }
    return out;
  }

  stateCapacity(): Vector {
    const out = [];
    for ( const label in this.places) {
      const p = this.places[label];
      out[p.offset] = p.capacity || 0;
    }
    return out;
  }

  add(state: Vector, delta: Vector, multiplier: number, capacity: Vector): [Error, Vector] {
    let err = null;
    const out = this.emptyVector();
    for (const index in state) {
      const sum = state[index] + delta[index] * multiplier;
      if (sum < 0) {
        err = new Error(errMsg.InvalidOutput);
      }
      if ((capacity && (capacity[index] > 0 && sum > capacity[index]))) {
        err = new Error(errMsg.ExceedsCapacity);
      }
      out[index] = sum;
    }

    return [err, out];
  }

  transform(inputState: Vector, transaction: string, multiplier: number): [ Error, Vector, Role] {
    const [delta, role, guards] = this.action(transaction);
    for ( const label in guards) {
      const guard = guards[label];
      const [check, out] = this.add(inputState, guard.delta, multiplier, this.emptyVector());
      if (check == null) {
        return [new Error(errMsg.GuardCheckFailure), out, role];
      }
    }
    const [err, out] = this.add(inputState, delta, multiplier, this.stateCapacity());
    return [err, out, role];
  }

  actions(): Array<string> {
    return Object.keys(this.transitions);
  }

  action(transitionLabel: string): [Vector, Role, GuardMap] {
    try {
      const tx = this.transitions[transitionLabel];
      return [tx.delta, tx.role, tx.guards];
    } catch {
      throw new Error(errMsg.InvalidAction);
    }
  }

  offset(placeLabel: string): number {
    const pl = this.places[placeLabel];
    if (! pl) {
      throw new Error(errMsg.InvalidPlace);
    }
    return pl.offset;
  }

  actionId(transitionLabel: string): number {
    const act = this.transitions[transitionLabel];
    if (! act) {
      throw new Error(errMsg.InvalidAction);
    }
    return act.offset;
  }
}

class Dsl extends StateMachine {
  frozen: boolean;
  arcs: Arc[];
  roles: RoleMap;

  constructor() {
    super();
    this.frozen = false;
    this.arcs = [];
    this.roles = {};
  };

  assertNotFrozen() {
    if (this.frozen) {
      throw new Error(errMsg.FrozenModel);
    }
  }

  role(label: string ): Role {
    this.assertNotFrozen();
    this.roles[label] = {label};
    return {label};
  }

  cell(label: string, initial: number, capacity: number, position: Position): Node {
    this.assertNotFrozen();
    const offset = Object.keys(this.places).length;
    const element = new Element(this);
    element.place = {label, offset, initial, capacity, position};
    this.places[label]= element.place;
    return element;
  }

  fn(label: string, role: Role, position: Position): Node {
    this.assertNotFrozen();
    const element = new Element(this);
    const guards = {};
    const delta: Vector = [];
    const offset = Object.keys(this.transitions).length;
    element.transition = {label, role: role, delta, guards, offset, position};
    this.transitions[label] = element.transition;
    return element;
  }
}

export interface ModelDsl {
  fn: (label: string, role: Role, position: Position) => Node;
  cell: (label: string, initial: number, capacity: number, position: Position) => Node;
  role: (label: string) => Role;
}

interface ModelArgs {
  schema: string;
  model?: { places: PlaceMap; transitions: TransitionMap };
}

export class Model extends Dsl {

  constructor({schema, model}: ModelArgs) {
    super();
    this.schema = schema;

    if (!!model) {
      this.places = model.places;
      this.transitions = model.transitions;
    }
  }

  toMetaModel(): MetaModel {
    return new MetaModel(this);
  }

  loadDef(modelDeclaration: ({fn, cell, role}: ModelDsl ) => void): Model {
    modelDeclaration({
      fn: this.fn.bind(this),
      cell: this.cell.bind(this),
      role: this.role.bind(this),
    });
    this.frozen = true;
    for (const label in this.transitions) {
      this.transitions[label].delta = this.emptyVector(); // right-size all vectors
    }

    for (const id in this.arcs) {
      const arc = this.arcs[id];
      if (arc.inhibitor) {
        const g = {
          label: arc.source.place.label,
          delta: this.emptyVector(),
        };
        g.delta[arc.source.place.offset] = 0-arc.weight;
        arc.target.transition.guards[arc.source.place.label] = g;
      } else {
        if (!arc.source || !arc.target) {
          throw new Error(errMsg.InvalidArc);
        }

        if (arc.source.isTransition()) {
          arc.source.transition.delta[arc.target.place.offset] = arc.weight;
        } else {
          arc.target.transition.delta[arc.source.place.offset] = 0-arc.weight;
        }
      }
    }
    return this;
  }
}