import { Fluid } from './solver.mjs';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function createFluidView(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return {
    canvas,
    context: canvas.getContext('2d', { alpha: false }),
    image: new ImageData(size, size),
  };
}

function paintFluid(view, fluid, palette = 'cool') {
  const { n, stride, dye } = fluid;
  const pixels = view.image.data;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const fieldIndex = x + 1 + (y + 1) * stride;
      const pixelIndex = (x + y * n) * 4;
      const red = 1 - Math.exp(-dye[0][fieldIndex] * 1.8);
      const green = 1 - Math.exp(-dye[1][fieldIndex] * 1.8);
      const blue = 1 - Math.exp(-dye[2][fieldIndex] * 1.8);
      if (palette === 'warm') {
        const smoke = clamp(red + green * 0.65 + blue * 0.25, 0, 1);
        pixels[pixelIndex] = 15 + 228 * smoke;
        pixels[pixelIndex + 1] = 10 + 132 * smoke;
        pixels[pixelIndex + 2] = 22 + 63 * smoke;
      } else {
        pixels[pixelIndex] = 5 + 240 * red;
        pixels[pixelIndex + 1] = 13 + 232 * green;
        pixels[pixelIndex + 2] = 22 + 225 * blue;
      }
      pixels[pixelIndex + 3] = 255;
    }
  }
  view.context.putImageData(view.image, 0, 0);
}

function drawCroppedFluid(target, view) {
  const context = target.getContext('2d', { alpha: false });
  const sourceHeight = (view.canvas.height * target.height) / target.width;
  const sourceY = (view.canvas.height - sourceHeight) / 2;
  context.imageSmoothingEnabled = true;
  context.drawImage(
    view.canvas,
    0,
    sourceY,
    view.canvas.width,
    sourceHeight,
    0,
    0,
    target.width,
    target.height,
  );
}

function drawFluidCover(context, source, x, y, width, height) {
  const sourceRatio = source.width / source.height;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = source.width;
  let sourceHeight = source.height;
  if (sourceRatio > targetRatio) {
    sourceWidth = source.height * targetRatio;
    sourceX = (source.width - sourceWidth) / 2;
  } else {
    sourceHeight = source.width / targetRatio;
    sourceY = (source.height - sourceHeight) / 2;
  }
  context.drawImage(
    source,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function addVortex(fluid, centerX, centerY, strength, radius = 0.34) {
  const { n, stride, u, v } = fluid;
  for (let y = 1; y <= n; y++) {
    for (let x = 1; x <= n; x++) {
      const dx = x / n - centerX;
      const dy = y / n - centerY;
      const distance2 = dx * dx + dy * dy;
      const weight = Math.exp(-distance2 / (radius * radius));
      const i = x + y * stride;
      u[i] -= dy * strength * weight;
      v[i] += dx * strength * weight;
    }
  }
}

function seedWisps(fluid, colored = false) {
  addVortex(fluid, 0.51, 0.5, 0.72, 0.36);
  const pale = [0.42, 0.56, 0.68];
  const wisps = colored
    ? [
        [0.34, 0.54, [0.72, 0.045, 0.018]],
        [0.45, 0.39, [0.025, 0.36, 0.72]],
        [0.59, 0.47, [0.42, 0.025, 0.58]],
        [0.63, 0.62, [0.06, 0.32, 0.56]],
        [0.47, 0.64, [0.56, 0.055, 0.12]],
      ]
    : [
        [0.33, 0.55, pale],
        [0.42, 0.41, pale],
        [0.52, 0.53, pale],
        [0.6, 0.38, pale],
        [0.66, 0.59, pale],
      ];
  wisps.forEach(([x, y, color]) => fluid.splat(x, y, 0, 0, color));
}

function attachPointer(canvas, disturb) {
  let pointerId = null;
  let previous = null;
  const point = (event) => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    };
  };

  canvas.addEventListener('pointerdown', (event) => {
    if (
      pointerId !== null ||
      (event.pointerType === 'mouse' && event.button !== 0)
    )
      return;
    pointerId = event.pointerId;
    previous = point(event);
    canvas.setPointerCapture(pointerId);
    disturb(previous.x, previous.y, 0, 0, true);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const current = point(event);
    disturb(
      current.x,
      current.y,
      current.x - previous.x,
      current.y - previous.y,
      false,
    );
    previous = current;
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((name) => {
    canvas.addEventListener(name, (event) => {
      if (event.pointerId === pointerId) {
        pointerId = null;
        previous = null;
      }
    });
  });
  canvas.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    disturb(0.5, 0.5, 0, 0, true);
  });
}

