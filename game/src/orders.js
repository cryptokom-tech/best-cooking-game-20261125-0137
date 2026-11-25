// Order tickets: generation, patience, spawning and expiry.
// One clear job: the pressure on the order board.

import { MAX_TICKETS, RECIPE_ORDER, spawnInterval, ticketPatience } from './config.js';
import { addPopup, loseHeart } from './kitchen.js';

export function makeTicket(state, recipeId) {
  const progress = 1 - state.shiftLeft / state.shiftTotal;
  const patience = ticketPatience(progress);
  return {
    id: ++state.ticketSeq,
    recipe: recipeId || state.rng.pick(RECIPE_ORDER),
    patience,
    maxPatience: patience,
    warned: false,
  };
}

export function spawnTicket(state, recipeId) {
  if (state.tickets.length >= MAX_TICKETS) return null;
  const ticket = makeTicket(state, recipeId);
  state.tickets.push(ticket);
  return ticket;
}

export function updateOrders(state, dt, audio) {
  if (state.phase !== 'play') return;

  // Spawn new tickets on a shrinking interval as the shift goes on.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (state.tickets.length < MAX_TICKETS) spawnTicket(state);
    const progress = 1 - state.shiftLeft / state.shiftTotal;
    state.spawnTimer = spawnInterval(progress);
  }

  // Patience drains; a ticket at zero costs a heart.
  for (let i = state.tickets.length - 1; i >= 0; i--) {
    const t = state.tickets[i];
    t.patience -= dt;
    if (!t.warned && t.patience < 8) {
      t.warned = true;
      addPopup(state, 640, 130, 'CEPAT! PESANAN HAMPIR HANGUS', '#ff6b5e');
      if (audio) audio.alarm();
    }
    if (t.patience <= 0) {
      state.tickets.splice(i, 1);
      loseHeart(state, 'expired', audio);
      if (state.phase !== 'play') return;
    }
  }
}
