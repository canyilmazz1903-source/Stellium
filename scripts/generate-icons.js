// Brand icon & splash generator — renders the Stellium mark (gold stellium
// cluster + eight-pointed star on deep navy) into every required asset.
// Run: node scripts/generate-icons.js
const sharp = require('sharp');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'images');

const GOLD_LIGHT = '#F2DA8E';
const GOLD = '#D4AF37';
const GOLD_DEEP = '#A8842A';
const NAVY = '#0B0F19';
const NAVY_LIGHT = '#161F33';

// The core mark: eight-pointed star + orbit arc carrying a 3-planet stellium
// cluster. Centered in a 1024 viewBox; `pad` scales the motif for safe zones.
function markSvg({ withBg, mono = false, scale = 1 }) {
  const g1 = mono ? '#FFFFFF' : GOLD_LIGHT;
  const g2 = mono ? '#FFFFFF' : GOLD;
  const g3 = mono ? '#FFFFFF' : GOLD_DEEP;
  const s = scale;

  return `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="${NAVY_LIGHT}"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${g1}"/>
      <stop offset="55%" stop-color="${g2}"/>
      <stop offset="100%" stop-color="${g3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${g2}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${g2}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  ${withBg ? `
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <!-- faint starfield -->
  <g fill="#FFFFFF">
    <circle cx="180" cy="200" r="4" opacity="0.20"/>
    <circle cx="840" cy="160" r="3" opacity="0.16"/>
    <circle cx="760" cy="360" r="2.5" opacity="0.14"/>
    <circle cx="150" cy="620" r="3" opacity="0.15"/>
    <circle cx="880" cy="700" r="4" opacity="0.18"/>
    <circle cx="300" cy="860" r="2.5" opacity="0.13"/>
    <circle cx="620" cy="120" r="2.5" opacity="0.15"/>
    <circle cx="90"  cy="420" r="2.5" opacity="0.12"/>
  </g>` : ''}

  <g transform="translate(512 512) scale(${s}) translate(-512 -512)">
    ${withBg ? '<!-- soft glow behind the mark --><circle cx="512" cy="470" r="330" fill="url(#glow)"/>' : ''}

    <!-- orbit ring -->
    <circle cx="512" cy="512" r="368" fill="none" stroke="url(#gold)" stroke-width="7" opacity="${mono ? 1 : 0.5}"/>

    <!-- guiding star: clean concave four-point sparkle + soft 45° echo -->
    <g transform="translate(512 452)">
      <path fill="url(#gold)" opacity="${mono ? 0.7 : 0.45}" transform="rotate(45)" d="
        M 0 -128 C 6 -44 34 -9 92 0
        C 34 9 6 44 0 128
        C -6 44 -34 9 -92 0
        C -34 -9 -6 -44 0 -128 Z"/>
      <path fill="url(#gold)" d="
        M 0 -224 C 9 -66 48 -13 132 0
        C 48 13 9 66 0 224
        C -9 66 -48 13 -132 0
        C -48 -13 -9 -66 0 -224 Z"/>
      <circle cx="0" cy="0" r="20" fill="${mono ? '#FFFFFF' : GOLD_LIGHT}"/>
    </g>

    <!-- the STELLIUM: three planets clustered on the orbit's lower arc -->
    <circle cx="716" cy="800" r="40" fill="url(#gold)"/>
    <circle cx="620" cy="856" r="27" fill="url(#gold)" opacity="0.95"/>
    <circle cx="792" cy="726" r="19" fill="url(#gold)" opacity="0.9"/>
    <!-- tiny highlight on the big planet -->
    ${mono ? '' : `<circle cx="704" cy="788" r="12" fill="${GOLD_LIGHT}" opacity="0.8"/>`}
  </g>
</svg>`;
}

async function main() {
  // 1) Main app icon (iOS + top-level): full background, comfortable margin
  await sharp(Buffer.from(markSvg({ withBg: true, scale: 0.92 })))
    .resize(1024, 1024).png().toFile(path.join(OUT, 'icon.png'));

  // 2) Android adaptive foreground: transparent bg, motif shrunk to safe zone
  await sharp(Buffer.from(markSvg({ withBg: false, scale: 0.62 })))
    .resize(1024, 1024).png().toFile(path.join(OUT, 'android-icon-foreground.png'));

  // 3) Android adaptive background: brand navy gradient
  const bgSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="${NAVY_LIGHT}"/>
      <stop offset="100%" stop-color="${NAVY}"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
</svg>`;
  await sharp(Buffer.from(bgSvg)).resize(1024, 1024).png()
    .toFile(path.join(OUT, 'android-icon-background.png'));

  // 4) Android monochrome (themed icons): white motif on transparent
  await sharp(Buffer.from(markSvg({ withBg: false, mono: true, scale: 0.62 })))
    .resize(1024, 1024).png().toFile(path.join(OUT, 'android-icon-monochrome.png'));

  // 5) Splash icon: motif on transparent (splash bg color comes from app.json)
  await sharp(Buffer.from(markSvg({ withBg: false, scale: 0.9 })))
    .resize(512, 512).png().toFile(path.join(OUT, 'splash-icon.png'));

  // 6) Favicon
  await sharp(Buffer.from(markSvg({ withBg: true, scale: 0.95 })))
    .resize(48, 48).png().toFile(path.join(OUT, 'favicon.png'));

  console.log('All brand assets generated into assets/images/');
}

main().catch((e) => { console.error(e); process.exit(1); });
