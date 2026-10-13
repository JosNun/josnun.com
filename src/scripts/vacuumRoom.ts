// The living room behind the Vacuum Simulator page's hero: the game's starter upright mowing stripes into a mint
// carpet, its cord trailing back to the outlet, while a few bumper bots wander about picking up crumbs.
//
// Everything is drawn in whole game pixels on a small canvas that CSS scales up by a whole number (pixelated).
// The sprites are the game's own, exported by vac-sim's promo/siteArt.ts; the carpet follows the game's floor
// renderer (the same ramps, fibre noise and sheen rule), so the stripes look like the game's.
//
// It runs only while the room is on screen and the tab is visible, at 30 fps, and draws one still frame when
// the visitor prefers reduced motion.

import art from '../data/vacuum-simulator-art.json';

const SPRITES = '/projects/vacuum-simulator/sprites/';

// ---------------------------------------------------------------- the game's noise (sim/rng.ts)

function hash2(x: number, y: number, salt = 0): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt | 0, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, salt = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, salt), b = hash2(xi + 1, yi, salt);
  const c = hash2(xi, yi + 1, salt), d = hash2(xi + 1, yi + 1, salt);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// ---------------------------------------------------------------- colours

type RGB = [number, number, number];
const rgb = (hex: string): RGB => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const pack = ([r, g, b]: RGB): number => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const CLEAN = art.carpet.clean.map((h) => pack(rgb(h)));
const LIVED = art.carpet.lived.map(rgb);
const DUSTY = [pack(LIVED[2]), pack(LIVED[1])];
const SPECK = [pack(LIVED[0]), pack(mix(rgb(art.carpet.lint), LIVED[2], 0.45)), pack(rgb(art.carpet.speck)), pack(rgb(art.carpet.crumb))];

const WALL = {
  out: '#2a2033',
  capL: '#fbe8d0',
  cap: '#ecc9a6',
  capD: '#d9b18e',
  trim: '#9a6650',
  paper: '#f7d9cf',
  paperD: '#ecc3b8',
  base: '#fff1dc',
};
const CORD_CORE = art.cord.core;
const CORD_SHADE = art.cord.shade;
const CORD_SHADOW = art.cord.shadow;

// ---------------------------------------------------------------- tuning

/** Game px a second. The game's vacuum tops out at 72; this one takes its time. */
const VAC_SPEED = 30;
/** The Floor head's cleaning footprint: across and along the direction of travel (game px). */
const FOOT_ACROSS = 12;
const FOOT_ALONG = 5;
/** Lanes this far apart (a little overlap, as a careful player mows). */
const LANE = 22;
/** How far behind the head the handle's end is, where the cord comes out. */
const HANDLE = 27;
const ROBOT_SPEED = 20;
const ROBOT_R = 7;
const ROBOT_MOUTH = 5;
const ROBOT_TURN = 3;
/** Carpet pixels that collect a speck of dust again each tick: stripes soften over a few minutes and get mown again. */
const SETTLE_PER_TICK = 4;
const TICK = 1 / 30;

// ---------------------------------------------------------------- loading

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

let sprites: Promise<{ vacuum: HTMLImageElement; robots: HTMLImageElement; debris: HTMLImageElement; bits: HTMLImageElement }> | null = null;
function loadSprites() {
  sprites ??= Promise.all(['vacuum-starter', 'robots', 'debris', 'bits'].map((n) => loadImage(`${SPRITES}${n}.png`))).then(
    ([vacuum, robots, debris, bits]) => ({ vacuum, robots, debris, bits }),
  );
  return sprites;
}

// ---------------------------------------------------------------- the room

interface Pt { x: number; y: number }
interface Rect { x0: number; y0: number; x1: number; y1: number }

interface Robot {
  x: number; y: number; a: number;
  row: number;
  state: 'drive' | 'turn';
  turnLeft: number;
  boink: number; bx: number; by: number;
  brushT: number;
  target: Crumb | null;
}

interface Crumb { x: number; y: number; cell: number; dropped: boolean }
interface Sparkle { x: number; y: number; t: number; big: boolean }

type Sprites = Awaited<ReturnType<typeof loadSprites>>;

class Room {
  readonly W: number;
  readonly H: number;
  /** Walls: top (with its face), sides and bottom, game px. */
  readonly T = 15;
  readonly S = 5;
  readonly B = 5;
  private readonly g: CanvasRenderingContext2D;
  private readonly carpet: HTMLCanvasElement;
  private readonly cg: CanvasRenderingContext2D;
  private readonly img: ImageData;
  private readonly buf: Uint32Array;
  private readonly dirt: Uint8Array;
  private readonly sheen: Int8Array;
  private readonly fib: Int8Array;
  private readonly mott: Uint8Array;
  private readonly rank: Uint8Array;
  private dirty: Rect | null = null;
  private readonly outlet: Pt;
  private readonly obstacles: Rect[];

