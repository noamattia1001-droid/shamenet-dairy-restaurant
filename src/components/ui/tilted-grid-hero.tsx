"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── the curved row ──────────────────────────────────────────────
 * One row of images streams around the inside of a cylinder: flat at the
 * centre, the ends bending toward the viewer and fading into the page.
 *
 * Drawn on a single <canvas>. The CSS version cut every tile into 16
 * separately transformed strips; the compositor updated those layers out
 * of step, which tore the image into a visibly jumping vertical seam on
 * some screens. One canvas is painted whole every frame, so it can't tear.
 * ─────────────────────────────────────────────────────────────── */

// Strips per tile when painting. Each is a sliver of arc; enough that the
// curve reads as smooth, and since they're one bitmap there are no seams.
const SLICES = 28;

// Camera distance from the screen, as a multiple of the cylinder's radius.
const CAMERA = 1.6;

// A tile is never wider than this share of the hero.
const MAX_WIDTH = 55;

/** Cylinder radius, as a share of the width, that puts the frame's edge `bend` radians round. */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

/** Projection scale for a point `a` radians round the cylinder. */
const scaleAt = (a: number) => CAMERA / (CAMERA - 1 + Math.cos(a));

export type TiltedGridImage = {
  src: string;
  alt?: string;
};

export type TiltedGridHeroProps = {
  images: TiltedGridImage[];
  /** Seconds for the row to advance by one tile. @default 4 */
  speed?: number;
  /** Tile height, as a percentage of the hero's height. @default 26 */
  tileHeight?: number;
  /** Tile width divided by tile height. @default 16 / 9 */
  aspectRatio?: number;
  /** Space between tiles, as a percentage of a tile's height. @default 6 */
  gap?: number;
  /** Vertical centre of the row, as a percentage of the hero's height. @default 56 */
  axis?: number;
  /** How far the row bends by the frame's edge, in degrees (5–85). @default 80 */
  curve?: number;
  /** Width of the fade at each end, as a percentage of the hero's width. @default 12 */
  fade?: number;
  children?: React.ReactNode;
  className?: string;
};

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;

  // Decoded images by src; a tile is skipped until its image is ready, so
  // the first photos appear as soon as they arrive instead of all at once.
  const loaded = React.useRef(new Map<string, HTMLImageElement>());
  React.useEffect(() => {
    for (const { src } of images) {
      if (loaded.current.has(src)) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img.decode().then(
        () => loaded.current.set(src, img),
        () => {},
      );
    }
  }, [images]);

  React.useEffect(() => {
    const host = ref.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dpr = 1;
    const ro = new ResizeObserver(([entry]) => {
      W = entry.contentRect.width;
      H = entry.contentRect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    });
    ro.observe(host);

    // Only animate while the band is on screen.
    let onScreen = true;
    const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
    io.observe(host);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!onScreen || !W || !H) return;

      const h = Math.min((tileHeight / 100) * H, ((MAX_WIDTH / 100) * W) / aspectRatio);
      const R = W * arc(bend);
      if (!(h > 0) || !(R > 0)) return;

      const tileAng = (aspectRatio * h) / R;
      const pitch = tileAng + ((gap / 100) * h) / R;
      // Visible until a whole tile past the frame's edge (perspective swells
      // edge tiles), capped well short of 90° where the projection blows up.
      const limit = Math.min(bend + tileAng * 1.2, (88 * Math.PI) / 180);
      const columns = Math.max(2, Math.ceil((2 * limit) / pitch) + 1);
      const loop = columns * pitch;

      const elapsed = still ? 0 : (now - start) / 1000;
      const travelled = (elapsed / speed) * pitch;
      const cx = W / 2;
      const cy = (axis / 100) * H;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingQuality = "high";

      for (let t = 0; t < columns; t++) {
        // Right to left: angle decreases over time, wrapping off-screen.
        const unwrapped = t * pitch - travelled;
        const lap = Math.floor((unwrapped + loop / 2) / loop);
        const centre = unwrapped - lap * loop;
        if (Math.abs(centre) - tileAng / 2 > limit) continue;

        // Each wrap (always off-screen) hands the tile the next image in
        // line, so the whole list plays through and neighbours never repeat.
        const n = images.length || 1;
        const item = images[(((t - lap * columns) % n) + n) % n];
        const img = item && loaded.current.get(item.src);
        if (!img) continue;

        // object-cover crop of the source to the tile's aspect ratio.
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const sw = Math.min(iw, ih * aspectRatio);
        const sh = sw / aspectRatio;
        const sx = (iw - sw) / 2;
        const sy = (ih - sh) / 2;

        for (let k = 0; k < SLICES; k++) {
          const a0 = centre - tileAng / 2 + (k / SLICES) * tileAng;
          const a1 = a0 + tileAng / SLICES;
          const s0 = scaleAt(a0);
          const s1 = scaleAt(a1);
          const x0 = cx + R * Math.sin(a0) * s0;
          const x1 = cx + R * Math.sin(a1) * s1;
          if (x1 < 0 || x0 > W) continue;
          const sh0 = h * ((s0 + s1) / 2);
          ctx.drawImage(
            img,
            sx + (k / SLICES) * sw,
            sy,
            sw / SLICES,
            sh,
            x0,
            cy - sh0 / 2,
            // A hair of overlap so neighbouring slivers never show a gap.
            x1 - x0 + 0.6,
            sh0,
          );
        }
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [images, speed, tileHeight, aspectRatio, gap, axis, bend]);

  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${100 - fade}%,transparent)`;

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      />
      {children}
    </div>
  );
}

export default TiltedGridHero;
