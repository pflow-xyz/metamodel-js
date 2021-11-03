import { player } from "./constants";
import { ModelDsl } from "../metamodel";

const turn = "move";

export function octoe({fn, cell, role}: ModelDsl): void {
  const turnX = cell(player.X, 1, 1, {x: 200, y: 70});
  const moves = cell(turn, 9, 9, {x: 200, y: 170});
  const turnO = cell(player.O, 0, 1, {x: 200, y: 270});

  const moveX = fn(turn+player.X, role(player.X), {x: 90, y: 170});
  const moveO = fn(turn+player.O, role(player.O), {x: 320, y: 170});

  moves.tx(1, moveX);
  turnX.tx(1, moveX);
  moveX.tx(1, turnO);

  moves.tx(1, moveO);
  turnO.tx(1, moveO);
  moveO.tx(1, turnX);
};