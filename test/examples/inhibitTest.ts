import * as mm from "../../";

export function pos(x: number, y: number): { x: number; y: number } {
    return {x: x * 80, y: y * 80};
}

export function inhibitTest({fn, cell, role}: mm.Dsl): void {
    const defaultRole = role("default");
    const foo = cell("foo", 1, 0, pos(6, 2));
    const bar = fn("bar", defaultRole, pos(5, 4));
    const baz = fn("baz", defaultRole, pos(7, 4));
    foo.guard(1, baz); // foo is inhibited while threshold is satisfied i.e >= 1
    foo.tx(1, bar);
}

export function reverseInhibitTest({fn, cell, role}: mm.Dsl): void {
    const defaultRole = role("default");
    const foo = cell("foo", 1, 0, pos(6, 2));
    const bar = fn("bar", defaultRole, pos(5, 4));
    const baz = fn("baz", defaultRole, pos(7, 4));
    baz.guard(3, foo); // reverse the guard: foo is inhibited until threshold is reached i.e. < 3
    bar.tx(1, foo); // count up!!
}
