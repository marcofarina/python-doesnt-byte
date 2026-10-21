/**
 * Campo di particelle su <canvas> che copre uno spoiler, in stile Telegram:
 * puntini che compaiono, derivano piano e svaniscono, ognuno con la sua vita.
 *
 * Il canvas sborda di BLEED px dal riquadro dello spoiler (il suo genitore):
 * a riposo le particelle si disegnano solo dentro il riquadro (bordo netto),
 * mentre nell'esplosione possono volare fuori. Ai lati lo sbordo si ferma al
 * bordo della finestra, così su mobile non nasce uno scroll orizzontale.
 *
 * Il colore viene da `color` del canvas (CSS), quindi segue il tema. Con
 * `prefers-reduced-motion` il campo disegna un solo fotogramma e non anima;
 * la sfocatura che lo rende una texture la mette il CSS.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  /** Cella della griglia in cui la particella rinasce. */
  cell: number;
  /** Opacità del fotogramma fermo («riduci movimento»). */
  still: number;
  /** Tempo di dissolvenza rimasto dopo l'onda d'urto, in secondi. */
  fade: number;
  /** Durata della dissolvenza; 0 finché l'onda non colpisce la particella. */
  fadeMax: number;
}

/** Margine del canvas oltre il riquadro, in px: lo spazio dell'esplosione. */
const BLEED = 32;

/** Particelle per px² di superficie, con un tetto per i blocchi grandi. */
const DENSITY = 0.09;
const MIN_PARTICLES = 24;
const MAX_PARTICLES = 3500;
/** Velocità di deriva massima, in px/s. */
const DRIFT = 9;
/** Durata di vita di una particella, in secondi. */
const LIFE_MIN = 0.9;
const LIFE_MAX = 2.6;
/** Spinta dell'onda d'urto, in px/s: più forte vicino al punto del clic. */
const KICK_MIN = 70;
const KICK_MAX = 240;
/** Attrito dell'aria, in 1/s: le particelle partono veloci e frenano. */
const DRAG = 3.4;
/** Durata della dissolvenza di una particella colpita, in secondi. */
const FADE_MIN = 0.3;
const FADE_MAX = 0.6;
/** Ogni quanto rileggere il colore dal CSS (cambio tema), in ms. */
const COLOR_REFRESH_MS = 1000;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** cubic-bezier(0.33, 1, 0.68, 1): la stessa curva del clip-path nel CSS. */
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Distanza dal punto (x, y) all'angolo più lontano di un riquadro w × h. */
export function farthestCorner(
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
}

/**
 * Durata della rivelazione, in ms: l'onda viaggia a velocità quasi costante,
 * quindi un blocco grande impiega più di una parola.
 */
export function revealDuration(radius: number): number {
  return Math.round(Math.min(900, Math.max(420, 360 + radius * 0.9)));
}

export class ParticleField {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly reducedMotion: boolean;
  private particles: Particle[] = [];
  /** Misure del riquadro dello spoiler, senza il margine. */
  private width = 0;
  private height = 0;
  /** Posizione del riquadro dentro il canvas (lo sbordo a sinistra e in alto). */
  private ox = BLEED;
  private readonly oy = BLEED;
  private cols = 1;
  private cellW = 1;
  private cellH = 1;
  private color = 'currentColor';
  private colorReadAt = 0;
  private frame = 0;
  private lastTime = 0;
  private visible = true;
  private dissolving: {
    x: number;
    y: number;
    radius: number;
    start: number;
    duration: number;
    done: () => void;
  } | null = null;
  private stopped = false;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Si osserva il riquadro, non il canvas: le misure del canvas le decide
    // il campo stesso. La finestra serve per lo sbordo ai lati.
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    window.addEventListener('resize', this.resize);

