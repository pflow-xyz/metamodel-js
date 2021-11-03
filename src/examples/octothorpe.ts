import { player, move } from "./constants";
import { ModelDsl } from "../metamodel";

export function octothorpe({fn, cell, role}: ModelDsl): void {

  // Roles
  const roleX = role(player.X);
  const roleO = role(player.O);

  // parameterize visual layout
  const dx = 200;
  const dy = 120;
  const x = 160;
  const y = 160;
  const lx = -60;
  const rx = 60;

  const p00 = cell(move._00, 1, 1, {x: x+0*dx, y: y+0*dy});
  const p01 = cell(move._01, 1, 1, {x: x+1*dx, y: y+0*dy});
  const p02 = cell(move._02, 1, 1, {x: x+2*dx, y: y+0*dy});

  const p10 = cell(move._10, 1, 1, {x: x+0*dx, y: y+1*dy});
  const p11 = cell(move._11, 1, 1, {x: x+1*dx, y: y+1*dy});
  const p12 = cell(move._12, 1, 1, {x: x+2*dx, y: y+1*dy});

  const p20 = cell(move._20, 1, 1, {x: x+0*dx, y: y+2*dy});
  const p21 = cell(move._21, 1, 1, {x: x+1*dx, y: y+2*dy});
  const p22 = cell(move._22, 1, 1, {x: x+2*dx, y: y+2*dy});

  const turnX = cell(player.X, 1, 0, {x: 360, y: 50});
  const turnO = cell(player.O, 0, 0, {x: 360, y: 520});


  // player X moves
  const x00 = fn(player.X+move._00, roleX, {x: x+0*dx+lx, y: y+0*dy}).tx(1, turnO);
  const x01 = fn(player.X+move._01, roleX, {x: x+1*dx+lx, y: y+0*dy}).tx(1, turnO);
  const x02 = fn(player.X+move._02, roleX, {x: x+2*dx+lx, y: y+0*dy}).tx(1, turnO);


  const x10 = fn(player.X+move._10, roleX, {x: x+0*dx+lx, y: y+1*dy}).tx(1, turnO);
  const x11 = fn(player.X+move._11, roleX, {x: x+1*dx+lx, y: y+1*dy}).tx(1, turnO);
  const x12 = fn(player.X+move._12, roleX, {x: x+2*dx+lx, y: y+1*dy}).tx(1, turnO);


  const x20 = fn(player.X+move._20, roleX, {x: x+0*dx+lx, y: y+2*dy}).tx(1, turnO);
  const x21 = fn(player.X+move._21, roleX, {x: x+1*dx+lx, y: y+2*dy}).tx(1, turnO);
  const x22 = fn(player.X+move._22, roleX, {x: x+2*dx+lx, y: y+2*dy}).tx(1, turnO);

  // player O moves
  const o00 = fn(player.O+move._00, roleO, {x: x+0*dx+rx, y: y+0*dy}).tx(1, turnX);
  const o01 = fn(player.O+move._01, roleO, {x: x+1*dx+rx, y: y+0*dy}).tx(1, turnX);
  const o02 = fn(player.O+move._02, roleO, {x: x+2*dx+rx, y: y+0*dy}).tx(1, turnX);

  const o10 = fn(player.O+move._10, roleO, {x: x+0*dx+rx, y: y+1*dy}).tx(1, turnX);
  const o11 = fn(player.O+move._11, roleO, {x: x+1*dx+rx, y: y+1*dy}).tx(1, turnX);
  const o12 = fn(player.O+move._12, roleO, {x: x+2*dx+rx, y: y+1*dy}).tx(1, turnX);

  const o20 = fn(player.O+move._20, roleO, {x: x+0*dx+rx, y: y+2*dy}).tx(1, turnX);
  const o21 = fn(player.O+move._21, roleO, {x: x+1*dx+rx, y: y+2*dy}).tx(1, turnX);
  const o22 = fn(player.O+move._22, roleO, {x: x+2*dx+rx, y: y+2*dy}).tx(1, turnX);

  // change turns when player_x moves
  turnX.tx(1, x00);
  turnX.tx(1, x01);
  turnX.tx(1, x02);

  turnX.tx(1, x10);
  turnX.tx(1, x11);
  turnX.tx(1, x12);

  turnX.tx(1, x20);
  turnX.tx(1, x21);
  turnX.tx(1, x22);

  // remove token from board when player_x moves
  p00.tx(1, x00);
  p01.tx(1, x01);
  p02.tx(1, x02);

  p10.tx(1, x10);
  p11.tx(1, x11);
  p12.tx(1, x12);

  p20.tx(1, x20);
  p21.tx(1, x21);
  p22.tx(1, x22);

  // remove token from board when player_o moves
  p00.tx(1, o00);
  p01.tx(1, o01);
  p02.tx(1, o02);

  p10.tx(1, o10);
  p11.tx(1, o11);
  p12.tx(1, o12);

  p20.tx(1, o20);
  p21.tx(1, o21);
  p22.tx(1, o22);

  // change turns when player_o moves
  turnO.tx(1, o00);
  turnO.tx(1, o01);
  turnO.tx(1, o02);

  turnO.tx(1, o10);
  turnO.tx(1, o11);
  turnO.tx(1, o12);

  turnO.tx(1, o20);
  turnO.tx(1, o21);
  turnO.tx(1, o22);
};

