import { player, move } from "./constants";
import {Fn, Cell, Role, PlaceNode, RoleDef} from "../metamodel";

const X = "X";
const O = "O";

interface Player {
  turn: PlaceNode;
  role: RoleDef;
  next: string;
}

export function octothorpe(fn: Fn, cell: Cell, role: Role): void {

  function row(n: number) {
    return [
      cell(`${n}0`, 1, 1, {x: 0, y: 0, z: 0}),
      cell(`${n}1`, 1, 1, {x: 0, y: 0, z: 0}),
      cell(`${n}2`, 1, 1, {x: 0, y: 0, z: 0})
    ];
  }

  const board = [
    row(0),
    row(1),
    row(2)
  ];

  const players = new Map<string, Player>();

  players.set(X, {
    turn: cell(X, 1, 1, { x: 0, y: 0, z: 0 }), // track turns, X goes first
    role: role(X), //g player X can only mark X's
    next: O
  });

  players.set(O, {
    turn: cell(O, 0, 1, { x: 0, y: 0, z: 0 }), // track turns, moves second
    role: role(O), // player O can only mark O's
    next: X
  });

  for (const i in  board) {
    for (const j in  board[i]) {
      for ( const[marking, player] of players) {
        const move = fn(`${marking}${i}${j}`, player.role, { x: 0, y: 0, z: 0 }); // make a move
        player.turn.tx(1, move); // take turn
        board[i][j].tx(1, move); // take board space
        move.tx(1, players.get(player.next).turn); // mark next turn
      }
    }
  }
}