  // The vacuum.
  private path: Pt[] = [];
  private pathAt = 0;
  private pass = 0;
  private vx = 0;
  private vy = 0;
  private heading = -Math.PI / 2;
  // The cord: a rope of points from the outlet (0) to the handle (last).
  private readonly cx: Float32Array;
  private readonly cy: Float32Array;
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private readonly seg: number;
  private readonly cordMark: Uint8Array;
  private readonly cordPix: number[] = [];

  private readonly robots: Robot[] = [];
  private crumbs: Crumb[] = [];
  private sparkles: Sparkle[] = [];
  private clock = 0;
  private nextCrumb = 4;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    W: number,
    H: number,
    private readonly sp: Sprites,
    /** Rects (game px) the robots treat as furniture: the page's card over the room. */
    obstacles: Rect[],
    private readonly seed: number,
  ) {
    this.W = W;
    this.H = H;
    canvas.width = W;
    canvas.height = H;
    this.g = canvas.getContext('2d')!;
    this.g.imageSmoothingEnabled = false;
    this.carpet = document.createElement('canvas');
    this.carpet.width = W;
    this.carpet.height = H;
    this.cg = this.carpet.getContext('2d')!;
    this.img = this.cg.createImageData(W, H);
    this.buf = new Uint32Array(this.img.data.buffer);
    const n = W * H;
    this.dirt = new Uint8Array(n);
    this.sheen = new Int8Array(n);
    this.fib = new Int8Array(n);
    this.mott = new Uint8Array(n);
    this.rank = new Uint8Array(n);
    this.cordMark = new Uint8Array(n);
    this.obstacles = obstacles;

    // The carpet as the game bakes a short carpet (render/floorRenderer.ts): fibre streaks, mottle, a patchy nap.
    for (let y = this.T; y < H - this.B; y++)
      for (let x = this.S; x < W - this.S; x++) {
        const i = y * W + x;
        const v = hash2(x, Math.floor((y + hash2(x, 4, 4) * 9) / 4), 11);
        this.fib[i] = v < 0.2 ? 1 : v > 0.93 ? -1 : 0;
        this.mott[i] = valueNoise(x / 10, y / 10, 12) > 0.6 ? 1 : 0;
        this.sheen[i] = Math.round((valueNoise(x / 9, y / 9, 7) - 0.5) * 60);
        this.rank[i] = Math.floor(hash2(x, y, 29) * 255);
        this.dirt[i] = 1;
        this.buf[i] = this.colorAt(i);
      }
    this.outlet = { x: Math.round(W * 0.5 + (seed % 2 ? -1 : 1) * Math.min(60, W * 0.18)), y: this.T };
    this.drawWalls();
    this.cg.putImageData(this.img, 0, 0);

    // The cord: long enough to reach the far corners, lying in a loose curve to start.
    const far = Math.max(
      Math.hypot(this.outlet.x - this.S, H - this.B - this.outlet.y),
      Math.hypot(W - this.S - this.outlet.x, H - this.B - this.outlet.y),
    );
    const length = far * 1.12 + HANDLE;
    const count = Math.max(24, Math.ceil(length / 5));
    this.seg = length / (count - 1);
    this.cx = new Float32Array(count);
    this.cy = new Float32Array(count);
    this.px = new Float32Array(count);
    this.py = new Float32Array(count);

    this.newPass(true);
    const start = this.path[0];
    this.vx = start.x;
    this.vy = start.y;
    const hx = start.x, hy = start.y + HANDLE;
    for (let k = 0; k < count; k++) {
      const t = k / (count - 1);
      const sway = Math.sin(t * Math.PI * 2.2) * 18 * Math.sin(t * Math.PI);
      this.cx[k] = this.px[k] = this.outlet.x + (hx - this.outlet.x) * t + sway;
      this.cy[k] = this.py[k] = this.outlet.y + 2 + (hy - this.outlet.y) * t;
    }

    // The crew: two or three bumper bots, away from the card.
    const crew = W * H > 60000 ? 3 : 2;
    for (let r = 0; r < crew; r++) {
      let x = 0, y = 0;
      for (let tries = 0; tries < 60; tries++) {
        x = this.S + 12 + hash2(r, tries, seed) * (W - 2 * this.S - 24);
        y = this.T + 12 + hash2(tries, r, seed + 3) * (H - this.T - this.B - 24);
        if (!this.blocked(x, y, ROBOT_R + 3, null) && Math.hypot(x - this.vx, y - this.vy) > 40) break;
      }
      this.robots.push({ x, y, a: hash2(r, 9, seed) * Math.PI * 2, row: r % 3, state: 'drive', turnLeft: 0, boink: 0, bx: 0, by: 0, brushT: r * 0.05, target: null });
    }
    for (let k = 0; k < 6; k++) this.spawnCrumb(false);
  }

  // -------------------------------------------------------------- carpet

  private colorAt(i: number): number {
    if (this.dirt[i]) {
      const r = this.rank[i];
      if (r < 11) return SPECK[r & 3];
      return DUSTY[this.mott[i]];
    }
    const s = this.sheen[i];
    const base = s > 25 ? 3 : s < -25 ? 1 : 2;
    return CLEAN[Math.max(0, Math.min(4, base + this.fib[i]))];
  }

  private touch(x0: number, y0: number, x1: number, y1: number): void {
    const d = this.dirty;
    if (!d) this.dirty = { x0, y0, x1, y1 };
    else {
      d.x0 = Math.min(d.x0, x0); d.y0 = Math.min(d.y0, y0);
      d.x1 = Math.max(d.x1, x1); d.y1 = Math.max(d.y1, y1);
    }
  }

  private inCarpet(x: number, y: number): boolean {
    return x >= this.S && y >= this.T && x < this.W - this.S && y < this.H - this.B;
  }

  /** The Floor head's pass over the carpet: Grime gone, the pile brushed the way it's going (the game's sheen rule). */
  private stampHead(x: number, y: number, a: number): void {
    const fx = Math.cos(a), fy = Math.sin(a);
    const sheen = Math.round((fx * 0.25 + fy * 0.97) * 127);
    const R = FOOT_ACROSS + 1;
    const x0 = Math.max(this.S, Math.floor(x - R)), x1 = Math.min(this.W - this.S, Math.ceil(x + R));
    const y0 = Math.max(this.T, Math.floor(y - R)), y1 = Math.min(this.H - this.B, Math.ceil(y + R));
    const W = this.W;
    for (let py = y0; py < y1; py++)
      for (let px = x0; px < x1; px++) {
        const dx = px + 0.5 - x, dy = py + 0.5 - y;
        const along = dx * fx + dy * fy, across = -dx * fy + dy * fx;
        if (Math.abs(along) > FOOT_ALONG || Math.abs(across) > FOOT_ACROSS) continue;
        const i = py * W + px;
        this.dirt[i] = 0;
        this.sheen[i] = sheen;
        this.buf[i] = this.colorAt(i);
      }
    this.touch(x0, y0, x1, y1);
  }

  /** A robot's round mouth: it cleans about half the pixels it passes, so its path shows fainter than the upright's stripes. */
  private stampRobot(x: number, y: number, a: number): void {
    const sheen = Math.round((Math.cos(a) * 0.25 + Math.sin(a) * 0.97) * 127);
    const R = ROBOT_MOUTH;
    const x0 = Math.max(this.S, Math.floor(x - R)), x1 = Math.min(this.W - this.S, Math.ceil(x + R));
    const y0 = Math.max(this.T, Math.floor(y - R)), y1 = Math.min(this.H - this.B, Math.ceil(y + R));
    for (let py = y0; py < y1; py++)
      for (let px = x0; px < x1; px++) {
        if (hash2(px, py, 5) < 0.45) continue;
        const dx = px + 0.5 - x, dy = py + 0.5 - y;
        if (dx * dx + dy * dy > R * R) continue;
        const i = py * this.W + px;
        this.dirt[i] = 0;
        this.sheen[i] = sheen;
        this.buf[i] = this.colorAt(i);
      }
    this.touch(x0, y0, x1, y1);
  }

  /** Dust settles again, a speck at a time. */
  private settle(): void {
    const cw = this.W - 2 * this.S, ch = this.H - this.T - this.B;
    for (let k = 0; k < SETTLE_PER_TICK; k++) {
      const x = this.S + Math.floor(Math.random() * cw), y = this.T + Math.floor(Math.random() * ch);
      const i = y * this.W + x;
      if (this.dirt[i]) continue;
      this.dirt[i] = 1;
      this.buf[i] = this.colorAt(i);
      this.touch(x, y, x + 1, y + 1);
    }
  }

  private flushCarpet(): void {
    const d = this.dirty;
    if (!d) return;
    this.cg.putImageData(this.img, 0, 0, d.x0, d.y0, d.x1 - d.x0, d.y1 - d.y0);
    this.dirty = null;
  }

  private drawWalls(): void {
    const { W, H, T, S, B, buf } = this;
    const set = (x: number, y: number, hex: string) => {
      if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = pack(rgb(hex));
    };
    const fill = (x0: number, y0: number, w: number, h: number, hex: string) => {
      const c = pack(rgb(hex));
      for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++)
        for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) buf[y * W + x] = c;
    };
    // The north wall: its cap, a wallpapered face with a pinstripe, and the skirting.
    fill(0, 0, W, 4, WALL.capL);
    fill(0, 3, W, 1, WALL.capD);
    fill(0, 4, W, T - 6, WALL.paper);
    for (let x = 2; x < W; x += 6) fill(x, 5, 1, T - 8, WALL.paperD);
    fill(0, T - 3, W, 2, WALL.base);
    fill(0, T - 1, W, 1, WALL.trim);
    // West, east and south walls: the cap seen from above.
    fill(0, T, S, H - T, WALL.capL);
    fill(S - 1, T, 1, H - T - B + 1, WALL.capD);
    fill(W - S, T, S, H - T, WALL.capL);
    fill(W - S, T, 1, H - T - B + 1, WALL.capD);
    fill(0, H - B, W, B, WALL.capL);
    fill(S - 1, H - B, W - 2 * S + 2, 1, WALL.capD);
    // A soft shadow under the north wall's skirting.
    for (let x = S; x < W - S; x++) {
      const i = T * W + x;
      buf[i] = pack(mix(rgb(art.carpet.lived[2]), rgb('#2a2033'), 0.18));
    }
    // The outlet on the north wall's face (render/props.ts drawOutlet, 'n'): two sockets on a white plate.
    const ox = this.outlet.x, top = T - 11;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 9; x++) {
        const edge = x === 0 || y === 0 || x === 8 || y === 7;
        const corner = (x === 0 || x === 8) && (y === 0 || y === 7);
        if (corner) continue;
        set(ox - 4 + x, top + y, edge ? art.outlet.edge : art.outlet.face);
      }
    for (const sx of [ox - 2, ox + 2]) { set(sx, top + 2, art.outlet.edge); set(sx, top + 3, art.outlet.edge); }
    // The plug, in it (render/cordRenderer.ts drawPlug).
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 5; x++) {
        const edge = x === 0 || y === 0 || x === 4 || y === 3;
        set(ox - 2 + x, top + 4 + y, edge ? art.outlet.edge : y === 1 ? art.palette.paper : art.outlet.body);
      }
  }

  // -------------------------------------------------------------- the vacuum's route

  /** A lawnmower route over the whole carpet: lanes along one axis, a U-turn at each end, starting from the corner nearest where it is. */
  private newPass(first = false): void {
    const vertical = this.pass % 2 === 0;
    this.pass++;
    const { W, H, T, S, B } = this;
    // The head's centre keeps half its housing (28 × 12) off the walls.
    const xmin = S + 15, xmax = W - S - 15, ymin = T + 8, ymax = H - B - 8;
    const here = first ? { x: xmin, y: ymax } : { x: this.vx, y: this.vy };
    const fromRight = here.x > (xmin + xmax) / 2, fromBottom = here.y > (ymin + ymax) / 2;
    const lanes: number[] = [];
    const [a0, a1] = vertical ? [xmin, xmax] : [ymin, ymax];
    const span = a1 - a0;
    const n = Math.max(1, Math.ceil(span / LANE));
    for (let k = 0; k <= n; k++) lanes.push(a0 + (span * k) / n);
    if (vertical ? fromRight : fromBottom) lanes.reverse();
    const [b0, b1] = vertical ? [ymin, ymax] : [xmin, xmax];
    let forward = vertical ? !fromBottom : !fromRight; // runs toward b1 first if starting at b0
    const pts: Pt[] = [];
    const P = (along: number, across: number): Pt => (vertical ? { x: across, y: along } : { x: along, y: across });
    const line = (from: Pt, to: Pt) => {
      const d = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(d));
      for (let s = 1; s <= steps; s++) pts.push({ x: from.x + ((to.x - from.x) * s) / steps, y: from.y + ((to.y - from.y) * s) / steps });
    };
    if (!first) line(here, P(forward ? b0 : b1, lanes[0]));
    else pts.push(P(forward ? b0 : b1, lanes[0]));
    for (let k = 0; k < lanes.length; k++) {
      const c = lanes[k];
      const next = lanes[k + 1];
      const r = next === undefined ? 0 : Math.abs(next - c) / 2;
      const end = forward ? b1 - r : b0 + r;
      line(pts[pts.length - 1], P(end, c));
      if (next === undefined) break;
      // The U-turn: a half circle bulging toward the wall.
      const mid = (c + next) / 2;
      const steps = Math.max(6, Math.ceil(Math.PI * r));
      for (let s = 1; s <= steps; s++) {
        const t = (s / steps) * Math.PI;
        const acrossOff = -Math.cos(t) * r * Math.sign(next - c);
        const alongOff = Math.sin(t) * r * (forward ? 1 : -1);
        pts.push(P(end + alongOff, mid + acrossOff));
      }
      forward = !forward;
    }
    this.path = pts;
    this.pathAt = 0;
  }

  private stepVacuum(dt: number): void {
    if (this.pathAt >= this.path.length - 1) this.newPass();
    const ahead = this.path[Math.min(this.path.length - 1, Math.floor(this.pathAt) + 3)];
    const behind = this.path[Math.max(0, Math.floor(this.pathAt) - 3)];
    const want = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
    let diff = want - this.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const turn = 3.6 * dt;
    this.heading += Math.max(-turn, Math.min(turn, diff));
    // Turning on the spot when it has a long way round to go; driving otherwise.
    if (Math.abs(diff) < 0.9) {
      this.pathAt = Math.min(this.path.length - 1, this.pathAt + VAC_SPEED * dt);
      const p = this.path[Math.floor(this.pathAt)];
      const q = this.path[Math.min(this.path.length - 1, Math.floor(this.pathAt) + 1)];
      const f = this.pathAt - Math.floor(this.pathAt);
      this.vx = p.x + (q.x - p.x) * f;
      this.vy = p.y + (q.y - p.y) * f;
      this.stampHead(this.vx, this.vy, this.heading);
    }
    // Crumbs under the head go up the hose.
    const fx = Math.cos(this.heading), fy = Math.sin(this.heading);
    this.crumbs = this.crumbs.filter((c) => {
      const dx = c.x - this.vx, dy = c.y - this.vy;
      const along = dx * fx + dy * fy, across = -dx * fy + dy * fx;
      if (Math.abs(along) <= FOOT_ALONG + 2 && Math.abs(across) <= FOOT_ACROSS + 1) {
        this.sparkles.push({ x: c.x, y: c.y, t: 0, big: false });
        return false;
      }
      return true;
    });
  }

  // -------------------------------------------------------------- the cord

  private stepCord(): void {
    const { cx, cy, px, py, seg } = this;
    const n = cx.length;
    const hx = this.vx - Math.cos(this.heading) * HANDLE, hy = this.vy - Math.sin(this.heading) * HANDLE;
    // Verlet with a lot of floor friction: a cord lying on carpet barely slides.
    for (let k = 1; k < n - 1; k++) {
      const vx = (cx[k] - px[k]) * 0.6, vy = (cy[k] - py[k]) * 0.6;
      px[k] = cx[k]; py[k] = cy[k];
      cx[k] += vx; cy[k] += vy;
    }
    const ox = this.outlet.x, oy = this.outlet.y + 3;
    for (let it = 0; it < 24; it++) {
      cx[0] = ox; cy[0] = oy;
      cx[n - 1] = hx; cy[n - 1] = hy;
      for (let k = 0; k < n - 1; k++) {
        const dx = cx[k + 1] - cx[k], dy = cy[k + 1] - cy[k];
        const d = Math.hypot(dx, dy) || 1e-6;
        if (d <= seg) continue; // slack is fine: a cord only pulls
        const f = (d - seg) / d / 2;
        const w0 = k === 0 ? 0 : 1, w1 = k + 1 === n - 1 ? 0 : 1;
        const s = w0 + w1;
        if (!s) continue;
        cx[k] += (dx * f * 2 * w0) / s; cy[k] += (dy * f * 2 * w0) / s;
        cx[k + 1] -= (dx * f * 2 * w1) / s; cy[k + 1] -= (dy * f * 2 * w1) / s;
      }
      for (let k = 1; k < n - 1; k++) {
        cx[k] = Math.max(this.S + 1, Math.min(this.W - this.S - 2, cx[k]));
        cy[k] = Math.max(this.T + 1, Math.min(this.H - this.B - 2, cy[k]));
      }
    }
    // Bunched-up slack spreads itself out a little, as a cord does when it's dragged.
    for (let k = 1; k < n - 1; k++) {
      const mx = (cx[k - 1] + cx[k + 1]) / 2, my = (cy[k - 1] + cy[k + 1]) / 2;
      if (Math.hypot(cx[k - 1] - cx[k + 1], cy[k - 1] - cy[k + 1]) < seg * 0.6) {
        cx[k] += (cx[k] - mx) * 0.08;
        cy[k] += (cy[k] - my) * 0.08;
      }
    }
  }

  private drawCord(): void {
    const { g, cx, cy, W, H, cordMark, cordPix } = this;
    for (const i of cordPix) cordMark[i] = 0;
    cordPix.length = 0;
    const plot = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x;
      if (!cordMark[i]) { cordMark[i] = 1; cordPix.push(i); }
    };
    let lx = Math.round(cx[0]), ly = Math.round(cy[0]);
    for (let k = 1; k < cx.length; k++) {
      const x = Math.round(cx[k]), y = Math.round(cy[k]);
      line(lx, ly, x, y, plot);
      lx = x; ly = y;
    }
    // Shadow two pixels down, the shaded underside one down, then the cream core (render/cordRenderer.ts).
    g.fillStyle = CORD_SHADOW;
    for (const i of cordPix) {
      const j = i + 2 * W;
      if (j < W * H && !cordMark[j] && !cordMark[i + W]) g.fillRect(i % W, ((i / W) | 0) + 2, 1, 1);
    }
    g.fillStyle = CORD_SHADE;
    for (const i of cordPix) if (i + W < W * H && !cordMark[i + W]) g.fillRect(i % W, ((i / W) | 0) + 1, 1, 1);
    g.fillStyle = CORD_CORE;
    for (const i of cordPix) g.fillRect(i % W, (i / W) | 0, 1, 1);
  }

  // -------------------------------------------------------------- robots

  /** What a robot at (x, y) with radius r would bump: a wall, the card, the upright, or another robot. */
  private blocked(x: number, y: number, r: number, self: Robot | null): Pt | null {
    if (x - r < this.S) return { x: this.S, y };
    if (x + r > this.W - this.S) return { x: this.W - this.S, y };
    if (y - r < this.T) return { x, y: this.T };
    if (y + r > this.H - this.B) return { x, y: this.H - this.B };
    for (const o of this.obstacles)
      if (x + r > o.x0 && x - r < o.x1 && y + r > o.y0 && y - r < o.y1)
        return { x: Math.max(o.x0, Math.min(o.x1, x)), y: Math.max(o.y0, Math.min(o.y1, y)) };
    if (self) {
      const fx = Math.cos(this.heading), fy = Math.sin(this.heading);
      // The upright: its head (a rough circle) and its body behind.
      for (const [d, rr] of [[0, 15], [-14, 7]] as const) {
        const bx = this.vx + fx * d, by = this.vy + fy * d;
        if (Math.hypot(x - bx, y - by) < r + rr) return { x: (x + bx) / 2, y: (y + by) / 2 };
      }
      for (const o of this.robots)
        if (o !== self && Math.hypot(x - o.x, y - o.y) < r * 2) return { x: (x + o.x) / 2, y: (y + o.y) / 2 };
    }
    return null;
  }

  private bump(rb: Robot, at: Pt | null): void {
    rb.state = 'turn';
    rb.turnLeft = (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 1.6);
    if (at) { rb.boink = 0.4; rb.bx = at.x; rb.by = at.y; }
  }

  private stepRobot(rb: Robot, dt: number): void {
    rb.brushT += dt;
    if (rb.boink > 0) rb.boink -= dt;
    if (rb.target && !this.crumbs.includes(rb.target)) rb.target = null;
    if (rb.state === 'turn') {
      const s = Math.sign(rb.turnLeft) * Math.min(Math.abs(rb.turnLeft), ROBOT_TURN * dt);
      rb.a += s;
      rb.turnLeft -= s;
      if (Math.abs(rb.turnLeft) < 1e-3) rb.state = 'drive';
      return;
    }
    if (rb.target) {
      const want = Math.atan2(rb.target.y - rb.y, rb.target.x - rb.x);
      const d = Math.atan2(Math.sin(want - rb.a), Math.cos(want - rb.a));
      rb.a += Math.max(-2 * dt, Math.min(2 * dt, d));
    }
    // The upright shoves a robot that's in its way (as it does in the game).
    const fx = Math.cos(this.heading), fy = Math.sin(this.heading);
    const dx = rb.x - (this.vx + fx * 4), dy = rb.y - (this.vy + fy * 4);
    const dd = Math.hypot(dx, dy);
    if (dd < 15 + ROBOT_R) {
      const push = (15 + ROBOT_R - dd) / Math.max(dd, 1e-3);
      const nx = rb.x + dx * push, ny = rb.y + dy * push;
      if (!this.blocked(nx, ny, ROBOT_R, null)) { rb.x = nx; rb.y = ny; }
      if (rb.state === 'drive' && rb.boink <= 0) this.bump(rb, { x: rb.x - dx * 0.4, y: rb.y - dy * 0.4 });
      return;
    }
    const nx = rb.x + Math.cos(rb.a) * ROBOT_SPEED * dt, ny = rb.y + Math.sin(rb.a) * ROBOT_SPEED * dt;
    const hit = this.blocked(nx, ny, ROBOT_R, rb);
    if (hit) {
      this.bump(rb, hit);
      return;
    }
    rb.x = nx; rb.y = ny;
    this.stampRobot(rb.x, rb.y, rb.a);
    this.crumbs = this.crumbs.filter((c) => {
      if (Math.hypot(c.x - rb.x, c.y - rb.y) > ROBOT_MOUTH + 1) return true;
      this.sparkles.push({ x: c.x, y: c.y, t: 0, big: c.dropped });
      return false;
    });
  }

  // -------------------------------------------------------------- crumbs

  private spawnCrumb(dropped: boolean, at?: Pt): Crumb | null {
    for (let tries = 0; tries < 30; tries++) {
      const x = at ? at.x + (Math.random() - 0.5) * 8 : this.S + 4 + Math.random() * (this.W - 2 * this.S - 8);
      const y = at ? at.y + (Math.random() - 0.5) * 8 : this.T + 4 + Math.random() * (this.H - this.T - this.B - 8);
      if (!this.inCarpet(Math.floor(x), Math.floor(y))) continue;
      if (!at && this.obstacles.some((o) => x > o.x0 - 2 && x < o.x1 + 2 && y > o.y0 - 2 && y < o.y1 + 2)) continue;
      const c: Crumb = { x, y, cell: Math.random() < (dropped ? 0.7 : 0.15) ? 6 + (Math.random() < 0.5 ? 0 : 1) : Math.floor(Math.random() * 6), dropped };
      this.crumbs.push(c);
      return c;
    }
    return null;
  }

  /** The upright is going straight mid-lane, head and handle clear of the card and the walls (for the still frame). */
  vacuumInView(): boolean {
    const fx = Math.cos(this.heading), fy = Math.sin(this.heading);
    const pts = [[this.vx, this.vy], [this.vx - fx * HANDLE, this.vy - fy * HANDLE]];
    // Mid-lane, going straight, clear of the walls at either end.
    if (Math.min(Math.abs(fx), Math.abs(fy)) > 0.05) return false;
    if (pts.some(([x, y]) => y < this.T + 24 || y > this.H - this.B - 24 || x < this.S + 20 || x > this.W - this.S - 20)) return false;
    return pts.every(([x, y]) => !this.obstacles.some((o) => x > o.x0 - 16 && x < o.x1 + 16 && y > o.y0 - 16 && y < o.y1 + 16));
  }

  /** No boinks or sparkles mid-air (for the still frame). */
  calm(): void {
    for (const rb of this.robots) rb.boink = 0;
    this.sparkles = [];
  }

  /** A tap on the carpet: a robot gets a bump, or a few crumbs land for the nearest one to fetch. */
  poke(x: number, y: number): void {
    for (const rb of this.robots)
      if (Math.hypot(rb.x - x, rb.y - y) < ROBOT_R + 3) {
        this.bump(rb, { x, y });
        return;
      }
    if (!this.inCarpet(Math.floor(x), Math.floor(y))) return;
    let first: Crumb | null = null;
    for (let k = 0; k < 5; k++) first = this.spawnCrumb(true, { x, y }) ?? first;
    if (!first) return;
    let best: Robot | null = null, bd = Infinity;
    for (const rb of this.robots) {
      const d = Math.hypot(rb.x - x, rb.y - y);
      if (d < bd && !rb.target) { bd = d; best = rb; }
    }
    if (best) best.target = first;
  }

  // -------------------------------------------------------------- the loop

  step(dt: number): void {
    this.clock += dt;
    this.stepVacuum(dt);
    this.stepCord();
    for (const rb of this.robots) this.stepRobot(rb, dt);
    this.settle();
    if (this.clock > this.nextCrumb) {
      this.nextCrumb = this.clock + 5 + Math.random() * 6;
      if (this.crumbs.length < 14) this.spawnCrumb(false);
    }
    for (const s of this.sparkles) s.t += dt;
    if (this.sparkles.length) this.sparkles = this.sparkles.filter((s) => s.t < 0.5);
  }

  draw(): void {
    const { g, sp } = this;
    this.flushCarpet();
    g.drawImage(this.carpet, 0, 0);
    const D = art.sizes.debrisCell;
    for (const c of this.crumbs) g.drawImage(sp.debris, c.cell * D, 0, D, D, Math.round(c.x) - 2, Math.round(c.y) - 2, D, D);
    this.drawCord();
    const RS = art.sizes.robot, RF = art.sizes.robotFrames;
    for (const rb of this.robots) {
      const f = ((Math.round((rb.a / (Math.PI * 2)) * RF) % RF) + RF) % RF;
      const brush = Math.floor(rb.brushT / 0.12) % 2;
      g.drawImage(sp.robots, f * RS, (rb.row * 2 + brush) * RS, RS, RS, Math.round(rb.x) - RS / 2, Math.round(rb.y) - RS / 2, RS, RS);
    }
    const V = art.sizes.vacuum, VF = art.sizes.vacuumFrames;
    const vf = ((Math.round(((this.heading + Math.PI / 2) / (Math.PI * 2)) * VF) % VF) + VF) % VF;
    g.drawImage(sp.vacuum, vf * V, 0, V, V, Math.round(this.vx) - V / 2, Math.round(this.vy) - V / 2, V, V);
    // The walls stand in front of anything that pokes past them (a handle swinging round at the end of a lane).
    const { W, H, T, S, B } = this;
    g.drawImage(this.carpet, 0, 0, W, T, 0, 0, W, T);
    g.drawImage(this.carpet, 0, T, S, H - T, 0, T, S, H - T);
    g.drawImage(this.carpet, W - S, T, S, H - T, W - S, T, S, H - T);
    g.drawImage(this.carpet, S, H - B, W - 2 * S, B, S, H - B, W - 2 * S, B);
    const [bo, bs] = art.bits.boink;
    for (const rb of this.robots)
      if (rb.boink > 0) g.drawImage(sp.bits, bo, 0, bs, bs, Math.round(rb.bx) - 4, Math.round(rb.by) - 4 - Math.round((0.4 - rb.boink) * 10), bs, bs);
    for (const s of this.sparkles) {
      const [so, ss] = s.big ? art.bits.sparkleBig : art.bits.sparkleSmall;
      g.drawImage(sp.bits, so, 0, ss, ss, Math.round(s.x) - (ss >> 1), Math.round(s.y) - (ss >> 1) - Math.round(s.t * 8), ss, ss);
    }
  }
}

