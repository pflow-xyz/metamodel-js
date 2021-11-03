import assert from "assert";

interface Position {
  x: number;
  y: number;
}

type Role = {
  label: string;
}

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
  symbol: Place | Transition;
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

  guardsFail(oid: string, multiple: number): boolean {
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

  transitionFails(oid: string, multiple: number) {
    const t = this.transitions[oid];
    const res = this.vectorAdd(this.state, t.delta, multiple);
    return !res[1];
  }

  canFire(oid: string, multiple: number): [Vector, boolean] {
    if (multiple != null && multiple < 0) {
      return [this.state, false];
    }
    const t = this.transitions[oid];

    if (this.guardsFail(oid, multiple || 1)) {
      return [this.state, false];
    }

    return this.vectorAdd(this.state, t.delta, multiple || 1);
  }

  fire(oid: string, multiple: number, resolve?: Function, reject?: Function) {
    const [out, ok] = this.canFire(oid, multiple);
    if (ok) {
      this.history.push({ seq: this.history.length+1, action: oid, multiple,  state: out });
      this.state = out;
      if (resolve) {
        resolve();
      }
    } else {
      if (reject) {
        reject();
      }
    }
  }
}

class MetaModel implements PetriNet {
  schema: string;
  places: PlaceMap;
  transitions: TransitionMap;
  simulation: Simulation;

  constructor(model: PetriNet) {
    this.schema = model.schema;
    this.places = model.places;
    this.transitions = model.transitions;
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

  getTokenCount(oid: string) {
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
    const t = this.getObject(oid) as Transition;
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

  guardsFail(oid: string, multiple?: number): boolean {
    this.assertRunning();
    return this.simulation.guardsFail(oid, multiple || 1);
  }

  transitionFails(oid: string, multiple?: number): boolean {
    this.assertRunning();
    return this.simulation.transitionFails(oid, multiple || 1);
  }

  getObject(oid: string): Place | Transition {
    if (oid in this.transitions) {
      return this.transitions[oid];
    } else if (oid in this.places) {
      return this.places[oid];
    }
  }

  emptyVector() {
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

  addPlace(coords: Position): Place {
    const offset = Object.keys(this.places).length;
    const label = this.placeSeq();
    this.places[label] = {
      label: label,
      initial: 0,
      capacity: 0,
      offset,
      position: {x: coords.x, y: coords.y},
    };

    // extend delta vector size
    for (const oid in this.transitions) {
      this.transitions[oid].delta[offset] = 0;
    }

    return this.places[label];
  }

  addTransition(coords: Position): Transition {
    const oid = this.transitionSeq();
    this.transitions[oid] = {
      offset: Object.keys(this.transitions).length,
      label: oid,
      role: { label: "default" },
      delta: this.emptyVector(),
      position: {x: coords.x, y: coords.y},
      guards: {}
    };
    return this.transitions[oid];
  }

  validArc(source: string, target: string): boolean {
    return (
        (source in this.places && target in this.transitions) ||
        (source in this.transitions && target in this.places)
    );
  }

  addArc(begin: string, end: string) {
    let t;
    let p;
    let weight = 0;

    if (begin in this.transitions) {
      weight = 1;
      t = this.transitions[begin];
      p = this.places[end];
    } else {
      weight = -1;
      t = this.transitions[end];
      p = this.places[begin];
    }

    t.delta[p.offset] = weight;
  }

  delTransition(oid: string) {
    delete this.transitions[oid];
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

  toggleInhibitor(arc: { source: string; target: string}) {
    if (arc.source in this.transitions) {
      return false;
    }

    const label = arc.source;
    const p = this.getObject(arc.source) as Place;
    const t = this.getObject(arc.target) as Transition;

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
  addGuardToken(t: Transition, pid: string, offset: number, delta: number) {
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

  addArcToken(arc: { source: string; target: string }, delta: number) {
    let t;
    let p;
    let pid;
    if (arc.source in this.transitions) {
      t = this.getObject(arc.source) as Transition;
      p = this.getObject(arc.target) as Place;
      pid = arc.target;
    } else {
      t = this.getObject(arc.target) as Transition;
      p = this.getObject(arc.source) as Place;
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
  symbol: Place | Transition;
  private graph: Graph;

  constructor(net: Graph) {
    this.graph = net;
  }

  isPlace(): boolean {
    const initial = (this.symbol as Place).initial;
    return initial === 0 || initial > 0;
  }

  isTransition(): boolean {
    return !!(this.symbol as Transition).delta;
  }

  get place(): Place {
    return this.symbol as Place;
  }

  set place(p: Place) {
    this.symbol = p;
  }

  get transition(): Transition {
    return this.symbol as Transition;
  }

  set transition(t: Transition) {
    this.symbol = t;
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

  add(state: Vector, delta: Vector, multiplier: number, capacity: Vector) {
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

  transform(inputState: Vector, transaction: string, multiplier: number) {
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

  offset(placeLabel: string) {
    const pl = this.places[placeLabel];
    if (! pl) {
      throw new Error(errMsg.InvalidPlace);
    }
    return pl.offset;
  }

  actionId(transitionLabel: string) {
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

export class Model extends Dsl implements ModelDsl {

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