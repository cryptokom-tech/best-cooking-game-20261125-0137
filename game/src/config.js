// GOLDEN LADLE — Dapur Emas Rush: recipes, ingredients, tuning and palette.
// One clear job: every number and name the kitchen runs on lives here.

export const W = 1280;
export const H = 720;
export const SHIFT_SECONDS = 180;
export const MAX_HEARTS = 3;
export const MAX_TICKETS = 4;
export const CHEF_SPEED = 265;
export const DONE_WINDOW = 4; // seconds a cooked dish stays perfect before it burns

export const PALETTE = {
  wall: '#f2dfba',
  wallDark: '#e3c99a',
  floor: '#b98a56',
  floorDark: '#a87a48',
  wood: '#8a5a2e',
  woodDark: '#6e4520',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  cream: '#fff6e0',
  ink: '#3a2415',
  red: '#d23c2e',
  green: '#4d8f3a',
  gold: '#f2b705',
};

export const INGREDIENTS = {
  rice: { name: 'Nasi', color: '#f5ead0', dark: '#d9c69a', chop: 0.9, cook: 4.0 },
  noodle: { name: 'Mie', color: '#f2c14e', dark: '#c98f1f', chop: 0.9, cook: 4.0 },
  egg: { name: 'Telur', color: '#ffe9a8', dark: '#e0b95c', chop: 0.7, cook: 3.5 },
  chicken: { name: 'Ayam', color: '#e8a06a', dark: '#b96a35', chop: 1.0, cook: 5.0 },
  chilli: { name: 'Cabai', color: '#d23c2e', dark: '#8f1d12', chop: 0.6, cook: 3.0 },
  greens: { name: 'Sayur', color: '#5da24a', dark: '#38682c', chop: 0.7, cook: 3.0 },
};

export const INGREDIENT_ORDER = ['rice', 'noodle', 'egg', 'chicken', 'chilli', 'greens'];

// needs: [ingredient, required state]. A plate matches when its items equal
// the recipe's needs as a multiset (same ingredients, same states, no extras).
export const RECIPES = {
  nasi_goreng: {
    name: 'Nasi Goreng', price: 12,
    needs: [['rice', 'cooked'], ['egg', 'cooked'], ['chilli', 'chopped']],
  },
  mie_goreng: {
    name: 'Mie Goreng', price: 12,
    needs: [['noodle', 'cooked'], ['chicken', 'cooked'], ['greens', 'chopped']],
  },
  soto_ayam: {
    name: 'Soto Ayam', price: 14,
    needs: [['chicken', 'cooked'], ['egg', 'cooked'], ['greens', 'chopped']],
  },
  gado_gado: {
    name: 'Gado-Gado', price: 10,
    needs: [['greens', 'chopped'], ['egg', 'chopped'], ['chilli', 'chopped']],
  },
  sate_ayam: {
    name: 'Sate Ayam', price: 14,
    needs: [['chicken', 'cooked'], ['chilli', 'chopped']],
  },
};

export const RECIPE_ORDER = ['nasi_goreng', 'mie_goreng', 'soto_ayam', 'gado_gado', 'sate_ayam'];

export function recipeById(id) {
  return RECIPES[id];
}

// Difficulty ramps with shift progress p in [0, 1].
export function spawnInterval(p) {
  return 14 - 6 * p; // 14s early, 8s late
}
export function ticketPatience(p) {
  return 48 - 18 * p; // 48s early, 30s late
}
