// Kitchen layout, world state, station interaction and burner/chop updates.
// One clear job: where everything in the kitchen is and what E does there.

import { W, H, SHIFT_SECONDS, MAX_HEARTS, INGREDIENTS, INGREDIENT_ORDER, RECIPES, DONE_WINDOW } from './config.js';
import { makeRng } from './random.js';

export const STATIONS = {
  bins: INGREDIENT_ORDER.map((ing, i) => ({
    id: 'bin-' + ing, kind: 'bin', ing, x: 16, y: 158 + i * 89, w: 124, h: 80,
  })),
  board: { id: 'board', kind: 'board', x: 220, y: 250, w: 210, h: 120 },
  stove: { id: 'stove', kind: 'stove', x: 480, y: 240, w: 260, h: 130 },
  assembly: { id: 'assembly', kind: 'assembly', x: 800, y: 250, w: 220, h: 120 },
  serve: { id: 'serve', kind: 'serve', x: 1080, y: 200, w: 184, h: 160 },
  trash: { id: 'trash', kind: 'trash', x: 1120, y: 560, w: 110, h: 100 },
};

// Burner hotplates on the stove, in game coordinates.
export const BURNERS = [
  { x: 548, y: 305 },
  { x: 672, y: 305 },
];

// Rects the chef cannot walk through (counters and the bin wall is the edge).
export const SOLIDS = [
  STATIONS.board, STATIONS.stove, STATIONS.assembly, STATIONS.serve, STATIONS.trash,
];

export const WALK = { x0: 168, y0: 150, x1: 1264, y1: 704 };

export function createState(seed) {
  const rng = makeRng(seed >>> 0 || 1);
  let topScore = 0;
  try {
    topScore = Number(window.localStorage.getItem('golden-ladle-top') || 0) || 0;
  } catch { topScore = 0; }
  return {
    seed,
    rng,
    phase: 'title', // title | play | paused | score | over
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    shiftTotal: SHIFT_SECONDS,
    hearts: MAX_HEARTS,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    tickets: [],
    ticketSeq: 0,
    spawnTimer: 1.5,
    burners: [
      { item: null, t: 0, stage: 'empty' },
      { item: null, t: 0, stage: 'empty' },
    ],
    plate: { items: [] },
    plateCarried: false,
    chef: { x: 640, y: 540, dir: 'down', moving: false, carrying: null, target: null, targetStation: null },
    particles: [],
    popups: [],
    shake: 0,
    message: '',
    messageT: 0,
    muted: false,
    topScore,
    newBest: false,
    shot: null,
  };
}

export function resetState(state, seed) {
  const fresh = createState(seed);
  for (const k of Object.keys(fresh)) state[k] = fresh[k];
  state.phase = 'play';
}

