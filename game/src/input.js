// Keyboard + mouse input. Keys are edge-triggered (justPressed is consumed
// once per fixed step); held keys are readable any time. Clicks land on the
// canvas in CSS pixels and are scaled to the 1280x720 game space.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.justPressed = new Set();
    this.click = null; // {x, y} in game coords, consumed by the game
    this.mouse = { x: 0, y: 0 };

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (!e.repeat) this.justPressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.down.clear();
    });
    canvas.addEventListener('mousedown', (e) => {
      const pos = this.toGame(e.clientX, e.clientY);
      this.mouse = pos;
      this.click = pos;
    });
    canvas.addEventListener('mousemove', (e) => {
      this.mouse = this.toGame(e.clientX, e.clientY);
    });
  }

  toGame(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * 1280,
      y: ((clientY - r.top) / r.height) * 720,
    };
  }

  held(code) {
    return this.down.has(code);
  }

  // True once for the step in which the key went down.
  pressed(code) {
    return this.justPressed.has(code);
  }

  takeClick() {
    const c = this.click;
    this.click = null;
    return c;
  }

  // Movement keys currently held, as a normalized {x, y} vector.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down.has('KeyA') || this.down.has('ArrowLeft')) x -= 1;
    if (this.down.has('KeyD') || this.down.has('ArrowRight')) x += 1;
    if (this.down.has('KeyW') || this.down.has('ArrowUp')) y -= 1;
    if (this.down.has('KeyS') || this.down.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  // Called at the end of every fixed step so edges fire exactly once.
  endStep() {
    this.justPressed.clear();
  }
}
