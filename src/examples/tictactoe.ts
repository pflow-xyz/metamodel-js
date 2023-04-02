import {Cell, Fn, PlaceNode, Role, RoleDef} from "../model";


// visual spacing
const dx = 220;
const dy = 140;

export function tictactoe(fn: Fn, cell: Cell, role: Role): void {

    function row(n: number) {
        const y = (n + 1) * dy;
        return [
            cell(`${n}0`, 1, 1, {x: dx, y, z: 0}),
            cell(`${n}1`, 1, 1, {x: 2 * dx, y, z: 0}),
            cell(`${n}2`, 1, 1, {x: 3 * dx, y, z: 0})
        ];
    }

    const board = [
        row(0),
        row(1),
        row(2)
    ];

    interface Player {
        turn: PlaceNode;
        role: RoleDef;
        dx: number;
        next: string;
    }

    const players = new Map<string, Player>();
    const X = "X";
    const O = "O";

    players.set(X, {
        turn: cell(X, 1, 1, {x: 40, y: 200, z: 0}), // track turns, X goes first
        role: role(X), //g player X can only mark X's
        dx: -60,
        next: O
    });

    players.set(O, {
        turn: cell(O, 0, 1, {x: 830, y: 370, z: 0}), // track turns, O moves second
        role: role(O), // player O can only mark O's
        dx: 60,
        next: X
    });

    for (const i in board) {
        for (const j in board[i]) {
            for (const [marking, player] of players) {
                const pos = board[i][j].place.position; // use place for relative positioning
                const move = fn(`${marking}${i}${j}`, player.role, {
                    x: pos.x + player.dx,
                    y: pos.y,
                    z: 0
                }); // make a move
                player.turn.tx(1, move); // take turn
                board[i][j].tx(1, move); // take board space
                move.tx(1, players.get(player.next).turn); // mark next turn
            }
        }
    }

}