function distToRect(x, y, r) {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
  const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

// Nearest station to the chef within reach, or null.
export function nearestStation(state) {
  const { x, y } = state.chef;
  let best = null;
  let bestD = 115;
  const all = [...STATIONS.bins, STATIONS.board, STATIONS.stove, STATIONS.assembly, STATIONS.serve, STATIONS.trash];
  for (const s of all) {
    const d = distToRect(x, y, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function setMessage(state, text, seconds = 2) {
  state.message = text;
  state.messageT = seconds;
}

export function addPopup(state, x, y, text, color = '#f2b705') {
  state.popups.push({ x, y, text, color, t: 0, life: 1.6 });
}

export function addParticles(state, x, y, kind, n) {
  for (let i = 0; i < n; i++) {
    state.particles.push({
      x: x + state.rng.range(-14, 14),
      y: y + state.rng.range(-8, 8),
      vx: state.rng.range(-12, 12),
      vy: kind === 'steam' ? state.rng.range(-46, -22) : state.rng.range(-70, -30),
      t: 0,
      life: state.rng.range(0.7, 1.4),
      size: state.rng.range(4, 10),
      kind,
    });
  }
}

export function loseHeart(state, reason, audio) {
  state.hearts -= 1;
  state.combo = 0;
  state.shake = 14;
  if (audio) audio.buzz();
  if (reason === 'wrong') addPopup(state, 640, 300, 'SALAH! -1 HATI', '#ff6b5e');
  else if (reason === 'expired') addPopup(state, 640, 300, 'PESANAN HANGUS! -1 HATI', '#ff6b5e');
  else addPopup(state, 640, 300, '-1 HATI', '#ff6b5e');
  if (state.hearts <= 0) {
    state.hearts = 0;
    state.phase = 'over';
    if (state.coins > state.topScore) {
      state.topScore = state.coins;
      state.newBest = true;
      try { window.localStorage.setItem('golden-ladle-top', String(state.topScore)); } catch { /* ignore */ }
    }
  }
}

// Does the plate's item multiset equal this recipe's needs exactly?
export function plateMatchesRecipe(items, recipeId) {
  const needs = RECIPES[recipeId].needs;
  if (items.length !== needs.length) return false;
  const have = items.map((it) => it.ing + ':' + it.state).sort().join('|');
  const want = needs.map(([ing, st]) => ing + ':' + st).sort().join('|');
  return have === want;
}

// Recipe id the current plate completes, or null.
export function plateCompletes(state) {
  for (const id of Object.keys(RECIPES)) {
    if (plateMatchesRecipe(state.plate.items, id)) return id;
  }
  return null;
}

export function servePlate(state, audio) {
  if (!state.chef.carrying || state.chef.carrying.kind !== 'plate') return;
  if (state.plate.items.length === 0) {
    setMessage(state, 'Piring kosong — rakit hidangan dulu!');
    return;
  }
  const match = plateCompletes(state);
  if (match) {
    const ticket = state.tickets.find((t) => t.recipe === match);
    const recipe = RECIPES[match];
    const patienceBonus = ticket ? Math.round((ticket.patience / ticket.maxPatience) * 8) : 0;
    const comboBonus = Math.min(state.combo, 5);
    const earned = recipe.price + patienceBonus + comboBonus;
    state.coins += earned;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    if (ticket) state.tickets.splice(state.tickets.indexOf(ticket), 1);
    addPopup(state, 1120, 190, 'TERSAJI +' + earned + ' KOIN', '#f2b705');
    addPopup(state, 1120, 220, state.combo > 1 ? 'KOMBO x' + state.combo : 'ENAK!', '#7ee787');
    addParticles(state, 1170, 240, 'spark', 14);
    if (audio) audio.ding();
    state.plate.items = [];
    state.plateCarried = false;
    state.chef.carrying = null;
  } else {
    state.plate.items = [];
    state.plateCarried = false;
    state.chef.carrying = null;
    loseHeart(state, 'wrong', audio);
  }
}

// What pressing E does at the nearest station.
export function interact(state, audio) {
  const chef = state.chef;
  const station = nearestStation(state);
  if (!station) {
    setMessage(state, 'Dekati stasiun dulu!');
    return;
  }
  const carrying = chef.carrying;

  if (station.kind === 'bin') {
    if (carrying) {
      setMessage(state, 'Tangan penuh! Letakkan dulu.');
      return;
    }
    chef.carrying = { kind: 'item', ing: station.ing, state: 'raw', chop: 0 };
    if (audio) audio.pickup();
    return;
  }

  if (station.kind === 'board') {
    if (carrying && carrying.kind === 'item' && carrying.state === 'raw') {
      setMessage(state, 'Tahan E untuk mencincang!');
    } else if (carrying) {
      setMessage(state, 'Sudah siap — masak atau rakit!');
    } else {
      setMessage(state, 'Ambil bahan dari pantry dulu.');
    }
    return;
  }

  if (station.kind === 'stove') {
    if (carrying && carrying.kind === 'item') {
      if (carrying.state === 'raw') {
        setMessage(state, 'Cincang dulu di talenan!');
        return;
      }
      if (carrying.state === 'burnt') {
        setMessage(state, 'Gosong! Buang ke tempat sampah.');
        return;
      }
      const free = state.burners.find((b) => b.item === null);
      if (!free) {
        setMessage(state, 'Kompor penuh!');
        return;
      }
      free.item = carrying;
      free.t = 0;
      free.stage = 'cooking';
      chef.carrying = null;
      if (audio) audio.sizzle();
      return;
    }
    if (carrying && carrying.kind === 'plate') {
      setMessage(state, 'Piring tidak dimasak!');
      return;
    }
    // Empty hands: pick up a finished or burnt pan.
    const ready = state.burners.find((b) => b.item && (b.stage === 'done' || b.stage === 'burnt'));
    if (ready) {
      chef.carrying = ready.item;
      ready.item = null;
      ready.t = 0;
      ready.stage = 'empty';
      if (audio) audio.pickup();
      return;
    }
    if (state.burners.some((b) => b.item)) setMessage(state, 'Masih dimasak... sabar!');
    else setMessage(state, 'Taruh bahan cincang di kompor.');
    return;
  }

  if (station.kind === 'assembly') {
    if (carrying && carrying.kind === 'item') {
      if (carrying.state === 'raw') {
        setMessage(state, 'Cincang dulu di talenan!');
        return;
      }
      if (carrying.state === 'burnt') {
        setMessage(state, 'Gosong! Buang ke tempat sampah.');
        return;
      }
      if (state.plate.items.length >= 3) {
        setMessage(state, 'Piring penuh (maks 3)!');
        return;
      }
      state.plate.items.push(carrying);
      chef.carrying = null;
      if (audio) audio.pickup();
      const done = plateCompletes(state);
      if (done) {
        addPopup(state, 910, 230, 'SIAP SAJI: ' + RECIPES[done].name.toUpperCase(), '#7ee787');
        if (audio) audio.ding();
      }
      return;
    }
    if (carrying && carrying.kind === 'plate') {
      state.plateCarried = false;
      chef.carrying = null;
      if (audio) audio.pickup();
      return;
    }
    // Empty hands: pick up the plate if it has food on it.
    if (state.plate.items.length > 0) {
      state.plateCarried = true;
      chef.carrying = { kind: 'plate' };
      if (audio) audio.pickup();
      return;
    }
    setMessage(state, 'Rakit hidangan di piring ini.');
    return;
  }

  if (station.kind === 'serve') {
    if (carrying && carrying.kind === 'plate') {
      servePlate(state, audio);
      return;
    }
    if (carrying) {
      setMessage(state, 'Rakit di piring dulu, baru sajikan!');
      return;
    }
    setMessage(state, 'Bawa piring hidangan ke sini.');
    return;
  }

  if (station.kind === 'trash') {
    if (carrying && carrying.kind === 'item') {
      chef.carrying = null;
      addPopup(state, 1175, 540, 'DIBUANG', '#9aa1ad');
      if (audio) audio.click();
      return;
    }
    if (carrying && carrying.kind === 'plate') {
      state.plate.items = [];
      setMessage(state, 'Isi piring dibuang.');
      return;
    }
    setMessage(state, 'Tidak ada yang dibuang.');
  }
}

// Per-frame kitchen updates: chopping, burners, particles, popups, shake.
export function updateKitchen(state, dt, input, audio) {
  const chef = state.chef;

  // Chopping: hold E near the board while carrying a raw ingredient.
  const nearBoard = nearestStation(state) === STATIONS.board;
  const item = chef.carrying && chef.carrying.kind === 'item' ? chef.carrying : null;
  if (item && item.state === 'raw' && nearBoard && input.held('KeyE')) {
    item.chop += dt / INGREDIENTS[item.ing].chop;
    if (item.chop >= 1) {
      item.chop = 0;
      item.state = 'chopped';
      addPopup(state, chef.x, chef.y - 50, 'DICINCANG!', '#7ee787');
      if (audio) audio.thock();
    }
  }

  // Burners: cook, then a done window, then burnt.
  for (let i = 0; i < state.burners.length; i++) {
    const b = state.burners[i];
    if (!b.item) continue;
    b.t += dt;
    const cookTime = INGREDIENTS[b.item.ing].cook;
    if (b.stage === 'cooking' && b.t >= cookTime) {
      b.stage = 'done';
      b.item.state = 'cooked';
      addPopup(state, BURNERS[i].x, BURNERS[i].y - 60, 'MATANG!', '#f2b705');
      if (audio) audio.ding();
    } else if (b.stage === 'done' && b.t >= cookTime + DONE_WINDOW) {
      b.stage = 'burnt';
      b.item.state = 'burnt';
      state.shake = 10;
      addPopup(state, BURNERS[i].x, BURNERS[i].y - 60, 'GOSONG!', '#ff6b5e');
      addParticles(state, BURNERS[i].x, BURNERS[i].y, 'smoke', 10);
      if (audio) audio.buzz();
    }
    // Steam / smoke ambience.
    if ((b.stage === 'cooking' || b.stage === 'done') && state.rng.chance(dt * 6)) {
      addParticles(state, BURNERS[i].x, BURNERS[i].y - 10, 'steam', 1);
    }
    if (b.stage === 'burnt' && state.rng.chance(dt * 4)) {
      addParticles(state, BURNERS[i].x, BURNERS[i].y - 10, 'smoke', 1);
    }
    if (b.stage === 'cooking' && state.rng.chance(dt * 1.2) && audio) audio.sizzle();
  }

  // Particles.
  for (const p of state.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy -= 12 * dt;
  }
  state.particles = state.particles.filter((p) => p.t < p.life);

  // Floating popups.
  for (const p of state.popups) {
    p.t += dt;
    p.y -= 34 * dt;
  }
  state.popups = state.popups.filter((p) => p.t < p.life);

  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
  if (state.messageT > 0) {
    state.messageT -= dt;
    if (state.messageT <= 0) state.message = '';
  }
}

export { W, H };
