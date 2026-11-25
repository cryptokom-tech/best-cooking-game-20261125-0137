// ?shot= staging scenes. Each scene is a REAL render of the game code:
// the state is set up, then the fixed-step sim is played forward honestly
// (steam rises, timers tick) before the screenshot is taken.

import { RECIPES } from './config.js';
import { createState, addParticles, servePlate } from './kitchen.js';
import { spawnTicket } from './orders.js';

function baseScene(seed) {
  const state = createState(seed);
  state.phase = 'play';
  state.coins = 24;
  state.combo = 2;
  state.bestCombo = 3;
  state.served = 2;
  return state;
}

function putOnBurner(state, slot, ing, stage, t) {
  state.burners[slot] = { item: { kind: 'item', ing, state: stage === 'burnt' ? 'burnt' : 'cooked', chop: 0 }, t, stage };
}

export function stageShot(name, seed) {
  const s = seed >>> 0 || 7;

  if (name === 'cover') {
    const state = baseScene(s);
    state.phase = 'title';
    state.coins = 0;
    state.combo = 0;
    state.served = 0;
    spawnTicket(state, 'nasi_goreng');
    spawnTicket(state, 'mie_goreng');
    spawnTicket(state, 'soto_ayam');
    state.tickets.forEach((t) => { t.patience = t.maxPatience; });
    // A pan steaming on a burner, a plate mid-assembly on the counter.
    putOnBurner(state, 0, 'chicken', 'cooking', 2.5);
    state.plate.items = [
      { kind: 'item', ing: 'rice', state: 'cooked', chop: 0 },
      { kind: 'item', ing: 'egg', state: 'cooked', chop: 0 },
    ];
    state.chef.x = 640;
    state.chef.y = 540;
    state.chef.carrying = { kind: 'item', ing: 'chilli', state: 'chopped', chop: 0 };
    return state;
  }

  if (name === 'play') {
    const state = baseScene(s);
    spawnTicket(state, 'nasi_goreng');
    spawnTicket(state, 'gado_gado');
    state.tickets[0].patience = state.tickets[0].maxPatience * 0.7;
    state.tickets[1].patience = state.tickets[1].maxPatience * 0.85;
    // Plate mid-assembly: 2 of 3 items placed.
    state.plate.items = [
      { kind: 'item', ing: 'rice', state: 'cooked', chop: 0 },
      { kind: 'item', ing: 'egg', state: 'cooked', chop: 0 },
    ];
    // A pan steaming on a burner, chopped chilli in hand.
    putOnBurner(state, 0, 'egg', 'cooking', 2.0);
    state.chef.x = 700;
    state.chef.y = 430;
    state.chef.carrying = { kind: 'item', ing: 'chilli', state: 'chopped', chop: 0 };
    state.shiftLeft = 142;
    return state;
  }

  if (name === 'rush') {
    const state = baseScene(s);
    state.coins = 86;
    state.combo = 4;
    state.bestCombo = 5;
    state.served = 6;
    state.shiftLeft = 64;
    state.hearts = 2;
    spawnTicket(state, 'nasi_goreng');
    spawnTicket(state, 'mie_goreng');
    spawnTicket(state, 'soto_ayam');
    spawnTicket(state, 'sate_ayam');
    state.tickets[0].patience = 6;
    state.tickets[1].patience = 9;
    state.tickets[2].patience = 14;
    state.tickets[3].patience = 22;
    // Finished plate ready at the serve window: chef carries it there.
    state.plate.items = [
      { kind: 'item', ing: 'chicken', state: 'cooked', chop: 0 },
      { kind: 'item', ing: 'chilli', state: 'chopped', chop: 0 },
    ];
    state.plateCarried = true;
    state.chef.carrying = { kind: 'plate' };
    state.chef.x = 1050;
    state.chef.y = 430;
    state.chef.dir = 'right';
    putOnBurner(state, 1, 'chicken', 'cooking', 3.5);
    return state;
  }

  if (name === 'served') {
    const state = baseScene(s);
    state.coins = 104;
    state.combo = 5;
    state.bestCombo = 5;
    state.served = 7;
    state.shiftLeft = 96;
    spawnTicket(state, 'mie_goreng');
    spawnTicket(state, 'soto_ayam');
    spawnTicket(state, 'gado_gado');
    state.tickets[0].patience = state.tickets[0].maxPatience * 0.55;
    state.tickets[1].patience = state.tickets[1].maxPatience * 0.8;
    state.tickets[2].patience = state.tickets[2].maxPatience * 0.9;
    // Serve moment: popup + sparkles at the window, chef just served.
    state.chef.x = 1050;
    state.chef.y = 320;
    state.chef.dir = 'right';
    return state;
  }

  return baseScene(s);
}

// After staging a shot, play the sim forward a little so steam, timers and
// the chef settle, then mark the scene ready for the screenshot.
export function settleShot(state, step, audio) {
  if (state.shot === 'served') {
    // Honest serve: build the matching plate and serve it for real, so the
    // "TERSAJI +N KOIN" popup and combo meter come from the real serve path.
    const ticket = state.tickets.find((t) => t.recipe === 'mie_goreng') || state.tickets[0];
    if (ticket) {
      const recipe = RECIPES[ticket.recipe];
      state.plate.items = recipe.needs.map(([ing, st]) => ({ kind: 'item', ing, state: st, chop: 0 }));
      state.plateCarried = true;
      state.chef.carrying = { kind: 'plate' };
      state.chef.x = 1060;
      state.chef.y = 300;
      step(10);
      servePlate(state, audio);
    }
  }
  step(45);
  if (state.shot === 'cover' || state.shot === 'play' || state.shot === 'rush') {
    addParticles(state, 548, 295, 'steam', 6);
  }
  step(10);
}
