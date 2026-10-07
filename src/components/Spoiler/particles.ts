/**
 * Campo di particelle su <canvas> che copre uno spoiler, in stile Telegram:
 * puntini che compaiono, derivano piano e svaniscono, ognuno con la sua vita.
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
}

/** Particelle per px² di superficie, con un tetto per i blocchi grandi. */
const DENSITY = 0.09;
const MIN_PARTICLES = 24;
const MAX_PARTICLES = 3500;
/** Velocità di deriva massima, in px/s. */
const DRIFT = 9;
/** Durata di vita di una particella, in secondi. */
const LIFE_MIN = 0.9;
const LIFE_MAX = 2.6;
/** Ogni quanto rileggere il colore dal CSS (cambio tema), in ms. */
const COLOR_REFRESH_MS = 1000;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export class ParticleField {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly reducedMotion: boolean;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private color = 'currentColor';
  private colorReadAt = 0;
  private frame = 0;
  private lastTime = 0;
  private visible = true;
  private dissolving: {
    x: number;
    y: number;
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

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

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

  /** Scioglie il campo a partire dal punto (x, y), in px relativi al canvas. */
  dissolve(x: number, y: number, duration: number, done: () => void): void {
    if (this.reducedMotion || !this.ctx) {
      this.clear();
      done();
      return;
    }
    this.dissolving = { x, y, start: performance.now(), duration, done };
    for (const p of this.particles) {
      // Spinta radiale: le particelle vicine al punto partono per prime e
      // più veloci, come un'onda che si allarga.
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      const push = rand(40, 110);
      p.vx += (dx / dist) * push;
      p.vy += (dy / dist) * push;
    }
    this.start();
  }

  /** Ridisegna con il colore corrente (dopo un cambio tema). */
  refresh(): void {
    this.colorReadAt = 0;
    if (this.reducedMotion) this.drawStatic();
  }

  destroy(): void {
    this.stopped = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.intersectionObserver?.disconnect();
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.dissolving) return;
    this.seed();
    if (this.reducedMotion) this.drawStatic();
    else this.start();
  }

  private seed(): void {
    const area = this.width * this.height;
    const count = Math.min(
      MAX_PARTICLES,
      Math.max(MIN_PARTICLES, Math.round(area * DENSITY)),
    );
    this.particles = Array.from({ length: count }, () => this.spawn(true));
  }

  private spawn(randomAge: boolean): Particle {
    const maxLife = rand(LIFE_MIN, LIFE_MAX);
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: rand(-DRIFT, DRIFT),
      vy: rand(-DRIFT, DRIFT),
      size: rand(0.9, 1.6),
      // All'avvio le particelle hanno età sparse, altrimenti nascerebbero e
      // morirebbero tutte insieme.
      life: randomAge ? Math.random() * maxLife : 0,
      maxLife,
    };
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

    let fade = 1;
    if (this.dissolving) {
      const t = (now - this.dissolving.start) / this.dissolving.duration;
      if (t >= 1) {
        const { done } = this.dissolving;
        this.dissolving = null;
        this.clear();
        this.stopped = true;
        done();
        return;
      }
      fade = 1 - t;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.color;
    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife && !this.dissolving) {
        p = this.spawn(false);
        this.particles[i] = p;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Durante la vita normale le particelle restano dentro il riquadro.
      if (!this.dissolving) {
        if (p.x < 0 || p.x > this.width) p.vx = -p.vx;
        if (p.y < 0 || p.y > this.height) p.vy = -p.vy;
      }
      const alpha = Math.sin((Math.PI * p.life) / p.maxLife);
      ctx.globalAlpha = Math.max(0, alpha) * fade;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    this.frame = requestAnimationFrame(this.tick);
  };

  private drawStatic(): void {
    if (!this.ctx) return;
    this.readColor(performance.now());
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.color;
    for (const p of this.particles) {
      ctx.globalAlpha = rand(0.35, 0.9);
      ctx.fillRect(p.x, p.y, p.size + 0.4, p.size + 0.4);
    }
    ctx.globalAlpha = 1;
  }

  private clear(): void {
    this.ctx?.clearRect(0, 0, this.width, this.height);
  }
}
