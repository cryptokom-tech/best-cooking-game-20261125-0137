# GOLDEN LADLE — Dapur Emas Rush

![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)
![rank](https://make.fun/badge/best-cooking-game-20261125-0137/cryptokom-tech/best-cooking-game-20261125-0137/rank.svg)
![reward](https://make.fun/badge/best-cooking-game-20261125-0137/cryptokom-tech/best-cooking-game-20261125-0137/reward.svg)

A complete 2D top-down cooking game for the [make.fun best cooking game bounty](https://make.fun/c/best-cooking-game-20261125-0137). Run a warm Indonesian warung-bistro kitchen: take orders from the board, pick ingredients from the pantry, chop them on the board, cook them on two burners (don't let them burn!), assemble dishes on the plate and serve them at the window before patience runs out. Five original recipes, a 3-minute shift, hearts, combos and a score screen.

## Play

Serve it locally and open http://localhost:8080:

```sh
node serve.ts
```

- **WASD / arrows** — move the chef
- **E** — interact (pick up, hold to chop, cook, assemble, serve, trash)
- **Click a station** — the chef walks there and interacts
- **P** — pause, **R** — restart, **M** — mute

## Layout

- `game/index.html` — page shell, `game/style.css` — page styles
- `game/src/config.js` — recipes, ingredients, tuning, palette
- `game/src/random.js` — seeded RNG (the sim never calls `Math.random`)
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/input.js` — keyboard + mouse, edge-triggered
- `game/src/kitchen.js` — stations, world state, interaction, burners
- `game/src/orders.js` — ticket generation, patience, spawning
- `game/src/chef.js` — movement and collision
- `game/src/render.js` — all canvas drawing
- `game/src/shots.js` — `?shot=` staging scenes for the screenshots
- `game/src/main.js` — boot, fixed 60 Hz loop, `window.__game` hooks

All art is drawn in code and all sounds are synthesized — no external assets, no network requests. Screenshots are real renders of the game (`?shot=cover|play|rush|served&seed=7`).

## License

MIT — see [LICENSE](LICENSE).
