import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

// Stopwatch icon: slate-800 background, white outline timer with tick marks
// and a workout/rest split arc (green/amber matching the timer phases)
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1e293b"/>

  <!-- Crown/button on top -->
  <rect x="232" y="60" width="48" height="32" rx="8" fill="#94a3b8"/>
  <rect x="216" y="84" width="80" height="20" rx="6" fill="#cbd5e1"/>

  <!-- Outer ring (workout phase color: emerald) -->
  <circle cx="256" cy="288" r="160" fill="none" stroke="#10b981" stroke-width="24"
    stroke-dasharray="670 335" stroke-dashoffset="0" transform="rotate(-90 256 288)"/>
  <!-- Rest phase arc: amber -->
  <circle cx="256" cy="288" r="160" fill="none" stroke="#f59e0b" stroke-width="24"
    stroke-dasharray="335 670" stroke-dashoffset="-670" transform="rotate(-90 256 288)"/>

  <!-- Inner face -->
  <circle cx="256" cy="288" r="132" fill="#0f172a"/>

  <!-- Tick marks -->
  <g stroke="#ffffff" stroke-width="6" stroke-linecap="round">
    <line x1="256" y1="168" x2="256" y2="188"/>
    <line x1="376" y1="288" x2="356" y2="288"/>
    <line x1="256" y1="408" x2="256" y2="388"/>
    <line x1="136" y1="288" x2="156" y2="288"/>
  </g>

  <!-- Clock hands -->
  <line x1="256" y1="288" x2="256" y2="200" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>
  <line x1="256" y1="288" x2="320" y2="288" stroke="#10b981" stroke-width="10" stroke-linecap="round"/>
  <circle cx="256" cy="288" r="12" fill="#ffffff"/>
</svg>
`;

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-maskable-512.png", size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, name));
  console.log(`✓ ${name}`);
}

console.log("\nAll icons generated.");
