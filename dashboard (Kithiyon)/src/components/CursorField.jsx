import { useEffect, useRef } from 'react';

const SPACING = 26;      // distance between grid dots, in px
const RADIUS = 220;      // how far the pointer's influence reaches
const FOLLOW = 0.12;     // per-frame easing toward the pointer (higher = snappier)
const FADE = 0.08;       // per-frame easing of the glow in and out

/** Reads the palette from the active theme's CSS tokens. */
function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const accent = cs.getPropertyValue('--accent-rgb').trim().split(/\s+/).join(',');
  return {
    dot: cs.getPropertyValue('--dot').trim() || 'rgba(18,19,23,0.16)',
    accent: accent || '26,115,232',
  };
}

/**
 * A full-viewport dot field behind the page. Dots near the pointer brighten,
 * swell and lean toward it, and a soft glow follows it. Colours come from the
 * theme tokens, so it matches light and dark. Motion is skipped for users who
 * set reduced motion; they get the static field.
 */
export default function CursorField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let width = 0;
    let height = 0;
    let palette = readPalette();
    let frame = 0;
    let running = false;

    const pointer = {
      x: 0, y: 0,            // eased position, what is drawn
      tx: 0, ty: 0,          // target position, where the cursor is
      glow: 0, glowTarget: 0 // 0..1 strength of the glow and displacement
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      const { x: px, y: py, glow } = pointer;

      if (glow > 0.01) {
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, RADIUS * 1.6);
        gradient.addColorStop(0, `rgba(${palette.accent},${0.16 * glow})`);
        gradient.addColorStop(1, `rgba(${palette.accent},0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = c * SPACING;
          let y = r * SPACING;
          let size = 1.1;
          let fill = palette.dot;

          if (glow > 0.01) {
            const dx = x - px;
            const dy = y - py;
            const dist = Math.hypot(dx, dy) || 1;
            const t = Math.max(0, 1 - dist / RADIUS) * glow;
            if (t > 0) {
              const lean = t * 8; // lean toward the pointer
              x -= (dx / dist) * lean;
              y -= (dy / dist) * lean;
              size += 1.6 * t;
              fill = `rgba(${palette.accent},${0.3 + 0.6 * t})`;
            }
          }

          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // Runs only while something is still moving, so an idle page costs nothing.
    const step = () => {
      pointer.x += (pointer.tx - pointer.x) * FOLLOW;
      pointer.y += (pointer.ty - pointer.y) * FOLLOW;
      pointer.glow += (pointer.glowTarget - pointer.glow) * FADE;
      paint();

      const settled =
        Math.abs(pointer.tx - pointer.x) < 0.1 &&
        Math.abs(pointer.ty - pointer.y) < 0.1 &&
        Math.abs(pointer.glowTarget - pointer.glow) < 0.005;

      if (settled) {
        running = false;
      } else {
        frame = requestAnimationFrame(step);
      }
    };

    const requestPaint = () => {
      if (reducedMotion.matches) {
        pointer.glow = 0;
        paint();
        return;
      }
      if (!running) {
        running = true;
        frame = requestAnimationFrame(step);
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      requestPaint();
    };

    const onMove = (e) => {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      pointer.glowTarget = 1;
      if (pointer.glow === 0 && !running) {
        // First movement: start the glow from the cursor, not from the centre.
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      }
      requestPaint();
    };

    // Leaving the window (no related element) fades the glow out.
    const onOut = (e) => {
      if (e.relatedTarget === null) {
        pointer.glowTarget = 0;
        requestPaint();
      }
    };

    // Re-read the palette when the theme changes.
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      requestPaint();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('mouseout', onOut);

    return () => {
      cancelAnimationFrame(frame);
      running = false;
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('mouseout', onOut);
    };
  }, []);

  return <canvas ref={canvasRef} className="field" aria-hidden="true" />;
}
