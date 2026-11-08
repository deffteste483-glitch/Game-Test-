import React, { useEffect, useRef } from 'react';

interface TavernAmbienceCanvasProps {
  fireplaceActive?: boolean;
  rainActive?: boolean;
}

/**
 * Full-viewport 60fps atmospheric particle & lighting overlay (`pointer-events: none`):
 * - Flickering fireplace flames & rising hearth embers
 * - Oscillating warm candle halos on wall sconces, chandelier, and counter lantern
 * - Illuminated floating golden dust particles
 * - Subtle rain streaks in the right-hand window and doorway
 */
export const TavernAmbienceCanvas: React.FC<TavernAmbienceCanvasProps> = ({
  fireplaceActive = true,
  rainActive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ fireplaceActive, rainActive });

  useEffect(() => {
    propsRef.current = { fireplaceActive, rainActive };
  }, [fireplaceActive, rainActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Pre-allocated Zero-GC Particle Pools
    // 1. Dust Motes (56 particles)
    const DUST_COUNT = 56;
    const dustX = new Float32Array(DUST_COUNT);
    const dustY = new Float32Array(DUST_COUNT);
    const dustVx = new Float32Array(DUST_COUNT);
    const dustVy = new Float32Array(DUST_COUNT);
    const dustSize = new Float32Array(DUST_COUNT);
    const dustPhase = new Float32Array(DUST_COUNT);

    for (let i = 0; i < DUST_COUNT; i++) {
      dustX[i] = Math.random();
      dustY[i] = Math.random();
      dustVx[i] = (Math.random() - 0.5) * 0.012;
      dustVy[i] = -0.005 - Math.random() * 0.01;
      dustSize[i] = 1.1 + Math.random() * 2.1;
      dustPhase[i] = Math.random() * Math.PI * 2;
    }

    // 2. Hearth Flame & Ember Pool (36 particles centered around the stone fireplace)
    const EMBER_COUNT = 36;
    const emberX = new Float32Array(EMBER_COUNT);
    const emberY = new Float32Array(EMBER_COUNT);
    const emberVy = new Float32Array(EMBER_COUNT);
    const emberLife = new Float32Array(EMBER_COUNT);
    const emberSize = new Float32Array(EMBER_COUNT);

    const resetEmber = (i: number) => {
      // Hearth is around X: 0.50..0.57, Y: 0.54..0.63 in the 16:9 background
      emberX[i] = 0.505 + Math.random() * 0.065;
      emberY[i] = 0.59 + Math.random() * 0.04;
      emberVy[i] = 0.04 + Math.random() * 0.07;
      emberLife[i] = Math.random();
      emberSize[i] = 2 + Math.random() * 5;
    };
    for (let i = 0; i < EMBER_COUNT; i++) resetEmber(i);

    // 3. Rain Streaks in the window & doorway (44 drops)
    const RAIN_COUNT = 44;
    const rainX = new Float32Array(RAIN_COUNT);
    const rainY = new Float32Array(RAIN_COUNT);
    const rainSpeed = new Float32Array(RAIN_COUNT);
    const rainLen = new Float32Array(RAIN_COUNT);

    for (let i = 0; i < RAIN_COUNT; i++) {
      // Window (0.72..0.82) & Open Rainy Doorway (0.89..0.99)
      const inWindow = i % 2 === 0;
      rainX[i] = inWindow ? 0.73 + Math.random() * 0.09 : 0.89 + Math.random() * 0.10;
      rainY[i] = inWindow ? 0.28 + Math.random() * 0.24 : 0.24 + Math.random() * 0.45;
      rainSpeed[i] = 0.35 + Math.random() * 0.25;
      rainLen[i] = 10 + Math.random() * 14;
    }

    // Candle light anchor points in normalized screen coordinates
    const candlePoints = [
      { x: 0.034, y: 0.17, r: 0.065 }, // Left shelf sconce
      { x: 0.205, y: 0.21, r: 0.055 }, // Shelf lantern
      { x: 0.33, y: 0.24, r: 0.065 },  // Twin wall candles
      { x: 0.425, y: 0.31, r: 0.05 },  // Left mantel candle
      { x: 0.595, y: 0.13, r: 0.09 },  // Chandelier center
      { x: 0.855, y: 0.30, r: 0.055 }, // Right wall candle
      { x: 0.785, y: 0.57, r: 0.045 }, // Small round table candle
      { x: 0.11, y: 0.82, r: 0.095 },  // Foreground counter oil lamp
    ];

    let lastTime = performance.now();
    let animId = 0;
    let timerId = 0;
    let disposed = false;

    const tick = (now: number) => {
      if (disposed) return;
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // Clamped dt per game craft guidelines
      lastTime = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, width, height);

      // 1. Oscillating Candle Halos
      for (let i = 0; i < candlePoints.length; i++) {
        const c = candlePoints[i];
        const flicker =
          0.85 +
          0.15 * Math.sin(t * (5.2 + i * 0.7) + i) * Math.cos(t * (8.3 + i * 0.4));
        const cx = c.x * width;
        const cy = c.y * height;
        const radius = c.r * Math.max(width, height) * flicker;

        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius);
        grad.addColorStop(0, 'rgba(255, 220, 135, 0.26)');
        grad.addColorStop(0.45, 'rgba(235, 155, 45, 0.10)');
        grad.addColorStop(1, 'rgba(235, 155, 45, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Fireplace Hearth Glow & Moving Flames
      if (propsRef.current.fireplaceActive) {
        const hx = 0.538 * width;
        const hy = 0.575 * height;
        const hearthFlicker = 0.9 + 0.12 * Math.sin(t * 7.5) * Math.sin(t * 13.1);
        const hearthRadius = Math.max(width, height) * 0.19 * hearthFlicker;

        const hGrad = ctx.createRadialGradient(hx, hy, 4, hx, hy, hearthRadius);
        hGrad.addColorStop(0, 'rgba(255, 185, 65, 0.32)');
        hGrad.addColorStop(0.5, 'rgba(214, 88, 24, 0.14)');
        hGrad.addColorStop(1, 'rgba(214, 88, 24, 0)');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, hearthRadius, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < EMBER_COUNT; i++) {
          emberLife[i] += dt * (0.7 + (i % 3) * 0.25);
          emberY[i] -= emberVy[i] * dt;
          const sway = Math.sin(t * 6 + i) * 0.004;
          const ex = (emberX[i] + sway) * width;
          const ey = emberY[i] * height;

          if (emberLife[i] >= 1) {
            resetEmber(i);
            continue;
          }

          const alpha = (1 - emberLife[i]) * 0.75;
          const r = emberSize[i] * (1 - emberLife[i] * 0.5);
          ctx.fillStyle =
            emberLife[i] < 0.4
              ? `rgba(255, 230, 140, ${alpha.toFixed(2)})`
              : `rgba(242, 115, 34, ${alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(ex, ey, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Discreet Rain in Window & Doorway
      if (propsRef.current.rainActive) {
        ctx.strokeStyle = 'rgba(185, 210, 235, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < RAIN_COUNT; i++) {
          const inWindow = i % 2 === 0;
          const minY = inWindow ? 0.29 : 0.25;
          const maxY = inWindow ? 0.52 : 0.67;

          rainY[i] += rainSpeed[i] * dt;
          if (rainY[i] > maxY) {
            rainY[i] = minY;
          }

          const rx = rainX[i] * width;
          const ry = rainY[i] * height;
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 2, ry + rainLen[i]);
        }
        ctx.stroke();
      }

      // 4. Illuminated Floating Dust Motes
      for (let i = 0; i < DUST_COUNT; i++) {
        dustX[i] += dustVx[i] * dt + Math.sin(t * 0.8 + dustPhase[i]) * 0.00015;
        dustY[i] += dustVy[i] * dt;

        if (dustY[i] < 0.04) {
          dustY[i] = 0.94;
          dustX[i] = Math.random();
        }
        if (dustX[i] < 0.02) dustX[i] = 0.98;
        if (dustX[i] > 0.98) dustX[i] = 0.02;

        const dx = dustX[i] * width;
        const dy = dustY[i] * height;
        const shimmer = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.9 + dustPhase[i]));

        ctx.fillStyle = `rgba(247, 216, 124, ${shimmer.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(dx, dy, dustSize[i], 0, Math.PI * 2);
        ctx.fill();
      }

      timerId = window.setTimeout(() => {
        if (!disposed) animId = requestAnimationFrame(tick);
      }, 65);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="tavern-ambience-canvas"
      className="pointer-events-none fixed inset-0 z-10 w-full h-full"
      aria-hidden="true"
    />
  );
};
