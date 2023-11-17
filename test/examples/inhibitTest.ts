import * as mm from "../../";

export function pos(x: number, y: number): { x: number; y: number } {
    return {x: x * 80, y: y * 80};
}

export function inhibitTest(fn: mm.Fn, cell: mm.Cell, role: mm.Role): void {
    const defaultRole = role("default");
    const foo = cell("foo", 1, 0, pos(6, 2));
    const bar = fn("bar", defaultRole, pos(5, 4));
    const baz = fn("baz", defaultRole, pos(7, 4));
    foo.guard(1, baz);
    foo.tx(1, bar);
}