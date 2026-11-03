import fs from "node:fs/promises";
import sharp from "sharp";

const dir = "public/brand";
await fs.mkdir(dir, { recursive: true });

// The cap and its offset base remain distinct at favicon sizes and in one ink.
const cap = '<path d="M20 8h24a16 16 0 0 1 0 32H20a16 16 0 0 1 0-32Z"/>';
const base =
  '<path d="M6 39c4 6 9 9 16 9h20c7 0 12-3 16-9v3c0 9-7 16-16 16H22C13 58 6 51 6 42v-3Z"/>';
const mark = (ink = "#4169E1") =>
  `<g transform="rotate(-16 32 32)" fill="${ink}">${cap}${base}</g>`;
const iconSvg = (ink, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><title>${title}</title>${mark(ink)}</svg>`;
const placedMark = (x, y, size, ink = "#4169E1") =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 64 64">${mark(ink)}</svg>`;
const logo = iconSvg("#4169E1", "Animating Buttons press symbol");
await fs.writeFile(`${dir}/logo.svg`, `${logo}\n`);
await fs.writeFile(`${dir}/symbol.svg`, `${logo}\n`);
await fs.writeFile(
  `${dir}/logo-monochrome.svg`,
  `${iconSvg("#FFFFFF", "Animating Buttons monochrome press symbol")}\n`,
);

for (const [name, ink] of [
  ["wordmark", "#F5F5F7"],
  ["wordmark-light", "#111111"],
]) {
  await fs.writeFile(
    `${dir}/${name}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="96" viewBox="0 0 560 96"><title>Animating Buttons</title>${placedMark(0, 16, 64)}<text x="84" y="62" fill="${ink}" font-family="system-ui,sans-serif" font-weight="650" font-size="42" letter-spacing="-1.5">Animating Buttons</text></svg>\n`,
  );
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#000000"/><rect x="40" y="40" width="1120" height="550" rx="32" fill="#181818"/>${placedMark(96, 92, 104)}<text x="96" y="300" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="76" font-weight="700" letter-spacing="-3">Animating Buttons</text><text x="100" y="362" fill="#B5B5B5" font-family="system-ui,sans-serif" font-size="28">Community-made buttons. Ready for your next project.</text><rect x="96" y="430" width="290" height="64" rx="16" fill="#4169E1"/><text x="129" y="470" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="23" font-weight="600">Preview. Make. Share.</text><text x="832" y="545" fill="#91ACFF" font-family="system-ui,sans-serif" font-size="22">buttons.thespider.dev</text></svg>`;
await fs.writeFile(`${dir}/social-card.svg`, `${og}\n`);

const board = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680"><rect width="1200" height="680" fill="#000000"/>${placedMark(72, 72, 200)}<text x="328" y="126" fill="#91ACFF" font-family="system-ui,sans-serif" font-size="16" letter-spacing="2">ANIMATING BUTTONS</text><text x="328" y="202" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="60" font-weight="600" letter-spacing="-2">A mark made to click.</text><text x="328" y="250" fill="#AAAAAA" font-family="system-ui,sans-serif" font-size="22">A raised button cap. An offset base. A sense of movement.</text><rect x="72" y="344" width="504" height="224" rx="24" fill="#181818"/><text x="104" y="390" fill="#AAAAAA" font-family="system-ui,sans-serif" font-size="16">From favicon to wordmark</text>${placedMark(104, 438, 16)}${placedMark(160, 434, 24)}${placedMark(224, 430, 32)}${placedMark(296, 422, 48)}${placedMark(392, 414, 64)}<rect x="600" y="344" width="528" height="104" rx="24" fill="#F5F5F7"/>${placedMark(624, 364, 64)}<text x="712" y="408" fill="#111111" font-family="system-ui,sans-serif" font-size="30" font-weight="600" letter-spacing="-0.8">Animating Buttons</text><rect x="600" y="464" width="528" height="104" rx="24" fill="#181818"/>${placedMark(624, 484, 64, "#FFFFFF")}<text x="712" y="528" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="30" font-weight="600" letter-spacing="-0.8">Animating Buttons</text><text x="72" y="624" fill="#91ACFF" font-family="system-ui,sans-serif" font-size="16">ROYAL BLUE #4169E1</text><text x="328" y="624" fill="#AAAAAA" font-family="system-ui,sans-serif" font-size="16">BLACK #000000</text></svg>`;
await fs.writeFile(`${dir}/identity-preview.svg`, `${board}\n`);
for (const size of [32, 192, 512]) {
  await sharp(Buffer.from(logo))
    .resize(size, size)
    .png()
    .toFile(`${dir}/icon-${size}.png`);
}
await sharp(Buffer.from(logo))
  .resize(180, 180)
  .png()
  .toFile(`${dir}/apple-touch-icon.png`);
await sharp(Buffer.from(og)).png().toFile(`${dir}/social-card.png`);
for (const name of ["identity-preview", "brand-preview"]) {
  await sharp(Buffer.from(board)).png().toFile(`${dir}/${name}.png`);
}
const icon = await sharp(Buffer.from(logo)).resize(48, 48).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 48;
header[7] = 48;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(icon.length, 14);
header.writeUInt32LE(22, 18);
await fs.writeFile("public/favicon.ico", Buffer.concat([header, icon]));