/** Bresenham line (render/cordRenderer.ts). */
function line(x0: number, y0: number, x1: number, y1: number, plot: (x: number, y: number) => void): void {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 4000; guard++) {
    plot(x0, y0);
    if (x0 === x1 && y0 === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// ---------------------------------------------------------------- mounting

/** Device px per game px: about 480 game px across a wide screen, two CSS px to a game px on a narrow one. */
function pixelScale(cssWidth: number, dpr: number): number {
  const cssPer = cssWidth >= 900 ? cssWidth / 480 : 2;
  return Math.max(1, Math.round(cssPer * dpr));
}

export function mountVacuumRoom(host: HTMLElement): () => void {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas[data-room-canvas]');
  if (!canvas) return () => {};
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let room: Room | null = null;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let onScreen = false;
  let gone = false;
  let scale = 1;
  let built = '';
  const seed = Math.floor(Math.random() * 1000);
  // (For a rough look at what it costs: the average ms a tick and a draw take, over the last few seconds.)
  const cost = { ms: 0, ticks: 0 };
  (window as unknown as { __vacRoom?: unknown }).__vacRoom = cost;

  const running = () => onScreen && !document.hidden && !still.matches && !gone;

  const frame = (now: number) => {
    raf = 0;
    if (!running() || !room) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    acc += dt;
    if (acc >= TICK) {
      const t0 = performance.now();
      while (acc >= TICK) {
        room.step(TICK);
        acc -= TICK;
      }
      room.draw();
      const ms = performance.now() - t0;
      cost.ms = cost.ms * 0.98 + ms * 0.02;
      cost.ticks++;
    }
    raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf && running()) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  const build = async () => {
    const sp = await loadSprites().catch(() => null);
    if (!sp || gone) return;
    const r = host.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const dpr = window.devicePixelRatio || 1;
    scale = pixelScale(r.width, dpr);
    const W = Math.ceil((r.width * dpr) / scale), H = Math.ceil((r.height * dpr) / scale);
    const key = `${W}x${H}@${scale}`;
    if (key === built && room) return;
    built = key;
    canvas.style.width = `${(W * scale) / dpr}px`;
    canvas.style.height = `${(H * scale) / dpr}px`;
    const toGame = (v: number) => (v * dpr) / scale;
    const obstacles: Rect[] = [];
    document.querySelectorAll<HTMLElement>('[data-room-furniture]').forEach((el) => {
      const b = el.getBoundingClientRect();
      const o = { x0: toGame(b.left - r.left), y0: toGame(b.top - r.top), x1: toGame(b.right - r.left), y1: toGame(b.bottom - r.top) };
      if (o.x1 > 0 && o.y1 > 0 && o.x0 < W && o.y0 < H) obstacles.push(o);
    });
    room = new Room(canvas, W, H, sp, obstacles, seed);
    // Start part way into the first pass, so there are stripes from the first frame. The still frame goes further
    // in, and waits for a moment when the upright isn't hidden under the card.
    if (still.matches) {
      for (let t = 0; t < 140; t += TICK) {
        room.step(TICK);
        if (t > 60 && room.vacuumInView()) break;
      }
      room.calm();
    } else for (let t = 0; t < 22; t += TICK) room.step(TICK);
    room.draw();
    host.dataset.roomReady = '1';
    kick();
  };

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, room ? 200 : 0);
  });
  ro.observe(host);
  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    kick();
  });
  io.observe(canvas);
  const onVisibility = () => kick();
  document.addEventListener('visibilitychange', onVisibility);
  const onMotion = () => {
    built = '';
    build();
  };
  still.addEventListener('change', onMotion);
  const onPoke = (e: PointerEvent) => {
    if (!room || still.matches) return;
    const b = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    room.poke(((e.clientX - b.left) * dpr) / scale, ((e.clientY - b.top) * dpr) / scale);
  };
  canvas.addEventListener('pointerdown', onPoke);

  return () => {
    gone = true;
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    still.removeEventListener('change', onMotion);
    canvas.removeEventListener('pointerdown', onPoke);
    window.clearTimeout(resizeTimer);
  };
}
