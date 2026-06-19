import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const markSvg = await readFile(join(root, "public/logo-mark.svg"));
const logoSvg = await readFile(join(root, "public/logo.svg"));

await mkdir(join(root, "src/app"), { recursive: true });

const icon32Path = join(root, "src/app/icon.png");
await sharp(markSvg).resize(32, 32).png().toFile(icon32Path);
await sharp(markSvg)
  .resize(180, 180)
  .png()
  .toFile(join(root, "src/app/apple-icon.png"));

await sharp(logoSvg)
  .resize(336, 64)
  .png()
  .toFile(join(root, "public/logo.png"));
await sharp(logoSvg)
  .resize(672, 128)
  .png()
  .toFile(join(root, "public/logo@2x.png"));

const toIco = await import("to-ico");
const iconBuffer = await readFile(icon32Path);
const icoBuffer = await toIco.default([iconBuffer]);
await Bun.write(join(root, "src/app/favicon.ico"), icoBuffer);

console.log("Generated brand PNG and favicon assets.");
