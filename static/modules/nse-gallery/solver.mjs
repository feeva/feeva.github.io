// Collocated-grid Stable Fluids solver; see Jos Stam, GDC 2003.
export class Fluid {
  constructor(n = 80) {
    this.n = n; this.stride = n + 2;
    const field = () => new Float32Array((n + 2) ** 2);
    this.u = field(); this.v = field(); this.u0 = field(); this.v0 = field();
    this.pressure = field(); this.div = field();
    this.dye = [field(), field(), field()]; this.temp = field();
  }
  boundary(b, a) {
    const n = this.n, s = this.stride;
    for (let i = 1; i <= n; i++) {
      a[i * s] = (b === 1 ? -1 : 1) * a[1 + i * s];
      a[n + 1 + i * s] = (b === 1 ? -1 : 1) * a[n + i * s];
      a[i] = (b === 2 ? -1 : 1) * a[i + s];
      a[i + (n + 1) * s] = (b === 2 ? -1 : 1) * a[i + n * s];
    }
    for (const y of [0, n + 1]) for (const x of [0, n + 1]) {
      a[x + y * s] = .5 * (a[(x === 0 ? 1 : n) + y * s] + a[x + (y === 0 ? 1 : n) * s]);
    }
  }
  solve(b, out, input, a, c) {
    const n = this.n, s = this.stride;
    for (let k = 0; k < 24; k++) {
      for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) {
        const i = x + y * s;
        out[i] = (input[i] + a * (out[i-1] + out[i+1] + out[i-s] + out[i+s])) / c;
      }
      this.boundary(b, out);
    }
  }
  project() {
    const {n, stride:s, u, v, pressure:p, div:d} = this;
    p.fill(0);
    this.boundary(1, u); this.boundary(2, v);
    for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) {
      const i = x + y * s;
      d[i] = -.5 * (u[i+1] - u[i-1] + v[i+s] - v[i-s]) / n;
    }
    this.boundary(0, d); this.solve(0, p, d, 1, 4);
    for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) {
      const i = x + y * s;
      u[i] -= .5 * n * (p[i+1] - p[i-1]);
      v[i] -= .5 * n * (p[i+s] - p[i-s]);
    }
    this.boundary(1, u); this.boundary(2, v);
  }
  advect(b, out, input, u, v, dt) {
    const n = this.n, s = this.stride;
    for (let y = 1; y <= n; y++) for (let x = 1; x <= n; x++) {
      const i = x + y * s;
      const px = Math.max(.5, Math.min(n + .5, x - dt * n * u[i]));
      const py = Math.max(.5, Math.min(n + .5, y - dt * n * v[i]));
      const ix = Math.floor(px), iy = Math.floor(py), a = px-ix, c = py-iy;
      out[i] = (1-a)*((1-c)*input[ix+iy*s]+c*input[ix+(iy+1)*s])
        + a*((1-c)*input[ix+1+iy*s]+c*input[ix+1+(iy+1)*s]);
    }
    this.boundary(b, out);
  }
  splat(x, y, dx, dy, color) {
    const n = this.n, s = this.stride, cx = 1+x*(n-1), cy = 1+y*(n-1);
    for (let yy = Math.max(1, Math.floor(cy-4)); yy <= Math.min(n, cy+4); yy++) {
      for (let xx = Math.max(1, Math.floor(cx-4)); xx <= Math.min(n, cx+4); xx++) {
        const w = Math.exp(-((xx-cx)**2+(yy-cy)**2)/5), i = xx+yy*s;
        this.u[i] += Math.max(-.7, Math.min(.7, dx))*w;
        this.v[i] += Math.max(-.7, Math.min(.7, dy))*w;
        this.dye.forEach((d, c) => { d[i] = Math.min(8, d[i]+color[c]*w); });
      }
    }
  }
  paint(x, y, pigment, radius = 8) {
    const {n, stride:s} = this, cx = 1+x*(n-1), cy = 1+y*(n-1);
    for (let yy = Math.max(1, Math.floor(cy-radius)); yy <= Math.min(n, cy+radius); yy++) {
      for (let xx = Math.max(1, Math.floor(cx-radius)); xx <= Math.min(n, cx+radius); xx++) {
        const distance = Math.hypot(xx-cx, yy-cy)/radius;
        const w = Math.max(0, Math.min(1, (1-distance)*5));
        const i = xx+yy*s;
        this.dye.forEach((d, c) => { d[i] = d[i]*(1-w)+pigment[c]*w; });
      }
    }
    this.dye.forEach(d => this.boundary(0, d));
  }
  stir(x, y, vx, vy, dt) {
    const {n, stride:s} = this, cx = 1+x*(n-1), cy = 1+y*(n-1);
    for (let yy = Math.max(1, Math.floor(cy-5)); yy <= Math.min(n, cy+5); yy++) {
      for (let xx = Math.max(1, Math.floor(cx-5)); xx <= Math.min(n, cx+5); xx++) {
        const w = (1-Math.exp(-35*dt))*Math.exp(-((xx-cx)**2+(yy-cy)**2)/14), i = xx+yy*s;
        this.u[i] += (vx-this.u[i])*w;
        this.v[i] += (vy-this.v[i])*w;
      }
    }
  }
  step(dt, viscosity, { fade = .16, drag = 0 } = {}) {
    const a = dt * viscosity * this.n ** 2;
    this.u0.set(this.u); this.v0.set(this.v);
    this.solve(1, this.u, this.u0, a, 1+4*a);
    this.solve(2, this.v, this.v0, a, 1+4*a);
    this.project(); this.u0.set(this.u); this.v0.set(this.v);
    this.advect(1, this.u, this.u0, this.u0, this.v0, dt);
    this.advect(2, this.v, this.v0, this.u0, this.v0, dt);
    this.project();
    // Substrate resistance in paint mode, distinct from viscosity.
    if (drag) for (let i = 0; i < this.u.length; i++) {
      this.u[i] *= Math.exp(-drag*dt); this.v[i] *= Math.exp(-drag*dt);
    }
    for (const dye of this.dye) {
      this.temp.set(dye); this.advect(0, dye, this.temp, this.u, this.v, dt);
      // Visual fade, separate from physical viscosity.
      if (fade) for (let i = 0; i < dye.length; i++) dye[i] *= Math.exp(-fade*dt);
    }
  }
  clear() {
    for (const a of [this.u, this.v, this.u0, this.v0, this.pressure, this.div, this.temp, ...this.dye]) a.fill(0);
  }
}