    // Fuori dallo schermo il campo non anima: una lezione con dieci spoiler
    // non deve tenere dieci loop accesi.
    this.intersectionObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => {
            this.visible = entries.some((e) => e.isIntersecting);
            if (this.visible) this.start();
          });
    this.intersectionObserver?.observe(canvas);

    this.resize();
  }

  /**
   * Fa esplodere il campo dal punto (x, y), in px relativi al riquadro: un'onda
   * d'urto si allarga con il raggio `radius` in `duration` ms e scaglia via le
   * particelle che raggiunge.
   */
  dissolve(
    x: number,
    y: number,
    radius: number,
    duration: number,
    done: () => void,
  ): void {
    if (this.reducedMotion || !this.ctx) {
      this.clear();
      done();
      return;
    }
    this.dissolving = {
      x,
      y,
      radius,
      start: performance.now(),
      duration,
      done,
    };
    this.start();
  }

  /** Ridisegna con il colore corrente (dopo un cambio tema o un hover). */
  refresh(): void {
    this.colorReadAt = 0;
    if (this.reducedMotion) this.drawStatic();
  }

  destroy(): void {
    this.stopped = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.intersectionObserver?.disconnect();
    window.removeEventListener('resize', this.resize);
  }

  private resize = (): void => {
    if (this.dissolving || this.stopped) return;
    const host = (
      this.canvas.parentElement ?? this.canvas
    ).getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const left = Math.max(0, Math.min(BLEED, host.left));
    const right = Math.max(0, Math.min(BLEED, viewport - host.right));
    const fullW = host.width + left + right;
    const fullH = host.height + 2 * this.oy;
    // Misure esplicite: un canvas assoluto con solo `inset` prenderebbe la
    // sua larghezza intrinseca.
    const style = this.canvas.style;
    style.left = `${-left}px`;
    style.top = `${-this.oy}px`;
    style.width = `${fullW}px`;
    style.height = `${fullH}px`;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(fullW * dpr));
    this.canvas.height = Math.max(1, Math.round(fullH * dpr));
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ox = left;
    this.width = Math.max(1, host.width);
    this.height = Math.max(1, host.height);
    this.seed();
    if (this.reducedMotion) this.drawStatic();
    else this.start();
  };

  /**
   * Una particella per cella di una griglia: la copertura è uniforme fino ai
   * bordi, senza grumi né vuoti come con posizioni del tutto casuali.
   */
  private seed(): void {
    const area = this.width * this.height;
    const target = Math.min(
      MAX_PARTICLES,
      Math.max(MIN_PARTICLES, Math.round(area * DENSITY)),
    );
    this.cols = Math.max(
      1,
      Math.round(Math.sqrt((target * this.width) / this.height)),
    );
    const rows = Math.max(1, Math.round(target / this.cols));
    this.cellW = this.width / this.cols;
    this.cellH = this.height / rows;
    this.particles = Array.from({ length: this.cols * rows }, (_, cell) =>
      this.spawn(cell, true),
    );
  }

  private spawn(cell: number, randomAge: boolean): Particle {
    const maxLife = rand(LIFE_MIN, LIFE_MAX);
    const size = rand(0.9, 1.6);
    const col = cell % this.cols;
    const row = Math.floor(cell / this.cols);
    return {
      x: Math.min(this.width - size, (col + Math.random()) * this.cellW),
      y: Math.min(this.height - size, (row + Math.random()) * this.cellH),
      vx: rand(-DRIFT, DRIFT),
      vy: rand(-DRIFT, DRIFT),
      size,
      // All'avvio le particelle hanno età sparse, altrimenti nascerebbero e
      // morirebbero tutte insieme.
      life: randomAge ? Math.random() * maxLife : 0,
      maxLife,
      cell,
      still: rand(0.35, 0.9),
      fade: 0,
      fadeMax: 0,
    };
  }

  /** L'onda d'urto raggiunge la particella: spinta radiale e dissolvenza. */
  private kick(p: Particle, dx: number, dy: number, dist: number): void {
    const { radius } = this.dissolving!;
    // Direzione radiale con un po' di dispersione angolare: non un raggio
    // perfetto ma una nuvola che si apre.
    const angle =
      (dist > 0.5 ? Math.atan2(dy, dx) : rand(-Math.PI, Math.PI)) +
      rand(-0.45, 0.45);
    const near = 1 - Math.min(1, dist / Math.max(1, radius));
    const speed = rand(KICK_MIN, KICK_MAX) * (0.55 + 0.75 * near);
    p.vx += Math.cos(angle) * speed;
    p.vy += Math.sin(angle) * speed;
    p.fadeMax = rand(FADE_MIN, FADE_MAX);
    p.fade = p.fadeMax;
  }

  private readColor(now: number): void {
    if (now - this.colorReadAt < COLOR_REFRESH_MS) return;
    this.colorReadAt = now;
    this.color = getComputedStyle(this.canvas).color || this.color;
  }

  private start(): void {
    if (this.stopped || this.reducedMotion || !this.ctx) return;
    if (this.frame) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    this.frame = 0;
    if (this.stopped || !this.ctx) return;
    if (!this.visible && !this.dissolving) return;

    // dt limitato: dopo una scheda in background non vogliamo un salto.
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.readColor(now);

    const wave = this.dissolving;
    let front = -1;
    let waveDone = false;
    if (wave) {
      const t = Math.min(1, (now - wave.start) / wave.duration);
      front = wave.radius * easeOutCubic(t);
      waveDone = t >= 1;
    }

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = this.color;

    // Prima passata: le particelle a riposo, tagliate sul riquadro.
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.ox, this.oy, w, h);
    ctx.clip();
    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];
      // Una particella colpita non torna mai a riposo: se rinascesse, l'onda
      // la colpirebbe di nuovo e il campo diventerebbe una fontana.
      if (p.fadeMax > 0) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p = this.spawn(p.cell, false);
        this.particles[i] = p;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // A riposo le particelle rimbalzano sui bordi del riquadro.
      if (p.x < 0 || p.x > w - p.size) {
        p.vx = -p.vx;
        p.x = Math.min(w - p.size, Math.max(0, p.x));
      }
      if (p.y < 0 || p.y > h - p.size) {
        p.vy = -p.vy;
        p.y = Math.min(h - p.size, Math.max(0, p.y));
      }
      if (wave) {
        const dx = p.x - wave.x;
        const dy = p.y - wave.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= front) {
          this.kick(p, dx, dy, dist);
          continue;
        }
      }
      ctx.globalAlpha = Math.max(0, Math.sin((Math.PI * p.life) / p.maxLife));
      ctx.fillRect(this.ox + p.x, this.oy + p.y, p.size, p.size);
    }
    ctx.restore();

    // Seconda passata: le particelle scagliate dall'onda, libere di uscire.
    let flying = 0;
    if (wave) {
      const drag = Math.exp(-DRAG * dt);
      for (const p of this.particles) {
        if (p.fadeMax === 0 || p.fade <= 0) continue;
        p.fade -= dt;
        if (p.fade <= 0) continue;
        flying++;
        p.vx *= drag;
        p.vy *= drag;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Appena colpita la particella si accende, poi si spegne in volo.
        const k = p.fade / p.fadeMax;
        const size = p.size * (0.6 + 0.6 * k);
        ctx.globalAlpha = Math.min(1, 1.4 * k) * k;
        ctx.fillRect(this.ox + p.x, this.oy + p.y, size, size);
      }
    }
    ctx.globalAlpha = 1;

    if (wave && waveDone && flying === 0) {
      this.dissolving = null;
      this.clear();
      this.stopped = true;
      wave.done();
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private drawStatic(): void {
    if (!this.ctx) return;
    this.readColor(performance.now());
    const ctx = this.ctx;
    this.clear();
    ctx.fillStyle = this.color;
    for (const p of this.particles) {
      ctx.globalAlpha = p.still;
      ctx.fillRect(this.ox + p.x, this.oy + p.y, p.size + 0.4, p.size + 0.4);
    }
    ctx.globalAlpha = 1;
  }

  private clear(): void {
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
