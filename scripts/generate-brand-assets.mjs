/**
 * Genera los assets de marca a partir del logo original.
 *
 * El logo original (src/assets/brand/logo-source.png) es un PNG sin canal alfa:
 * una manzana color menta sobre fondo blanco, casi invisible sobre fondos claros.
 * Este script extrae la silueta como máscara de transparencia y la recolorea con
 * los colores de marca, para obtener un logo utilizable en cualquier fondo.
 *
 * Uso: pnpm brand:assets   (los archivos generados se versionan en el repo)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = 'src/assets/brand/logo-source.png';
const BRAND_600 = { r: 0x2e, g: 0x8b, b: 0x57 };
const BRAND_700 = '#237047';
const BRAND_950 = '#0b2a1b';
const WHITE = { r: 255, g: 255, b: 255 };

/** Silueta del logo como máscara (1 canal), recortada y centrada en un lienzo cuadrado. */
async function logoMask(size, paddingRatio = 0) {
  const trimmed = await sharp(SOURCE).trim({ threshold: 12 }).toBuffer();
  const { data, info } = await sharp(trimmed)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Tono del relleno = valor de gris más frecuente que no sea blanco.
  const histogram = new Array(256).fill(0);
  for (const value of data) if (value < 245) histogram[value]++;
  const fillGray = histogram.indexOf(Math.max(...histogram));

  // Blanco -> transparente; relleno (y bordes más oscuros) -> opaco; antialias proporcional.
  const alpha = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    const coverage = (255 - data[i]) / (255 - fillGray);
    alpha[i] = Math.round(Math.min(1, Math.max(0, coverage)) * 255);
  }

  const inner = Math.round(size * (1 - paddingRatio * 2));
  return sharp(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.floor((size - inner) / 2),
      bottom: Math.ceil((size - inner) / 2),
      left: Math.floor((size - inner) / 2),
      right: Math.ceil((size - inner) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extractChannel(0)
    .png()
    .toBuffer();
}

/** Logo de un color sólido sobre fondo transparente. */
async function coloredLogo(size, color, paddingRatio = 0) {
  const mask = await logoMask(size, paddingRatio);
  return sharp({ create: { width: size, height: size, channels: 3, background: color } })
    .joinChannel(mask)
    .png()
    .toBuffer();
}

/** Icono: logo blanco sobre un cuadrado redondeado de color de marca. */
async function appIcon(size, { rounded = true } = {}) {
  const radius = rounded ? Math.round(size * 0.22) : 0;
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND_700}"/>
     </svg>`,
  );
  const logo = await coloredLogo(size, WHITE, 0.17);
  return sharp(background)
    .composite([{ input: logo }])
    .png()
    .toBuffer();
}

/** Contenedor .ico con imágenes PNG embebidas (formato soportado por todos los navegadores). */
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, buffer } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buffer.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buffer)]);
}

/** Imagen para redes sociales (Open Graph / Twitter), 1200x630. */
async function openGraphImage() {
  const width = 1200;
  const height = 630;
  const photoWidth = 520;
  const photo = await sharp('src/assets/images/hero-bowl.jpg')
    .resize(photoWidth, height, { fit: 'cover', position: 'centre' })
    .toBuffer();
  const logo = await coloredLogo(120, WHITE);
  const font = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  const panel = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
       <rect width="${width}" height="${height}" fill="${BRAND_950}"/>
       <text x="80" y="300" font-family="${font}" font-size="68" font-weight="800" fill="#ffffff">Healthy Bites</text>
       <text x="80" y="370" font-family="${font}" font-size="30" fill="#c4f2d0">Nutrición, hábitos y comunidad</text>
       <text x="80" y="414" font-family="${font}" font-size="30" fill="#c4f2d0">en un solo lugar.</text>
       <rect x="80" y="470" width="96" height="6" rx="3" fill="#5bbf85"/>
     </svg>`,
  );
  return sharp(panel)
    .composite([
      { input: logo, left: 80, top: 120 },
      { input: photo, left: width - photoWidth, top: 0 },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

await mkdir('public', { recursive: true });

const outputs = {
  'src/assets/brand/logo-mark.png': await coloredLogo(512, BRAND_600),
  'src/assets/brand/logo-mark-white.png': await coloredLogo(512, WHITE),
  'public/apple-touch-icon.png': await appIcon(180, { rounded: false }),
  'public/icon-512.png': await appIcon(512),
  'public/favicon.ico': toIco(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, buffer: await appIcon(size) }))),
  ),
  'public/og-image.jpg': await openGraphImage(),
};

for (const [path, buffer] of Object.entries(outputs)) {
  await writeFile(path, buffer);
  console.log(`✔ ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
}
