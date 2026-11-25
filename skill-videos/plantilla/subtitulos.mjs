#!/usr/bin/env node
// subtitulos.mjs · Escribe los subtítulos de TODO lo que dice la voz dentro de index.html.
//
//   node subtitulos.mjs                (usa index.html, assets/transcript.json y guion.txt)
//   node subtitulos.mjs index.html assets/transcript.json guion.txt
//
// - Toma los tiempos de cada palabra de la transcripción.
// - Si guion.txt tiene las mismas palabras, usa su ortografía (tildes, mayúsculas, signos).
// - Agrupa de 2 a 5 palabras (máx. 30 letras): corta en punto, coma, pausa ≥ 0,15 s o al llenarse.
// - Las comas NO salen en pantalla: se quitan al escribir cada subtítulo.
// - Un grupo a la vez, sin huecos que parpadeen. Lo reescribe entre
//   <!-- SUBTITULOS:INICIO … --> y <!-- SUBTITULOS:FIN -->.
import fs from "node:fs";

const [html = "index.html", tr = "assets/transcript.json", guion = "guion.txt"] = process.argv.slice(2);
const MAX_PAL = 5, MAX_LETRAS = 30, PAUSA = 0.15;
const CORTAS = new Set("el la los las un una unos unas lo al del de a en y e o u que con por para sin su sus mi tu se le les me te nos no ni muy más".split(" "));

function palabras(d) {
  if (Array.isArray(d)) return d.length && d[0].words ? d.flatMap((s) => s.words) : d;
  if (d.words) return d.words;
  if (d.segments) return d.segments.flatMap((s) => s.words || []);
  throw new Error(`No reconozco el formato de ${tr}`);
}

const datos = JSON.parse(fs.readFileSync(tr, "utf8"));
let ws = palabras(datos)
  .map((w) => ({ text: String(w.text ?? w.word ?? "").trim(), start: Number(w.start), end: Number(w.end) }))
  .filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end) && !/^[♪�\s]+$/.test(w.text));
if (!ws.length) throw new Error("La transcripción no tiene palabras.");

if (fs.existsSync(guion)) {
  const g = fs.readFileSync(guion, "utf8").split(/\s+/).filter(Boolean);
  if (g.length === ws.length) ws.forEach((w, i) => (w.text = g[i]));
  else console.warn(`Aviso: guion.txt tiene ${g.length} palabras y la transcripción ${ws.length}. Uso el texto de la transcripción: revisa que esté bien escrito.`);
}

const grupos = [];
let cur = [];
ws.forEach((w, i) => {
  cur.push(w);
  const sig = ws[i + 1];
  const texto = cur.map((x) => x.text).join(" ");
  const finFrase = /[.!?…:;»"]$/.test(w.text);
  const coma = /,$/.test(w.text) && cur.length >= 2;
  const pausa = sig && sig.start - w.end >= PAUSA;
  const lleno = cur.length >= MAX_PAL || (sig && texto.length + 1 + sig.text.length > MAX_LETRAS);
  if (!sig || finFrase || coma || pausa || lleno) {
    // no dejar «una», «de», «que»… colgando al final de la línea: pasan a la siguiente
    const ultima = w.text.toLowerCase().replace(/[^a-záéíóúüñ]/g, "");
    if (lleno && !finFrase && !coma && !pausa && sig && cur.length > 2 && CORTAS.has(ultima)) {
      const pasa = cur.pop(); grupos.push(cur); cur = [pasa];
    } else { grupos.push(cur); cur = []; }
  }
});

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const lineas = grupos.map((g, i) => {
  const ini = Math.max(0.1, g[0].start - 0.03);
  let fin = g[g.length - 1].end + 0.15;
  const sig = grupos[i + 1];
  if (sig) {
    const iniSig = Math.max(0.1, sig[0].start - 0.03);
    if (iniSig - fin < 0.4 || fin > iniSig) fin = iniSig; // sin parpadeos ni solapes
  }
  const dur = Math.max(0.2, fin - ini);
  // Sin comas en pantalla (25/11, lo pidió Rubén). En guion.txt se quedan: la voz las usa
  // para respirar, y arriba sirven para saber dónde cortar el subtítulo.
  const texto = esc(g.map((x) => x.text.replace(/,/g, "")).join(" "));
  return `      <div id="sub-${i + 1}" class="clip sub" data-start="${ini.toFixed(2)}" data-duration="${dur.toFixed(2)}" data-track-index="1"><span>${texto}</span></div>`;
});

const src = fs.readFileSync(html, "utf8");
const re = /(<!-- SUBTITULOS:INICIO[^>]*-->)[\s\S]*?(\s*<!-- SUBTITULOS:FIN -->)/;
if (!re.test(src)) throw new Error(`No encuentro las marcas SUBTITULOS:INICIO / SUBTITULOS:FIN en ${html}`);
fs.writeFileSync(html, src.replace(re, `$1\n${lineas.join("\n")}$2`));

const finVoz = ws[ws.length - 1].end;
console.log(`✓ ${grupos.length} subtítulos escritos en ${html}. La última palabra acaba en ${finVoz.toFixed(2)} s.`);
