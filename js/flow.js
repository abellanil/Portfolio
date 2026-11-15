/* Hero background: thin lines drifting along a slowly changing flow field.
   They bend around the cursor. Colours come from the CSS theme tokens. */

(function () {
  const canvas = document.querySelector('.hero__canvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  const pointer = { x: -9999, y: -9999 };

  let width = 0;
  let height = 0;
  let particles = [];
  let colours = { fg: '237,235,230', accent: '125,240,192' };
  let running = false;
  let frame = 0;

  function readColours() {
    const css = getComputedStyle(document.documentElement);
    colours = {
      fg: css.getPropertyValue('--fg-rgb').trim(),
      accent: css.getPropertyValue('--accent-rgb').trim(),
    };
  }

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 1.1,
      life: 120 + Math.random() * 260,
      accent: Math.random() < 0.16,
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(260, Math.round((width * height) / 6500));
    particles = Array.from({ length: count }, makeParticle);
  }

  // Direction of the flow at a point, changing slowly over time
  function angleAt(x, y, t) {
    return (
      Math.sin(x * 0.0021 + t * 0.00011) * 1.6 +
      Math.cos(y * 0.0029 - t * 0.00008) * 1.6 +
      Math.sin((x + y) * 0.0011 + t * 0.00005) * 1.2
    );
  }

  function step(t) {
    // Fade old trails instead of clearing, so lines leave a soft tail.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.045)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1;

    for (const p of particles) {
      let angle = angleAt(p.x, p.y, t);

      // Swirl around the cursor
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 220) {
        const pull = 1 - dist / 220;
        angle += pull * 2.4;
      }

      const nx = p.x + Math.cos(angle) * p.speed;
      const ny = p.y + Math.sin(angle) * p.speed;

      ctx.strokeStyle = p.accent
        ? `rgba(${colours.accent}, 0.75)`
        : `rgba(${colours.fg}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      p.x = nx;
      p.y = ny;
      p.life -= 1;

      if (p.life < 0 || nx < -10 || nx > width + 10 || ny < -10 || ny > height + 10) {
        Object.assign(p, makeParticle());
      }
    }
  }

  function loop(t) {
    if (!running) return;
    step(t);
    frame = requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  readColours();
  resize();

  if (reduceMotion) {
    // Draw a still pattern once instead of animating.
    for (let i = 0; i < 260; i++) step(i * 40);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  });
  window.addEventListener('pointerleave', () => {
    pointer.x = pointer.y = -9999;
  });

  // Only animate while the hero is on screen.
  new IntersectionObserver(([entry]) => {
    entry.isIntersecting ? start() : stop();
  }).observe(canvas);

  // main.js calls this after the theme changes.
  window.flowField = { refreshColours: readColours };
})();
