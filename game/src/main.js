// GOLDEN LADLE — Dapur Emas Rush: boot, fixed 60 Hz loop, screen machine,
// and window.__game debug hooks (state, step, startGame, setPhase, teleport,
// spawnOrder, forceServe, forceWin, forceOver).

import { RECIPES } from './config.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import {
  createState, resetState, nearestStation, interact, updateKitchen,
  setMessage, servePlate, STATIONS,
} from './kitchen.js';
import { spawnTicket, updateOrders } from './orders.js';
import { moveChef, walkToStation } from './chef.js';
import { drawScene, START_BTN } from './render.js';
import { stageShot, settleShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = new SoundBank();
const input = new Input(canvas);

window.__errors = [];
window.addEventListener('error', (e) => window.__errors.push(String(e.message || e.error)));

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : (Date.now() % 2147483647);
const shotName = params.get('shot');

let state = shotName ? stageShot(shotName, seed) : createState(seed);
state.shot = shotName;
if (shotName) state.spawnTimer = 9999; // staged scenes keep their tickets

function startGame() {
  resetState(state, (Date.now() % 2147483647) || 7);
  state.shot = null;
  audio.click();
}

function endShift() {
  state.phase = 'score';
  if (state.coins > state.topScore) {
    state.topScore = state.coins;
    state.newBest = true;
    try { window.localStorage.setItem('golden-ladle-top', String(state.topScore)); } catch { /* ignore */ }
  }
  audio.fanfare();
}

function update(dt) {
  state.time += dt;

  // Global keys, available in every phase.
  if (input.pressed('KeyM')) {
    state.muted = !state.muted;
    audio.muted = state.muted;
    setMessage(state, state.muted ? 'Suara mati (M untuk hidupkan)' : 'Suara hidup');
  }

  if (state.phase === 'title') {
    if (input.pressed('Enter') || input.pressed('Space')) startGame();
    const click = input.takeClick();
    if (click && click.x >= START_BTN.x && click.x <= START_BTN.x + START_BTN.w
      && click.y >= START_BTN.y && click.y <= START_BTN.y + START_BTN.h) {
      startGame();
    }
    updateKitchen(state, dt, input, audio);
    input.endStep();
    return;
  }

  if (state.phase === 'paused') {
    if (input.pressed('KeyP') || input.pressed('Escape')) state.phase = 'play';
    if (input.pressed('KeyR')) startGame();
    input.endStep();
    return;
  }

  if (state.phase === 'score' || state.phase === 'over') {
    if (input.pressed('KeyR') || input.pressed('Enter') || input.pressed('Space')) startGame();
    const click = input.takeClick();
    if (click) startGame();
    updateKitchen(state, dt, input, audio);
    input.endStep();
    return;
  }

  // --- phase 'play' ---
  if (input.pressed('KeyP') || input.pressed('Escape')) {
    state.phase = 'paused';
    input.endStep();
    return;
  }
  if (input.pressed('KeyR')) {
    startGame();
    return;
  }

  // Mouse: click a station to walk there and interact; click floor to walk.
  const click = input.takeClick();
  if (click) {
    const station = stationAt(click.x, click.y);
    if (station) walkToStation(state, station);
    else {
      state.chef.target = { x: Math.min(Math.max(click.x, 168), 1264), y: Math.min(Math.max(click.y, 150), 704) };
      state.chef.targetStation = null;
    }
  }

  // Keyboard interact.
  if (input.pressed('KeyE')) interact(state, audio);

  // Movement (may auto-interact on arrival at a clicked station).
  const arrived = moveChef(state, input, dt);
  if (arrived && arrived.arrivedAt) interact(state, audio);

  updateKitchen(state, dt, input, audio);
  updateOrders(state, dt, audio);

  // Shift clock.
  state.shiftLeft -= dt;
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    endShift();
  }

  input.endStep();
}

function stationAt(x, y) {
  const all = [...STATIONS.bins, STATIONS.board, STATIONS.stove, STATIONS.assembly, STATIONS.serve, STATIONS.trash];
  for (const s of all) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
  }
  return null;
}

function render() {
  drawScene(ctx, state);
}

// Fixed-step driver: advance the sim n steps of 1/60 s, then render once.
function step(n) {
  for (let i = 0; i < n; i++) update(1 / 60);
  render();
}

// Same, without rendering: for headless driving, where a SwiftShader render
// of a 1280x720 frame can block the renderer for a second and stall input.
function stepRaw(n) {
  for (let i = 0; i < n; i++) update(1 / 60);
}

// RequestAnimationFrame loop with an accumulator; capped so a slow headless
// renderer can never spiral.
let last = performance.now();
let acc = 0;
function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += elapsed;
  let n = 0;
  while (acc >= 1 / 60 && n < 5) {
    update(1 / 60);
    acc -= 1 / 60;
    n++;
  }
  if (n === 5) acc = 0;
  render();
  requestAnimationFrame(frame);
}

// Debug hooks for play-testing and screenshots.
window.__game = {
  state,
  step,
  stepRaw,
  render,
  startGame,
  setPhase(p) {
    state.phase = p;
  },
  teleport(x, y) {
    state.chef.x = x;
    state.chef.y = y;
    state.chef.target = null;
    state.chef.targetStation = null;
  },
  spawnOrder(recipeId) {
    return spawnTicket(state, recipeId);
  },
  forceServe() {
    // Build the first ticket's dish on the plate and serve it for real.
    const ticket = state.tickets[0];
    if (!ticket) return false;
    const recipe = RECIPES[ticket.recipe];
    state.plate.items = recipe.needs.map(([ing, st]) => ({ kind: 'item', ing, state: st, chop: 0 }));
    state.plateCarried = true;
    state.chef.carrying = { kind: 'plate' };
    const before = state.coins;
    servePlate(state, audio);
    return state.coins > before;
  },
  forceWin() {
    state.shiftLeft = 0.5;
  },
  forceOver() {
    state.hearts = 1;
    state.tickets = [];
  },
  nearestStation() {
    const s = nearestStation(state);
    return s ? s.id : null;
  },
};

if (shotName) {
  // Staged scene: settle the sim honestly, then signal readiness.
  settleShot(state, step, audio);
  window.__shotReady = true;
  render();
} else {
  render();
  requestAnimationFrame(frame);
}
