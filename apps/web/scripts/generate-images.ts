import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

const faviconSvg = readFileSync(resolve(publicDir, "favicon.svg"), "utf-8");

async function generateOgpImage() {
  const ogpSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a4181"/>
      <stop offset="100%" style="stop-color:#3d366d"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Calendar icon (scaled up, centered horizontally at x=520) -->
  <g transform="translate(520, 120) scale(5)">
    <rect x="2" y="6" width="28" height="24" rx="4" fill="rgba(255,255,255,0.15)"/>
    <rect x="2" y="6" width="28" height="7" rx="4" fill="rgba(255,255,255,0.25)"/>
    <rect x="9" y="3" width="3" height="7" rx="1.5" fill="#fff"/>
    <rect x="20" y="3" width="3" height="7" rx="1.5" fill="#fff"/>
    <rect x="22.75" y="19.5" width="2.5" height="7" rx="0.6" fill="#fff"/>
    <rect x="20.5" y="21.75" width="7" height="2.5" rx="0.6" fill="#fff"/>
  </g>
  <!-- App name -->
  <text x="600" y="430" text-anchor="middle" font-family="system-ui,sans-serif" font-size="72" font-weight="700" fill="#ffffff" letter-spacing="-1">tascal</text>
  <!-- Tagline -->
  <text x="600" y="490" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="rgba(255,255,255,0.8)">カレンダーで、タスクをかんたん管理</text>
</svg>`;

  const png = await sharp(Buffer.from(ogpSvg)).png().toBuffer();
  writeFileSync(resolve(publicDir, "ogp.png"), png);
  console.log("Generated ogp.png (1200x630)");
}

async function generateIcons() {
  const svgBuffer = Buffer.from(faviconSvg);

  const sizes: [string, number][] = [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ];

  for (const [name, size] of sizes) {
    const png = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    writeFileSync(resolve(publicDir, name), png);
    console.log(`Generated ${name} (${size}x${size})`);
  }
}

async function main() {
  await generateIcons();
  await generateOgpImage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
