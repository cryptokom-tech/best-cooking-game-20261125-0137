// The chef: keyboard movement, click-to-walk, and counter collision.
// One clear job: where the chef stands and how they get there.

import { CHEF_SPEED } from './config.js';
import { SOLIDS, WALK, nearestStation } from './kitchen.js';

const CHEF_R = 18;

function collides(x, y) {
  for (const s of SOLIDS) {
    if (x > s.x - CHEF_R && x < s.x + s.w + CHEF_R && y > s.y - CHEF_R && y < s.y + s.h + CHEF_R) {
      return true;
    }
  }
  return false;
}

export function moveChef(state, input, dt) {
  const chef = state.chef;
  let vx = 0;
  let vy = 0;

  const keys = input.moveVector();
  if (keys.x !== 0 || keys.y !== 0) {
    vx = keys.x;
    vy = keys.y;
    chef.target = null;
    chef.targetStation = null;
  } else if (chef.target) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 12) {
      // Arrived: if we walked to a station, interact with it once.
      const station = chef.targetStation;
      chef.target = null;
      chef.targetStation = null;
      if (station) {
        // Step the chef a touch closer is unnecessary: interact uses reach.
        return { arrivedAt: station };
      }
    } else {
      vx = dx / d;
      vy = dy / d;
    }
  }

  chef.moving = vx !== 0 || vy !== 0;
  if (chef.moving) {
    if (Math.abs(vx) > Math.abs(vy)) chef.dir = vx > 0 ? 'right' : 'left';
    else chef.dir = vy > 0 ? 'down' : 'up';
  }

  const nx = chef.x + vx * CHEF_SPEED * dt;
  const ny = chef.y + vy * CHEF_SPEED * dt;
  // Axis-separated movement so the chef slides along counters.
  if (!collides(nx, chef.y)) chef.x = nx;
  if (!collides(chef.x, ny)) chef.y = ny;
  chef.x = Math.min(Math.max(chef.x, WALK.x0), WALK.x1);
  chef.y = Math.min(Math.max(chef.y, WALK.y0), WALK.y1);
  return null;
}

// Point the chef at a station (from a mouse click) and walk there.
export function walkToStation(state, station) {
  const cx = station.x + station.w / 2;
  const cy = station.y + station.h / 2;
  // Aim for the closest edge of the station, just outside its solid rect.
  const chef = state.chef;
  let tx = cx;
  let ty = cy;
  if (chef.x < station.x) tx = station.x - 26;
  else if (chef.x > station.x + station.w) tx = station.x + station.w + 26;
  else if (chef.y < station.y) ty = station.y - 26;
  else if (chef.y > station.y + station.h) ty = station.y + station.h + 26;
  chef.target = { x: tx, y: ty };
  chef.targetStation = station;
}

export function nearestStationToChef(state) {
  return nearestStation(state);
}
