"use client";

import { useEffect, useRef } from "react";

const PALETTE = [
  "86,136,255",
  "122,108,255",
  "74,170,255",
  "150,118,255",
  "96,150,255",
];

const BLOBS = [
  { r: 0.66, a: 0.34, f1: 0.085, f2: 0.115, ph: 0, ox: 0.62, oy: 0.1, ax: 0.26, ay: 0.15 },
  { r: 0.52, a: 0.26, f1: 0.065, f2: 0.095, ph: 2.1, ox: 0.24, oy: 0.24, ax: 0.2, ay: 0.13 },
  { r: 0.46, a: 0.24, f1: 0.105, f2: 0.075, ph: 4.2, ox: 0.84, oy: 0.32, ax: 0.15, ay: 0.17 },
  { r: 0.4, a: 0.2, f1: 0.055, f2: 0.085, ph: 1.2, ox: 0.44, oy: 0.04, ax: 0.3, ay: 0.1 },
  { r: 0.34, a: 0.18, f1: 0.125, f2: 0.1, ph: 3.3, ox: 0.1, oy: 0.06, ax: 0.14, ay: 0.12 },
];

type Bloom = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
};

export function Rev9Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const intensity = 1.45;
    const blooms: Bloom[] = [];
    let width = 0;
    let height = 0;
    let mouseX = 0.5;
    let mouseY = 0.3;
    let easedX = mouseX;
    let easedY = mouseY;
    let animationFrame = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const handlePointerMove = (event: PointerEvent) => {
      mouseX = event.clientX / Math.max(width, 1);
      mouseY = event.clientY / Math.max(height, 1);
    };

    const handleClick = (event: MouseEvent) => {
      if (blooms.length < 3) {
        blooms.push({
          x: event.clientX,
          y: event.clientY,
          radius: 50,
          alpha: 0.2,
        });
      }
    };

    const applyFadeMask = () => {
      context.globalCompositeOperation = "destination-in";
      const mask = context.createLinearGradient(0, 0, 0, height);
      mask.addColorStop(0, "rgba(0,0,0,1)");
      mask.addColorStop(0.6, "rgba(0,0,0,0.85)");
      mask.addColorStop(1, "rgba(0,0,0,0.22)");
      context.fillStyle = mask;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
    };

    const drawBlooms = () => {
      context.globalCompositeOperation = "lighter";

      for (let index = blooms.length - 1; index >= 0; index -= 1) {
        const bloom = blooms[index];
        bloom.radius += 5.5;
        bloom.alpha *= 0.972;

        if (bloom.alpha < 0.008) {
          blooms.splice(index, 1);
          continue;
        }

        const glow = context.createRadialGradient(
          bloom.x,
          bloom.y,
          0,
          bloom.x,
          bloom.y,
          bloom.radius,
        );
        glow.addColorStop(0, `rgba(${PALETTE[0]},${bloom.alpha * intensity})`);
        glow.addColorStop(1, `rgba(${PALETTE[0]},0)`);
        context.fillStyle = glow;
        context.fillRect(
          bloom.x - bloom.radius,
          bloom.y - bloom.radius,
          bloom.radius * 2,
          bloom.radius * 2,
        );
      }

      context.globalCompositeOperation = "source-over";
    };

    const drawFrame = (time: number) => {
      if (!reduceMotion) {
        animationFrame = window.requestAnimationFrame(drawFrame);
      }

      if (document.hidden) {
        return;
      }

      context.clearRect(0, 0, width, height);
      easedX += (mouseX - easedX) * 0.035;
      easedY += (mouseY - easedY) * 0.035;
      context.globalCompositeOperation = "lighter";

      const seconds = time * 0.001;
      const baseRadius = Math.min(width, height);

      BLOBS.forEach((blob, index) => {
        const x =
          width *
            (blob.ox +
              blob.ax * Math.sin(seconds * blob.f1 * 6.2832 + blob.ph)) +
          (easedX - 0.5) * 70;
        const y =
          height *
            (blob.oy +
              blob.ay * Math.cos(seconds * blob.f2 * 6.2832 + blob.ph)) +
          (easedY - 0.5) * 46;
        const radius = baseRadius * blob.r;
        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(
          0,
          `rgba(${PALETTE[index % PALETTE.length]},${blob.a * intensity})`,
        );
        glow.addColorStop(1, `rgba(${PALETTE[index % PALETTE.length]},0)`);
        context.fillStyle = glow;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      });

      applyFadeMask();
      drawBlooms();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("click", handleClick);
    if (reduceMotion) {
      drawFrame(0);
    } else {
      animationFrame = window.requestAnimationFrame(drawFrame);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <>
      <style>{"html { background: transparent; }"}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-30 bg-[var(--surface-0)]"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_130%_110%_at_50%_0%,transparent_54%,oklch(0.10_0.005_250/0.56)_100%)]"
      />
    </>
  );
}
