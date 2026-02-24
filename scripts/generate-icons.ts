#!/usr/bin/env npx tsx
/**
 * Generates PWA icons as simple SVG-based PNGs.
 * Uses a canvas-free approach — writes SVG files that can be served directly.
 */

import { writeFileSync } from "fs";

function generateSvgIcon(size: number): string {
  const padding = Math.round(size * 0.15);
  const iconSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const radius = iconSize / 2;

  // Simple icon: ember circle with "CS" text
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#0a0a0a"/>
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#e8633b"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${Math.round(size * 0.35)}" fill="white">CS</text>
</svg>`;
}

// Generate SVG icons (these work as PWA icons in modern browsers)
const sizes = [192, 512];
for (const size of sizes) {
  const svg = generateSvgIcon(size);
  const path = `public/icons/icon-${size}.svg`;
  writeFileSync(path, svg);
  console.log(`Generated ${path}`);
}
