export interface RoleDef {
    label: string;
}

export interface Position {
    x: number;
    y: number;
    z?: number;
}

export type Fn = (label: string, role: RoleDef, position: Position) => TxNode
export type Cell = (label: string, initial: number, capacity: number, position: Position) => PlaceNode
export type Role = (label: string) => RoleDef
export type Declaration = (fn: Fn, cell: Cell, role: Role) => void
export type Vector = number[];

export interface Place {
    label: string;
    offset: number;
    initial: number;
    capacity: number;
    position: Position;
}

export interface Guard {
    label: string;
    delta: Vector;
}

export interface Transition {
    label: string;
    delta: Vector;
    role: RoleDef;
    guards: Map<string, Guard>;
    position: Position;
}

export interface Arc {
    source: {
        place?: Place;
        transition?: Transition;
    };
    target: {
        place?: Place;
        transition?: Transition;
    };
    weight: number;
    inhibit?: boolean;
}

export interface PlaceNode {
    place: Place;
    tx: (weight: number, target: TxNode) => void;
    guard: (weight: number, target: TxNode) => void;
}

export interface TxNode {
    transition: Transition;
    tx: (weight: number, target: PlaceNode) => void;
}

export enum ModelType {
    workflow = "workflow",
    petriNet = "petriNet",
    elementary = "elementary",
}

export interface PetriNet {
    schema: string;
    roles: Map<string, RoleDef>;
    places: Map<string, Place>;
    transitions: Map<string, Transition>;
    arcs: Array<Arc>;
    type: ModelType;
}

export interface Result {
    out: Vector;
    ok: boolean;
    role: string;
}

export interface Model {
    dsl: { fn: Fn; cell: Cell; role: Role };
    def: PetriNet;
    index: () => void;
    guardFails: (state: Vector, action: string, multiple: number) => boolean;
    emptyVector: () => Vector;
    initialVector: () => Vector;
    capacityVector: () => Vector;
    testFire: (state: Vector, action: string, multiple: number) => Result;
    fire: (state: Vector, action: string, multiple: number, resolve?: (res: Result) => void, reject?: (res: Result) => void) => Result;
    getSize: () => { width: number; height: number };
}

export interface ModelOptions {
    schema: string;
    declaration?: Declaration;
    type?: ModelType;
}