function createSmokeDemo(canvas) {
  const fluid = new Fluid(52);
  const view = createFluidView(fluid.n);
  let color = 0;
  const colors = [
    [0.75, 0.08, 0.03],
    [0.03, 0.4, 0.82],
    [0.48, 0.04, 0.65],
  ];

  const reset = () => {
    fluid.clear();
    seedWisps(fluid);
  };
  const render = () => {
    paintFluid(view, fluid);
    drawCroppedFluid(canvas, view);
  };
  attachPointer(canvas, (x, y, dx, dy, first) => {
    if (first) color = (color + 1) % colors.length;
    const fluidY = 1 / 6 + (y * 2) / 3;
    fluid.splat(
      x,
      fluidY,
      dx * 5,
      (dy * 10) / 3,
      colors[color].map((value) => value * 0.7),
    );
    render();
  });
  reset();
  render();
  return {
    canvas,
    step() {
      fluid.step(1 / 30, 0.00004, { fade: 0.02 });
    },
    render,
  };
}

function createViscosityDemo(canvas) {
  const low = new Fluid(48);
  const high = new Fluid(48);
  const lowView = createFluidView(low.n);
  const highView = createFluidView(high.n);

  const reset = () => {
    low.clear();
    high.clear();
    seedWisps(low, true);
    seedWisps(high, true);
  };
  const render = () => {
    paintFluid(lowView, low);
    paintFluid(highView, high);
    const context = canvas.getContext('2d', { alpha: false });
    const half = canvas.width / 2;
    context.fillStyle = '#071622';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawFluidCover(context, lowView.canvas, 0, 0, half, canvas.height);
    drawFluidCover(context, highView.canvas, half, 0, half, canvas.height);
    context.fillStyle = 'rgba(218, 242, 250, .5)';
    context.fillRect(half - 0.5, 0, 1, canvas.height);
  };
  attachPointer(canvas, (x, y, dx, dy) => {
    const localX = x < 0.5 ? x * 2 : (x - 0.5) * 2;
    const color = [0.04, 0.44, 0.8];
    low.splat(localX, y, dx * 5, dy * 5, color);
    high.splat(localX, y, dx * 5, dy * 5, color);
    render();
  });
  reset();
  render();
  return {
    canvas,
    step() {
      low.step(1 / 30, 0.00003, { fade: 0.02 });
      high.step(1 / 30, 0.008, { fade: 0.02 });
    },
    render,
  };
}

function createBuoyancyDemo(canvas) {
  const fluid = new Fluid(52);
  const view = createFluidView(fluid.n);
  let ticks = 0;

  const render = () => {
    paintFluid(view, fluid, 'warm');
    drawCroppedFluid(canvas, view);
  };
  attachPointer(canvas, (x, y, dx, dy) => {
    const fluidY = 1 / 6 + (y * 2) / 3;
    fluid.splat(x, fluidY, dx * 3, dy * 2 - 0.018, [0.12, 0.035, 0.008]);
    render();
  });
  for (let step = 0; step < 9; step++) {
    fluid.splat(
      0.5 + Math.sin(step * 0.9) * 0.035,
      0.79 - step * 0.04,
      0,
      -0.01,
      [0.032, 0.011, 0.003],
    );
  }
  render();
  return {
    canvas,
    step() {
      const x = 0.5 + Math.sin(ticks * 0.035) * 0.055;
      fluid.splat(
        x,
        0.79,
        Math.sin(ticks * 0.021) * 0.005,
        -0.012,
        [0.035, 0.012, 0.003],
      );
      const { n, stride, u, v, dye } = fluid;
      for (let y = 1; y <= n; y++) {
        for (let xIndex = 1; xIndex <= n; xIndex++) {
          const i = xIndex + y * stride;
          const smoke = dye[0][i] + dye[1][i] + dye[2][i];
          v[i] -= Math.min(0.0011, smoke * 0.00065);
          u[i] += Math.sin(y * 0.29 + ticks * 0.025) * smoke * 0.000018;
        }
      }
      fluid.step(1 / 30, 0.00012, { fade: 0.24 });
      ticks++;
    },
    render,
  };
}

document.querySelectorAll('[data-nse-gallery]').forEach((gallery) => {
  const demos = [
    createSmokeDemo(gallery.querySelector('[data-demo="smoke"] canvas')),
    createViscosityDemo(
      gallery.querySelector('[data-demo="viscosity"] canvas'),
    ),
    createBuoyancyDemo(gallery.querySelector('[data-demo="buoyancy"] canvas')),
  ];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const demo = demos.find((item) => item.canvas === entry.target);
      if (demo) demo.visible = entry.isIntersecting;
    });
  });
  demos.forEach((demo) => {
    demo.visible = false;
    observer.observe(demo.canvas);
  });

  let previousTime = 0;
  let accumulator = 0;
  function frame(time) {
    const elapsed = previousTime
      ? Math.min((time - previousTime) / 1000, 0.05)
      : 0;
    previousTime = time;
    if (!reducedMotion && !document.hidden) {
      accumulator += elapsed;
      let changed = false;
      while (accumulator >= 1 / 30) {
        demos.forEach((demo) => {
          if (demo.visible) demo.step();
        });
        accumulator -= 1 / 30;
        changed = true;
      }
      if (changed)
        demos.forEach((demo) => {
          if (demo.visible) demo.render();
        });
    } else {
      accumulator = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
