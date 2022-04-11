/*
 MIT License

 Copyright (c) 2022 stackdump.com LLC

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
*/

// load a model using internal js DSL
function domodel(schema, declaration) {

	const def = {
		schema: schema,
		roles: {},
		places: {},
		transitions: {},
		arcs: [],
	};

	function assert(flag, msg) {
		if (! flag) {
			throw new Error(msg);
		}
	}

	function fn(label, role, position) {
		const transition =  { label, role, position, guards: {}, delta: {} };
		def.transitions[label] = transition;
		return {
			transition: transition,
			tx: (weight, target) => {
				assert(target, "target is null" );
				assert(target.place, "target node must be a place");
				def.arcs.push({
					source: { transition: transition },
					target,
					weight,
					inhibit: false
				});
			}
		};
	}

	let placeCount = 0;

	function cell(label, initial, capacity, position) {
		const place = {
			label: label,
			initial: initial || 0,
			capacity: capacity || 0,
			position: position || {},
			offset: placeCount
		};
		placeCount = placeCount + 1; // NOTE: js arrays begin with index 0
		def.places[label] = place;

		function tx(weight, target) {
			def.arcs.push({
				source: { place: place },
				target: target,
				weight: weight || 1,
				inhibit: false
			});
			assert(target.transition, "target node must be a transition");
		}

		function guard(weight, target) {
			def.arcs.push({
				source: { place },
				target: target,
				weight: weight,
				inhibit: true
			});
			assert(target.transition, "target node must be a transition");
		}
		return { place, tx, guard };
	}

	function role(label) {
		if (!def.roles[label]) {
			def.roles[label] = { label };
		}
		return def.roles[label];
	}

	function emptyVector() {
		const v = {};
		for (const p of Object.values(def.places)) {
			v[p.offset] = 0;
		}
		return v;
	}

	function initialVector() {
		const v = {};
		for (const p of Object.values(def.places)) {
			v[p.offset] = p.initial;
		}
		return v;
	}

	function capacityVector() {
		const v = {};
		for (const p of Object.values(def.places)) {
			v[p.offset] = p.capacity;
		}
		return v;
	}

	function index() {
		for (const transition of Object.values(def.transitions)) {
			transition.delta = emptyVector(); // right size all deltas
		}
		let ok = true;
		for (const arc of Object.values(def.arcs) ) {
			if (arc.inhibit) {
				const g = {
					label: arc.source.place.label,
					delta: emptyVector(),
				};
				g.delta[arc.source.place.offset] = 0 - arc.weight;
				arc.target.transition.guards[arc.source.place.label] = g;
			} else if (arc.source.transition) {
				arc.source.transition.delta[arc.target.place.offset] = arc.weight;
			} else if (arc.source.place) {
				arc.target.transition.delta[arc.source.place.offset] = 0 - arc.weight;
			} else {
				ok = false;
			}
		}
		return ok;
	}

	function vectorAdd(state, delta, multiple) {
		const cap = capacityVector();
		const out = {};
		let ok = true;
		for (const i in state) {
			out[i] = state[i] + delta[i] * multiple;
			if (out[i] < 0) {
				ok = false; // underflow: contains negative
			} else if (cap[i] > 0 && cap[i] - out[i] < 0 ) {
				ok = false; // overflow: exceeds capacity
			}
		}
		return { out, ok };
	}

	function guardFails(state, action, multiple) {
		assert(action, "action is nil");
		const t = def.transitions[action];
		assert(t, "action not found: " + action );
		for (const guard of Object.values(t.guards)) {
			const res = vectorAdd(state, guard.delta, multiple);
			if (res.ok) {
				return true; // inhibitor active
			}
		}
		return false; // inhibitor inactive
	}

	function testFire(state, action, multiple) {
		const t = def.transitions[action];
		if (guardFails(state, action, multiple) ) {
			return { out: null, ok: false, role: t.role.label };
		}
		const res = vectorAdd(state, t.delta, multiple);
		return { out: res.out, ok: res.ok, role: t.role.label };
	}

	function fire(state, action, multiple, resolve, reject) {
		const res = testFire(state, action, multiple);
		if (res.ok) {
			for ([i, v] of Object.entries(res.out)) {
				state[i] = v;
			}
		}
		if (resolve) {
			resolve(res);
		} else if (reject) {
			reject(res);
		}
		return res;
	}

	if (declaration) {
		declaration(fn, cell, role);
		if (!index()) {
			throw new Error("invalid declaration");
		}
	}

	return {
		dsl: { fn, cell, role },
		def,
		index,
		guardFails,
		emptyVector,
		initialVector,
		capacityVector,
		testFire,
		fire,
	};
}
