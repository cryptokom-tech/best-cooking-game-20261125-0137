// Canvas drawing: kitchen, food, HUD and screens. All art is drawn in code —
// no images, no network. Render uses state.time for animation, never Math.random.

import { W, H, PALETTE, INGREDIENTS, RECIPES, RECIPE_ORDER } from './config.js';
import { STATIONS, BURNERS, plateCompletes } from './kitchen.js';

export const START_BTN = { x: 490, y: 596, w: 300, h: 56 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = weight + ' ' + size + 'px system-ui, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -6, -10, 0, -5);
  ctx.bezierCurveTo(6, -10, 9, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? '#e5484d' : '#5c4632';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = filled ? '#8f1d12' : '#3a2a1c';
  ctx.stroke();
  ctx.restore();
}

function coin(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f2b705';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#a87a00';
  ctx.stroke();
  text(ctx, 'Rp', x, y + 0.5, Math.round(r * 0.85), '#7a5200', 'bold', 'center');
}

// One ingredient icon, drawn by shape. state: raw | chopped | cooked | burnt.
export function drawIngredient(ctx, ing, x, y, r, state = 'raw') {
  const def = INGREDIENTS[ing];
  const burnt = state === 'burnt';
  const cooked = state === 'cooked';
  const base = burnt ? '#2b2118' : cooked ? shade(def.color, -18) : def.color;
  const dark = burnt ? '#171008' : def.dark;
  ctx.save();
  ctx.translate(x, y);
  if (ing === 'rice') {
    // Bowl of rice.
    ctx.beginPath();
    ctx.arc(0, 2, r, 0, Math.PI);
    ctx.fillStyle = '#7a4a21';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -2, r * 0.92, Math.PI, 0);
    ctx.fillStyle = base;
    ctx.fill();
    if (state !== 'raw') {
      ctx.fillStyle = dark;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * r * 0.28, -r * 0.3 + Math.abs(i) * 1.5, r * 0.12, 0, Math.PI * 2); ctx.fill(); }
    }
  } else if (ing === 'noodle') {
    ctx.strokeStyle = base;
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.35 + i * 0.28), Math.PI * (0.15 + i * 0.3), Math.PI * (1.1 + i * 0.2));
      ctx.stroke();
    }
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.14;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, Math.PI * 0.4, Math.PI * 0.9);
    ctx.stroke();
  } else if (ing === 'egg') {
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.78, r, 0, 0, Math.PI * 2);
    ctx.fillStyle = base;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.15, -r * 0.1, r * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = burnt ? '#3a2a18' : cooked ? '#e8892a' : '#f2b705';
    ctx.fill();
  } else if (ing === 'chicken') {
    // Drumstick.
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, r * 0.1, r * 0.72, r * 0.55, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = base;
    ctx.fill();
    ctx.strokeStyle = '#fff6e0';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(r * 0.4, -r * 0.45);
    ctx.lineTo(r * 0.85, -r * 0.9);
    ctx.stroke();
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath();
    ctx.arc(r * 0.9, -r * 0.95, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing === 'chilli') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.1);
    ctx.quadraticCurveTo(0, r * 0.9, r * 0.85, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.3, -r * 0.75, -r * 0.55, -r * 0.25);
    ctx.closePath();
    ctx.fillStyle = base;
    ctx.fill();
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(r * 0.7, -r * 0.5);
    ctx.quadraticCurveTo(r * 1.05, -r * 0.9, r * 0.75, -r * 1.05);
    ctx.stroke();
  } else {
    // Greens: leafy bunch.
    ctx.fillStyle = base;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.45, -i * i * r * 0.1, r * 0.42, r * 0.72, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = dark;
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.5);
    ctx.lineTo(0, r * 0.95);
    ctx.stroke();
  }
  if (state === 'chopped') {
    // Knife-cut marks.
    ctx.strokeStyle = 'rgba(58,36,21,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.4);
    ctx.lineTo(r * 0.4, r * 0.4);
    ctx.moveTo(r * 0.4, -r * 0.4);
    ctx.lineTo(-r * 0.4, r * 0.4);
    ctx.stroke();
  }
  ctx.restore();
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function drawTicket(ctx, t, x, y, time) {
  const recipe = RECIPES[t.recipe];
  const frac = Math.max(0, t.patience / t.maxPatience);
  const low = t.patience < 8;
  const pulse = low ? 1 + Math.sin(time * 10) * 0.03 : 1;
  ctx.save();
  ctx.translate(x + 125, y + 42);
  ctx.scale(pulse, pulse);
  ctx.translate(-125, -42);
  rr(ctx, 0, 0, 250, 84, 10);
  ctx.fillStyle = low ? '#ffe3de' : '#fff6e0';
  ctx.fill();
  ctx.lineWidth = low ? 3 : 2;
  ctx.strokeStyle = low ? '#d23c2e' : '#8a5a2e';
  ctx.stroke();
  text(ctx, '#' + t.id + ' ' + recipe.name, 12, 16, 17, PALETTE.ink);
  recipe.needs.forEach(([ing, st], i) => {
    drawIngredient(ctx, ing, 30 + i * 62, 46, 15, st);
    text(ctx, st === 'cooked' ? 'msk' : 'cinc', 30 + i * 62, 70, 10, '#6e4520', 'bold', 'center');
  });
  // Patience bar.
  rr(ctx, 170, 52, 68, 10, 5);
  ctx.fillStyle = '#e0cba6';
  ctx.fill();
  const barColor = frac > 0.5 ? '#4d8f3a' : frac > 0.25 ? '#e8a13a' : '#d23c2e';
  rr(ctx, 170, 52, Math.max(8, 68 * frac), 10, 5);
  ctx.fillStyle = barColor;
  ctx.fill();
  text(ctx, Math.ceil(t.patience) + 's', 204, 40, 13, barColor, 'bold', 'center');
  ctx.restore();
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = chef.moving ? Math.sin(state.time * 14) * 2 : Math.sin(state.time * 2) * 0.8;
  const x = chef.x;
  const y = chef.y + bob;
  ctx.save();
  // Shadow.
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 20, 20, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(58,36,21,0.25)';
  ctx.fill();
  // Body / apron.
  ctx.beginPath();
  ctx.arc(x, y + 4, 19, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f0e6';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#c9b896';
  ctx.stroke();
  // Apron stripe.
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 14);
  ctx.lineTo(x + 12, y + 14);
  ctx.lineTo(x + 9, y + 20);
  ctx.lineTo(x - 9, y + 20);
  ctx.closePath();
  ctx.fillStyle = '#d23c2e';
  ctx.fill();
  // Head.
  ctx.beginPath();
  ctx.arc(x, y - 16, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c89b';
  ctx.fill();
  // Chef hat.
  ctx.beginPath();
  ctx.ellipse(x, y - 28, 15, 8, 0, Math.PI, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  rr(ctx, x - 15, y - 30, 30, 8, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // Eyes look in the facing direction.
  const ex = chef.dir === 'left' ? -3 : chef.dir === 'right' ? 3 : 0;
  ctx.fillStyle = '#3a2415';
  ctx.beginPath();
  ctx.arc(x - 5 + ex, y - 17, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 5 + ex, y - 17, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Carried item floats above the hat.
  const carrying = chef.carrying;
  if (carrying) {
    ctx.beginPath();
    ctx.arc(x, y - 52, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,246,224,0.92)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8a5a2e';
    ctx.stroke();
    if (carrying.kind === 'plate') {
      ctx.beginPath();
      ctx.ellipse(x, y - 52, 14, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#9aa1ad';
      ctx.stroke();
      state.plate.items.forEach((it, i) => drawIngredient(ctx, it.ing, x - 10 + i * 10, y - 54, 5, it.state));
    } else {
      drawIngredient(ctx, carrying.ing, x, y - 52, 13, carrying.state);
    }
  }
  // Chop progress ring while chopping.
  if (carrying && carrying.kind === 'item' && carrying.state === 'raw' && carrying.chop > 0) {
    ctx.beginPath();
    ctx.arc(x, y - 52, 24, -Math.PI / 2, -Math.PI / 2 + carrying.chop * Math.PI * 2);
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawStations(ctx, state) {
  const time = state.time;
  // --- Pantry bins (left) ---
  for (const bin of STATIONS.bins) {
    const def = INGREDIENTS[bin.ing];
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 8);
    ctx.fillStyle = '#a9713d';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#6e4520';
    ctx.stroke();
    rr(ctx, bin.x + 4, bin.y + 4, bin.w - 8, bin.h - 8, 6);
    ctx.fillStyle = def.color;
    ctx.fill();
    drawIngredient(ctx, bin.ing, bin.x + 30, bin.y + 40, 20, 'raw');
    text(ctx, def.name, bin.x + 58, bin.y + 30, 16, PALETTE.ink);
    text(ctx, 'E: ambil', bin.x + 58, bin.y + 52, 11, '#6e4520');
  }
  text(ctx, 'PANTRY', 78, 150, 13, '#fff6e0', 'bold', 'center');

  // --- Chopping board ---
  const b = STATIONS.board;
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fillStyle = '#8a5a2e';
  ctx.fill();
  ctx.strokeStyle = '#6e4520';
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, b.x + 18, b.y + 22, b.w - 36, b.h - 44, 8);
  ctx.fillStyle = '#e8c98f';
  ctx.fill();
  // Knife.
  ctx.save();
  ctx.translate(b.x + b.w - 48, b.y + 34);
  ctx.rotate(0.5);
  rr(ctx, 0, 0, 46, 9, 4);
  ctx.fillStyle = '#c9ced6';
  ctx.fill();
  rr(ctx, 46, 1, 16, 7, 3);
  ctx.fillStyle = '#3a2415';
  ctx.fill();
  ctx.restore();
  text(ctx, 'TALENAN — tahan E', b.x + b.w / 2, b.y + b.h - 12, 13, '#fff6e0', 'bold', 'center');

  // --- Stove with 2 burners ---
  const s = STATIONS.stove;
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fillStyle = '#3d3a38';
  ctx.fill();
  ctx.strokeStyle = '#241f1d';
  ctx.lineWidth = 2;
  ctx.stroke();
  BURNERS.forEach((bp, i) => {
    const burner = state.burners[i];
    // Flame flicker under a cooking pan.
    if (burner.item && burner.stage === 'cooking') {
      const fl = 1 + Math.sin(time * 16 + i * 3) * 0.12;
      ctx.beginPath();
      ctx.ellipse(bp.x, bp.y + 8, 34 * fl, 12, 0, 0, Math.PI);
      ctx.fillStyle = 'rgba(242,120,40,0.75)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, 46, 0, Math.PI * 2);
    ctx.fillStyle = '#17120e';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = burner.item && burner.stage === 'done' ? '#f2b705' : '#55504c';
    ctx.stroke();
    if (burner.item) {
      // Pan + food.
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 38, 0, Math.PI * 2);
      ctx.fillStyle = '#6b6560';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = '#8f8880';
      ctx.fill();
      drawIngredient(ctx, burner.item.ing, bp.x, bp.y, 19, burner.item.state === 'burnt' ? 'burnt' : burner.item.state);
      if (burner.stage === 'done') {
        text(ctx, 'MATANG!', bp.x, bp.y - 56, 14, '#f2b705', 'bold', 'center');
      } else if (burner.stage === 'burnt') {
        text(ctx, 'GOSONG!', bp.x, bp.y - 56, 14, '#ff6b5e', 'bold', 'center');
      } else {
        // Cook progress ring.
        const cookTime = INGREDIENTS[burner.item.ing].cook;
        const frac = Math.min(1, burner.t / cookTime);
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 42, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.strokeStyle = '#f2b705';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
  });
  text(ctx, 'KOMPOR — 2 tungku', s.x + s.w / 2, s.y + s.h - 10, 13, '#fff6e0', 'bold', 'center');

  // --- Assembly counter ---
  const a = STATIONS.assembly;
  rr(ctx, a.x, a.y, a.w, a.h, 10);
  ctx.fillStyle = PALETTE.steel;
  ctx.fill();
  ctx.strokeStyle = PALETTE.steelDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Plate.
  const px = a.x + a.w / 2;
  const py = a.y + a.h / 2 - 6;
  // When the chef carries the plate, the counter shows an empty plate:
  // the food travels with the chef, never in two places at once.
  const done = !state.plateCarried && plateCompletes(state);
  if (done) {
    ctx.save();
    ctx.shadowColor = '#f2b705';
    ctx.shadowBlur = 18 + Math.sin(time * 6) * 6;
    ctx.beginPath();
    ctx.ellipse(px, py, 72, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    text(ctx, 'SIAP SAJI: ' + RECIPES[done].name.toUpperCase(), px, a.y - 14, 15, '#f2b705', 'bold', 'center');
  } else {
    ctx.beginPath();
    ctx.ellipse(px, py, 72, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#9aa1ad';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  state.plate.items.forEach((it, i) => {
    if (state.plateCarried) return;
    drawIngredient(ctx, it.ing, px - 44 + i * 44, py - 2, 16, it.state);
  });
  text(ctx, 'RAKIT — E: taruh / ambil piring', a.x + a.w / 2, a.y + a.h - 12, 13, PALETTE.ink, 'bold', 'center');

  // --- Serve window ---
  const sv = STATIONS.serve;
  rr(ctx, sv.x, sv.y, sv.w, sv.h, 10);
  ctx.fillStyle = '#7a4a21';
  ctx.fill();
  ctx.strokeStyle = '#5c3615';
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, sv.x + 12, sv.y + 12, sv.w - 24, 84, 8);
  ctx.fillStyle = '#ffe9bd';
  ctx.fill();
  // Bell.
  ctx.beginPath();
  ctx.arc(sv.x + sv.w / 2, sv.y + 52, 16, Math.PI, 0);
  ctx.fillStyle = '#f2b705';
  ctx.fill();
  ctx.fillRect(sv.x + sv.w / 2 - 18, sv.y + 50, 36, 5);
  text(ctx, 'JENDELA SAJI', sv.x + sv.w / 2, sv.y + 116, 16, '#fff6e0', 'bold', 'center');
  text(ctx, 'E: sajikan piring', sv.x + sv.w / 2, sv.y + 140, 12, '#ffd98a', 'bold', 'center');

  // --- Trash ---
  const tr = STATIONS.trash;
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 10);
  ctx.fillStyle = '#5c6066';
  ctx.fill();
  ctx.strokeStyle = '#3d4043';
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, tr.x + 8, tr.y - 8, tr.w - 16, 14, 6);
  ctx.fillStyle = '#7d838a';
  ctx.fill();
  text(ctx, 'SAMPAH', tr.x + tr.w / 2, tr.y + tr.h / 2 + 6, 15, '#ffffff', 'bold', 'center');

  // --- Decorative lower counter with ingredient piles ---
  rr(ctx, 430, 560, 590, 100, 10);
  ctx.fillStyle = '#a9713d';
  ctx.fill();
  ctx.strokeStyle = '#6e4520';
  ctx.stroke();
  text(ctx, 'MEJA BUMBU', 725, 578, 13, '#fff6e0', 'bold', 'center');
  ['rice', 'noodle', 'chilli', 'greens', 'egg', 'chicken'].forEach((ing, i) => {
    drawIngredient(ctx, ing, 480 + i * 95, 622, 20, 'raw');
  });
  // Potted plant.
  ctx.beginPath();
  ctx.arc(1075, 640, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#5da24a';
  ctx.fill();
  rr(ctx, 1055, 648, 40, 22, 5);
  ctx.fillStyle = '#b3552e';
  ctx.fill();
}

function drawOrderBoard(ctx, state) {
  rr(ctx, 8, 8, W - 16, 96, 12);
  ctx.fillStyle = '#5c3615';
  ctx.fill();
  ctx.strokeStyle = '#3a2415';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'PESANAN', 24, 56, 15, '#ffd98a', 'bold');
  if (state.tickets.length === 0) {
    text(ctx, 'Belum ada pesanan — pelanggan segera datang...', 150, 56, 16, '#e8d5b0', 'bold');
  }
  state.tickets.forEach((t, i) => {
    drawTicket(ctx, t, 150 + i * 262, 16, state.time);
  });
}

function drawHUD(ctx, state) {
  const mm = Math.floor(Math.max(0, state.shiftLeft) / 60);
  const ss = Math.floor(Math.max(0, state.shiftLeft) % 60);
  const clock = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  const lowTime = state.shiftLeft < 30 && state.phase === 'play';
  // Coins.
  coin(ctx, 36, 126, 15);
  text(ctx, String(state.coins), 58, 126, 22, '#3a2415');
  text(ctx, 'koin', 58 + String(state.coins).length * 13, 128, 13, '#6e4520');
  // Hearts.
  for (let i = 0; i < 3; i++) heart(ctx, 300 + i * 34, 126, 26, i < state.hearts);
  text(ctx, 'HATI', 300 + 3 * 34 + 8, 126, 13, '#6e4520', 'bold');
  // Combo.
  if (state.combo > 1) {
    text(ctx, 'KOMBO x' + state.combo, 640, 126, 22, '#d23c2e', 'bold', 'center');
  } else {
    text(ctx, 'Dapur Emas Rush', 640, 126, 16, '#6e4520', 'bold', 'center');
  }
  // Shift clock.
  text(ctx, 'SHIFT', 1060, 118, 12, '#6e4520', 'bold', 'center');
  text(ctx, clock, 1060, 138, 24, lowTime ? '#d23c2e' : '#3a2415', 'bold', 'center');
  // Shift progress bar.
  rr(ctx, 1130, 118, 120, 12, 6);
  ctx.fillStyle = '#e0cba6';
  ctx.fill();
  rr(ctx, 1130, 118, 120 * Math.max(0, state.shiftLeft / state.shiftTotal), 12, 6);
  ctx.fillStyle = lowTime ? '#d23c2e' : '#4d8f3a';
  ctx.fill();
  text(ctx, 'Disajikan: ' + state.served, 1190, 140, 12, '#6e4520', 'bold', 'center');
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = 1 - p.t / p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.6 + p.t * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = p.kind === 'steam' ? 'rgba(255,255,255,' + (a * 0.55) + ')'
      : p.kind === 'smoke' ? 'rgba(60,50,45,' + (a * 0.6) + ')'
      : 'rgba(242,183,5,' + a + ')';
    ctx.fill();
  }
  for (const p of state.popups) {
    const a = p.t < 0.3 ? p.t / 0.3 : 1 - Math.max(0, (p.t - 0.9) / 0.7);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    text(ctx, p.text, p.x, p.y, 22, p.color, 'bold', 'center');
    ctx.restore();
  }
}

function drawMessage(ctx, state) {
  if (!state.message) return;
  ctx.save();
  ctx.font = 'bold 16px system-ui, sans-serif';
  const mw = ctx.measureText(state.message).width + 44;
  rr(ctx, 640 - mw / 2, 668, mw, 34, 17);
  ctx.fillStyle = 'rgba(58,36,21,0.88)';
  ctx.fill();
  text(ctx, state.message, 640, 686, 16, '#fff6e0', 'bold', 'center');
  ctx.restore();
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(36,26,18,0.72)';
  ctx.fillRect(0, 0, W, H);
  rr(ctx, 240, 130, 800, 470, 16);
  ctx.fillStyle = '#fff6e0';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f2b705';
  ctx.stroke();
  text(ctx, 'GOLDEN LADLE', 640, 178, 52, '#b8860b', 'bold', 'center');
  text(ctx, 'DAPUR EMAS RUSH', 640, 216, 24, '#d23c2e', 'bold', 'center');
  text(ctx, 'Masak pesanan pelanggan sebelum waktunya habis!', 640, 248, 16, PALETTE.ink, 'bold', 'center');
  text(ctx, 'Ambil bahan - cincang - masak - rakit - sajikan. 3 hati, shift 3 menit.', 640, 272, 14, '#6e4520', 'bold', 'center');
  // Recipe card.
  text(ctx, 'MENU HARI INI', 300, 308, 14, '#8a5a2e', 'bold');
  RECIPE_ORDER.forEach((id, i) => {
    const r = RECIPES[id];
    const y = 332 + i * 30;
    text(ctx, r.name, 300, y, 15, PALETTE.ink, 'bold');
    r.needs.forEach(([ing, st], j) => {
      drawIngredient(ctx, ing, 480 + j * 52, y, 12, st);
      text(ctx, st === 'cooked' ? 'masak' : 'cincang', 480 + j * 52, y + 16, 9, '#6e4520', 'bold', 'center');
    });
    text(ctx, r.price + ' koin', 700, y, 14, '#b8860b', 'bold');
  });
  text(ctx, 'WASD / panah: jalan    E: ambil / cincang (tahan) / masak / rakit / sajikan', 640, 500, 14, PALETTE.ink, 'bold', 'center');
  text(ctx, 'Klik stasiun: chef jalan sendiri    P: jeda    R: ulang    M: bisu', 640, 524, 14, PALETTE.ink, 'bold', 'center');
  // Start button.
  const pulse = 1 + Math.sin(state.time * 4) * 0.02;
  ctx.save();
  ctx.translate(640, START_BTN.y + START_BTN.h / 2);
  ctx.scale(pulse, pulse);
  rr(ctx, -START_BTN.w / 2, -START_BTN.h / 2, START_BTN.w, START_BTN.h, 12);
  ctx.fillStyle = '#f2b705';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#a87a00';
  ctx.stroke();
  text(ctx, 'MULAI MEMASAK', 0, 1, 22, '#3a2415', 'bold', 'center');
  ctx.restore();
  text(ctx, 'atau tekan ENTER', 640, 668, 13, '#6e4520', 'bold', 'center');
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(36,26,18,0.6)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'JEDA', 640, 330, 56, '#fff6e0', 'bold', 'center');
  text(ctx, 'Tekan P untuk lanjut  |  R untuk mulai ulang', 640, 380, 18, '#ffd98a', 'bold', 'center');
}

function drawScore(ctx, state, over) {
  ctx.fillStyle = 'rgba(36,26,18,0.72)';
  ctx.fillRect(0, 0, W, H);
  rr(ctx, 340, 170, 600, 380, 16);
  ctx.fillStyle = '#fff6e0';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f2b705';
  ctx.stroke();
  text(ctx, over ? 'DAPUR TUTUP!' : 'SHIFT SELESAI!', 640, 220, 44, over ? '#d23c2e' : '#b8860b', 'bold', 'center');
  text(ctx, over ? 'Semua hati habis. Pelanggan kecewa...' : 'Kerja bagus, Chef! Dapur emas bersinar.', 640, 258, 16, PALETTE.ink, 'bold', 'center');
  const rows = [
    ['Koin', String(state.coins)],
    ['Hidangan disajikan', String(state.served)],
    ['Kombo terbaik', 'x' + state.bestCombo],
    ['Skor terbaik', String(state.topScore) + (state.newBest ? '  (REKOR BARU!)' : '')],
  ];
  rows.forEach(([label, value], i) => {
    const y = 310 + i * 40;
    text(ctx, label, 420, y, 18, '#6e4520', 'bold');
    text(ctx, value, 860, y, 20, PALETTE.ink, 'bold', 'right');
  });
  text(ctx, 'Tekan R untuk main lagi', 640, 500, 18, '#d23c2e', 'bold', 'center');
}

export function drawScene(ctx, state) {
  ctx.save();
  if (state.shake > 0) {
    const s = state.shake;
    ctx.translate(Math.sin(state.time * 47) * s * 0.4, Math.cos(state.time * 39) * s * 0.4);
  }
  // Wall + floor.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = PALETTE.wallDark;
  for (let x = 0; x < W; x += 64) ctx.fillRect(x, 146, 32, 4);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 150, W, H - 150);
  ctx.fillStyle = PALETTE.floorDark;
  for (let y = 190; y < H; y += 80) ctx.fillRect(0, y, W, 3);
  for (let x = 0; x < W; x += 110) ctx.fillRect(x, 150, 3, H - 150);

  drawStations(ctx, state);
  drawChef(ctx, state);
  drawParticles(ctx, state);
  drawOrderBoard(ctx, state);
  drawHUD(ctx, state);
  drawMessage(ctx, state);

  if (state.phase === 'title') drawTitle(ctx, state);
  else if (state.phase === 'paused') drawPause(ctx);
  else if (state.phase === 'score') drawScore(ctx, state, false);
  else if (state.phase === 'over') drawScore(ctx, state, true);
  ctx.restore();
}
