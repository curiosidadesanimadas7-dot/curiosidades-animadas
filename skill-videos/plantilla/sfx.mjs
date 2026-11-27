#!/usr/bin/env node
// sfx.mjs · Mete los efectos de sonido en index.html a partir de sfx.json.
//
//   node sfx.mjs                 (usa sfx.json e index.html)
//
// sfx.json es una lista, en segundos de la transcripción:
//   [ { "t": 1.6, "efecto": "whoosh" }, { "t": 4.15, "efecto": "impact-bass-1", "vol": 0.4 }, ... ]
//
// - Los sonidos salen de la biblioteca de media-use (Pixabay: uso comercial, sin créditos).
//   Se copian a assets/sfx/. Efectos: whoosh, whoosh-short, whoosh-cinematic, impact-bass-1,
//   impact-bass-2, pop, click, click-soft, key-press, typing, ping, chime, sparkle, notification,
//   error, glitch-1, glitch-2, glitch-3, riser (10 s: ponlo 10 s antes del clímax), y "tictac"
//   (un reloj: 4 clics suaves seguidos, para cronómetros y esperas).
// - Volumen por defecto 0,3: van POR DEBAJO de la voz, nunca la tapan.
// - Reparte los sonidos en pistas (4-11) para que no se pisen. Lo reescribe entre
//   <!-- SFX:INICIO … --> y <!-- SFX:FIN -->.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const [lista = "sfx.json", html = "index.html"] = process.argv.slice(2);
const BIBLIO = [
  path.join(os.homedir(), ".claude/skills/media-use/audio/assets/sfx"),
  path.join(process.cwd(), "node_modules/hyperframes/skills/media-use/audio/assets/sfx"),
].find((d) => fs.existsSync(path.join(d, "manifest.json")));
if (!BIBLIO) throw new Error("No encuentro la biblioteca de efectos de media-use (~/.claude/skills/media-use/audio/assets/sfx).");
const manifest = JSON.parse(fs.readFileSync(path.join(BIBLIO, "manifest.json"), "utf8"));
const dur = (k) => Number((manifest[k] || {}).duration || 1);

let cues = JSON.parse(fs.readFileSync(lista, "utf8"));
if (!Array.isArray(cues)) throw new Error(`${lista} tiene que ser una lista [ {t, efecto}, ... ]`);
// "tictac" = cuatro clics suaves, uno cada 0,5 s
cues = cues.flatMap((c) => (c.efecto === "tictac"
  ? [0, 0.5, 1, 1.5].map((d) => ({ t: c.t + d, efecto: "click-soft", vol: c.vol ?? 0.35 }))
  : [c]));

fs.mkdirSync("assets/sfx", { recursive: true });
const pistas = []; // fin de lo último puesto en cada pista
const malos = [];
const lineas = [];
cues.sort((a, b) => a.t - b.t).forEach((c, i) => {
  const k = String(c.efecto || "").replace(/\.mp3$/, "");
  if (!manifest[k]) { malos.push(c.efecto); return; }
  const destino = `assets/sfx/${k}.mp3`;
  if (!fs.existsSync(destino)) fs.copyFileSync(path.join(BIBLIO, `${k}.mp3`), destino);
  const t = Math.max(0, Number(c.t));
  const d = dur(k);
  let p = pistas.findIndex((fin) => fin <= t);
  if (p < 0) { p = pistas.length; pistas.push(0); }
  if (p > 7) { malos.push(`${k} en ${t}s (demasiados a la vez)`); return; }
  pistas[p] = t + d;
  const vol = Math.min(0.6, Math.max(0.05, Number(c.vol ?? 0.3)));
  lineas.push(`      <audio id="sfx-${i + 1}" class="clip" src="${destino}" data-start="${t.toFixed(2)}" data-duration="${d.toFixed(2)}" data-track-index="${4 + p}" data-volume="${vol}"></audio>`);
});

const src = fs.readFileSync(html, "utf8");
const re = /(<!-- SFX:INICIO[^>]*-->)[\s\S]*?(\s*<!-- SFX:FIN -->)/;
if (!re.test(src)) throw new Error(`No encuentro las marcas SFX:INICIO / SFX:FIN en ${html}`);
fs.writeFileSync(html, src.replace(re, `$1\n${lineas.join("\n")}$2`));
console.log(`✓ ${lineas.length} efectos de sonido en ${html}, en ${pistas.length} pistas.`);
if (malos.length) console.warn(`Aviso: no he puesto: ${malos.join(", ")}. Efectos válidos: ${Object.keys(manifest).join(", ")}, tictac.`);