// load a model using internal js DSL
export function newModel({schema, declaration, type}: ModelOptions): Model {
    const arcs = Array<Arc>();

    const def = {
        schema,
        roles: new Map<string, RoleDef>(),
        places: new Map<string, Place>(),
        transitions: new Map<string, Transition>(),
        arcs,
        type: type || ModelType.petriNet,
    };

    function fn(label: string, role: RoleDef, position: Position): TxNode {
        const transition: Transition = {
            label,
            role,
            position,
            guards: new Map<string, Guard>(),
            delta: []
        };
        def.transitions.set(label, transition);

        const tx = (weight: number, target: PlaceNode): void => {
            if (def.type === ModelType.elementary && weight !== 1) {
                throw new Error(`elementary models only support weight 1, got ${weight}`);
            }
            arcs.push({
                source: {transition: transition},
                target: {place: target.place},
                weight,
            });
        };

        return {transition, tx};
    }

    let placeCount = 0;

    function cell(label: string, initial?: number, capacity?: number, position?: Position): PlaceNode {
        const place = {
            label: label,
            initial: initial || 0,
            capacity: capacity || 0,
            position: position || {x: 0, y: 0, z: 0},
            offset: placeCount
        };
        placeCount = placeCount + 1; // NOTE: js arrays begin with index 0
        def.places.set(label, place);

        function tx(weight: number, target: TxNode): void {
            if (def.type === ModelType.elementary && weight !== 1) {
                throw new Error(`elementary models only support weight 1, got ${weight}`);
            }
            arcs.push({
                source: {place: place},
                target: {transition: target.transition},
                weight: weight,
            });
        }

        function guard(weight: number, target: TxNode) {
            if (def.type === ModelType.elementary && weight !== 1) {
                throw new Error(`elementary models only support weight 1, got ${weight}`);
            }
            arcs.push({
                source: {place},
                target: {transition: target.transition},
                weight: weight,
                inhibit: true
            });
        }

        return {place, tx, guard};
    }

    function role(label: string): RoleDef {
        const r: RoleDef = {label};
        if (!def.roles.get(label)) {
            def.roles.set(label, r);
        }
        return r;
    }

    function emptyVector(): Vector {
        const v: Vector = [];
        for (const [, p] of def.places) {
            v[p.offset] = 0;
        }
        return v;
    }

    function initialVector(): Vector {
        const v: Vector = [];
        let initialCount = 0;
        def.places.forEach((p) => {
            if (def.type === ModelType.elementary && p.initial > 1) {
                throw new Error("Initial values must be 0 or 1");
            }
            if (p.initial > 0) {
                initialCount++;
            }
            v[p.offset] = p.initial;
        });

        if (def.type === ModelType.elementary && initialCount > 1) {
            throw new Error("Elementary models can only have one initial token");
        }
        return v;
    }

    function capacityVector(): Vector {
        const v: Vector = [];
        for (const [, p] of def.places) {
            if (def.type === ModelType.elementary && p.capacity > 1) {
                throw new Error("Elementary models can only have arcs of weight 1");
            }
            v[p.offset] = p.capacity;
        }
        return v;
    }

    function index(): boolean {
        for (const label in def.transitions) {
            def.transitions.get(label).delta = emptyVector(); // right size all deltas
        }
        let ok = true;
        for (const arc of Object.values(arcs)) {
            if (def.type === ModelType.elementary && (arc.weight > 1 || arc.weight < -1)) {
                throw new Error("Elementary models can only have arcs of weight 1");
            }
            if (arc.inhibit && arc.source.place && arc.target.transition) {
                const g = {
                    label: arc.source.place.label,
                    delta: emptyVector(),
                };
                g.delta[arc.source.place.offset] = 0 - arc.weight;
                arc.target.transition.guards.set(arc.source.place.label, g);
            } else if (arc.source.transition && arc.target.place) {
                arc.source.transition.delta[arc.target.place.offset] = arc.weight;
            } else if (arc.target.transition && arc.source.place) {
                arc.target.transition.delta[arc.source.place.offset] = 0 - arc.weight;
            } else {
                ok = false;
            }
        }
        return ok;
    }

    function vectorAdd(state: Vector, delta: Vector, multiple: number): { out: Vector; ok: boolean } {
        const cap = capacityVector();
        const out: Vector = [];
        let ok = true;
        for (const i in state) {
            out[i] = (state[i] + (delta[i] || 0) * multiple);
            if (out[i] < 0) {
                ok = false; // underflow: contains negative
            } else if (cap[i] > 0 && cap[i] - out[i] < 0) {
                ok = false; // overflow: exceeds capacity
            }
        }
        return {out, ok};
    }

    function guardFails(state: Vector, action: string, multiple: number) {
        const t = def.transitions.get(action);
        if (t && t.guards) {
            for (const guard of Object.values(t.guards)) {
                const res = vectorAdd(state, guard.delta, multiple);
                if (res.ok) {
                    return true; // inhibitor active
                }
            }
        } else {
            throw new Error("action not found");
        }
        return false; // inhibitor inactive
    }

    function testFire(state: Vector, action: string, multiple: number): Result {
        const t = def.transitions.get(action);
        if (!t || guardFails(state, action, multiple)) {
            return {out: [], ok: false, role: t?.role?.label || "unknown"};
        }
        const res = vectorAdd(state, t.delta, multiple);
        return {out: res.out, ok: res.ok, role: t.role.label};
    }

    function fire(state: Vector, action: string, multiple: number, resolve?: (res: Result) => void, reject?: (res: Result) => void): Result {
        let res = testFire(state, action, multiple);
        switch (def.type) {
            case ModelType.elementary:
                if (!res.ok) {
                    break;
                }
                let elementaryOutputs = 0;
                let failsHardCap = false;
                for (const i in res.out) {
                    if (res.out[i] > 1) {
                        failsHardCap = true;
                    }
                    if (res.out[i] > 0) {
                        elementaryOutputs++;
                    }
                }
                res = {...res, ok: !failsHardCap && elementaryOutputs < 2 };
                break;
            case ModelType.workflow:
                let wfOutputs = 0;
                let failsWfCap = false;
                const wfOut = emptyVector();
                for (const i in res.out) {
                    if (res.out[i] > 1) {
                        failsWfCap = true;
                    }
                    if (res.out[i] > 0) {
                        wfOutputs++;
                        wfOut[i] = res.out[i];
                    } // NOTE: ignore negative values
                }
                res = {...res, out: wfOut, ok: !failsWfCap && wfOutputs < 2 };
                break;
        }
        if (res.ok) {
            for (const i in res.out) {
                state[i] = res.out[i];
            }
            if (resolve) {
                resolve(res);
            }
        }
        if (!res.ok && reject) {
            reject(res);
        }
        return res;
    }

    function getSize() {
        let limitX = 0;
        let limitY = 0;

        def.places.forEach((p) => {
            if (limitX < p.position.x) {
                limitX = p.position.x;
            }
            if (limitY < p.position.y) {
                limitY = p.position.y;
            }
        });
        def.transitions.forEach((t) => {
            if (limitX < t.position.x) {
                limitX = t.position.x;
            }
            if (limitY < t.position.y) {
                limitY = t.position.y;
            }
        });
        const margin = 100;
        return {width: limitX + margin, height: limitY + margin};
    }

    if (declaration) {
        declaration(fn, cell, role);
        if (!index()) {
            throw new Error("invalid declaration");
        }
    }

    return {
        dsl: {fn, cell, role},
        def,
        index,
        guardFails,
        emptyVector,
        initialVector,
        capacityVector,
        testFire,
        fire,
        getSize
    };
}