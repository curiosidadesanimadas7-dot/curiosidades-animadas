// estilo3d.js · Motor del estilo «cartoon 3D» para HyperFrames
// Personajes 3D de cabeza de judía en un mundo 3D pintado, con líneas de tinta,
// luz cálida y sombras azuladas, sin desenfoque de fondo.
//
// NO edites este archivo para cada vídeo: lo que cambia (sitio, personajes,
// cámara, acciones) va en escena.js. Si de verdad hace falta tocar el look,
// cambia las constantes de ESTILO y LUCES, no la lógica.
//
// Todo es función del tiempo t (segundos): nada de Math.random, Date.now ni
// requestAnimationFrame. Así cada render sale idéntico.

import * as THREE from "three";
export { THREE };

// ───────────────────────── utilidades ─────────────────────────

/** Azar con semilla (mulberry32). Úsalo en vez de Math.random(). */
export function azar(semilla = 1) {
  let a = semilla >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
/** smootherstep: la curva de todos los movimientos de cámara (entra y sale suave). */
export const suave = (u) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const rad = (g) => (g * Math.PI) / 180;
const lin = (hex) => new THREE.Color(hex); // hex sRGB → color lineal (ColorManagement de three)

// ───────────────────────── look ─────────────────────────

/** Valores del estilo (medidos sobre los shorts de referencia, ver referencias/estilo.md). */
export const ESTILO = {
  tintaMundo: "#0b0a0c",   // líneas del mundo: casi negro
  tintaPersonaje: "#241726", // contorno y palitos de los personajes: ciruela oscuro
  anchoTinta: 3.8,          // px a 1080×1920 en siluetas y saltos de profundidad (sale una línea de ~3,5 px)
  anchoPliegue: 1.6,        // px de radio en las aristas (salen ~3 px)
  saturacion: 1.08,
  vineta: 0.14,             // esquinas ~0,86 del centro
  fps: 60,
};

/**
 * Luces por momento del día. lit/shade multiplican el color (lineal).
 * sol: az = grados desde el eje de la cámara (0 = de frente, contraluz;
 * 90 = de lado; 180 = detrás de la cámara), el = altura en grados.
 * El sol va pegado a cada plano: se calcula al empezar el plano y no se mueve.
 */
export const LUCES = {
  dia: {
    lit: [1.06, 1.0, 0.9], shade: [0.47, 0.47, 0.64],
    cieloArriba: "#3f86dc", cieloHorizonte: "#b9d3ef",
    nieblaCerca: 25, nieblaLejos: 320, sol: { az: 128, el: 48 },
    saturacion: 1.08, ventanas: 0, farolas: 0,
  },
  atardecer: {
    lit: [1.35, 0.82, 0.48], shade: [0.3, 0.27, 0.62],
    cieloArriba: "#8c6f95", cieloHorizonte: "#ffd08a",
    nieblaCerca: 20, nieblaLejos: 300, sol: { az: 105, el: 11 },
    saturacion: 1.12, ventanas: 0.6, farolas: 0.8,
  },
  noche: {
    lit: [0.2, 0.3, 0.95], shade: [0.07, 0.09, 0.33],
    cieloArriba: "#0a1540", cieloHorizonte: "#2b3f8d",
    nieblaCerca: 15, nieblaLejos: 260, sol: { az: 110, el: 35 },
    saturacion: 1.25, ventanas: 1, farolas: 1,
  },
};

// capas: 0 = se ve en color · 1 = entra en la pasada de tinta · 2 = proyecta sombra
const CAPA_INFO = 1, CAPA_SOMBRA = 2;

// ───────────────────────── texturas pintadas ─────────────────────────

function lienzo(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")];
}
function texturaDe(canvas, repetir = null) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repetir[0], repetir[1]); }
  return t;
}
function variar(hex, r, k = 0.06) {
  const c = new THREE.Color(hex); const hsl = {};
  c.getHSL(hsl, THREE.SRGBColorSpace);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + (r() - 0.5) * 2 * k)), THREE.SRGBColorSpace);
  return "#" + c.getHexString(THREE.SRGBColorSpace);
}
function oscurecer(hex, k) {
  const c = new THREE.Color(hex); const hsl = {};
  c.getHSL(hsl, THREE.SRGBColorSpace);
  c.setHSL(hsl.h, Math.min(1, hsl.s * 1.05), hsl.l * (1 - k), THREE.SRGBColorSpace);
  return "#" + c.getHexString(THREE.SRGBColorSpace);
}
function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Texturas de suelo: pocas manchas de color plano y juntas finas oscuras (3–5 px a 1080). */
export function pintarSuelo(tipo, color, semilla = 7) {
  const r = azar(semilla);
  const [c, g] = lienzo(512, 512);
  g.fillStyle = color; g.fillRect(0, 0, 512, 512);
  const junta = "rgba(20,10,20,0.42)";
  if (tipo === "adoquin") {
    const filas = 8, alto = 512 / filas;
    for (let f = 0; f < filas; f++) {
      let x = f % 2 ? -alto * 0.6 : 0;
      while (x < 512) {
        const w = alto * (1.1 + r() * 0.7);
        g.fillStyle = variar(color, r, 0.085);
        rrect(g, x + 4, f * alto + 4, w - 8, alto - 8, 12); g.fill();
        g.strokeStyle = junta; g.lineWidth = 6; g.stroke();
        x += w;
      }
    }
  } else if (tipo === "baldosa") {
    const n = 4, s = 512 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = variar(color, r, 0.035); g.fillRect(i * s, j * s, s, s);
    }
    g.strokeStyle = junta; g.lineWidth = 4;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(512, i * s); g.stroke(); }
  } else if (tipo === "madera") {
    const n = 6, s = 512 / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = variar(color, r, 0.05); g.fillRect(0, i * s, 512, s);
      g.strokeStyle = "rgba(60,30,10,0.18)"; g.lineWidth = 2;
      for (let k = 0; k < 3; k++) { const y = i * s + s * (0.25 + r() * 0.5); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + 4, 340, y - 4, 512, y); g.stroke(); }
      g.fillStyle = "rgba(15,8,10,0.85)"; g.fillRect(0, i * s, 512, 4);
      const corte = r() * 512; g.fillRect(corte, i * s, 4, s);
    }
  } else if (tipo === "cesped") {
    for (let k = 0; k < 26; k++) {
      g.fillStyle = variar(color, r, 0.07); g.globalAlpha = 0.55;
      g.beginPath(); g.ellipse(r() * 512, r() * 512, 40 + r() * 70, 24 + r() * 40, r() * 3, 0, 7); g.fill();
    }
    g.globalAlpha = 1; g.strokeStyle = oscurecer(color, 0.25); g.lineWidth = 3;
    for (let k = 0; k < 90; k++) { const x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 9 - r() * 6); g.stroke(); }
  } else if (tipo === "tierra" || tipo === "asfalto" || tipo === "arena") {
    for (let k = 0; k < 40; k++) {
      g.fillStyle = variar(color, r, tipo === "asfalto" ? 0.03 : 0.06); g.globalAlpha = 0.5;
      g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 60, 18 + r() * 30, r() * 3, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    if (tipo !== "arena") for (let k = 0; k < 60; k++) { g.fillStyle = oscurecer(color, 0.2); g.fillRect(r() * 512, r() * 512, 3, 3); }
  }
  return c;
}

/** Fachada pintada: ventanas con marco y alféizar, puerta, zócalo y cornisa. Devuelve [color, emisivo]. */
function pintarFachada({ ancho, alto, color, pisos, puerta, ventanasPorPiso, marco, cristal, rotulo, colorRotulo, semilla }) {
  const r = azar(semilla);
  const px = 96; // px por metro
  const W = Math.round(ancho * px), H = Math.round(alto * px);
  const [c, g] = lienzo(W, H);
  const [ce, ge] = lienzo(W, H);
  ge.fillStyle = "#000"; ge.fillRect(0, 0, W, H);
  g.fillStyle = color; g.fillRect(0, 0, W, H);
  // manchas suaves de pintura
  for (let k = 0; k < 14; k++) { g.fillStyle = variar(color, r, 0.035); g.globalAlpha = 0.5; g.beginPath(); g.ellipse(r() * W, r() * H, 60 + r() * 140, 40 + r() * 90, 0, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  // zócalo y cornisa
  g.fillStyle = oscurecer(color, 0.28); g.fillRect(0, H - 0.55 * px, W, 0.55 * px);
  g.fillStyle = "rgba(20,10,20,0.5)"; g.fillRect(0, H - 0.55 * px, W, 4);
  g.fillStyle = marco; g.fillRect(0, 0, W, 0.28 * px);
  g.fillStyle = "rgba(20,10,20,0.45)"; g.fillRect(0, 0.28 * px, W, 4);
  const altoPiso = (alto - 0.4) / pisos;
  for (let p = 0; p < pisos; p++) {
    const y0 = H - (p + 1) * altoPiso * px - 0.15 * px;
    const n = ventanasPorPiso;
    for (let i = 0; i < n; i++) {
      const cx = ((i + 0.5) / n) * W;
      const esPuerta = p === 0 && puerta && i === Math.floor(n / 2);
      const ww = (esPuerta ? 1.15 : 1.0) * px, wh = (esPuerta ? 2.25 : 1.45) * px;
      const x = cx - ww / 2, y = esPuerta ? H - 0.15 * px - wh : y0 + altoPiso * px * 0.28;
      g.fillStyle = marco; g.fillRect(x - 10, y - 10, ww + 20, wh + 20);
      if (esPuerta) {
        g.fillStyle = "#6b3f2a"; g.fillRect(x, y, ww, wh);
        g.strokeStyle = "rgba(20,10,20,0.6)"; g.lineWidth = 4; g.strokeRect(x + 14, y + 16, ww - 28, wh * 0.42); g.strokeRect(x + 14, y + wh * 0.52, ww - 28, wh * 0.42);
        g.fillStyle = "#e8c15a"; g.beginPath(); g.arc(x + ww - 22, y + wh * 0.55, 6, 0, 7); g.fill();
      } else {
        g.fillStyle = cristal; g.fillRect(x, y, ww, wh);
        g.fillStyle = "rgba(255,255,255,0.22)"; g.beginPath(); g.moveTo(x, y + wh * 0.65); g.lineTo(x + ww * 0.45, y); g.lineTo(x + ww * 0.7, y); g.lineTo(x, y + wh); g.fill();
        g.fillStyle = marco; g.fillRect(cx - 5, y, 10, wh); g.fillRect(x, y + wh * 0.45, ww, 9);
        g.fillStyle = oscurecer(marco, 0.15); g.fillRect(x - 18, y + wh + 8, ww + 36, 14);
        g.fillStyle = "rgba(20,10,20,0.55)"; g.fillRect(x - 18, y + wh + 20, ww + 36, 3);
        if (r() < 0.75) { ge.fillStyle = "#ffffff"; ge.fillRect(x, y, ww, wh); }
      }
      g.strokeStyle = "rgba(20,10,20,0.55)"; g.lineWidth = 3; g.strokeRect(x - 10, y - 10, ww + 20, wh + 20);
    }
  }
  if (rotulo) {
    const rw = Math.min(W * 0.8, rotulo.length * 0.42 * px + 0.6 * px), rh = 0.62 * px;
    const rx = (W - rw) / 2, ry = H - altoPiso * px * 1.0 - 0.1 * px;
    g.fillStyle = colorRotulo; rrect(g, rx, ry, rw, rh, 10); g.fill();
    g.strokeStyle = "rgba(20,10,20,0.8)"; g.lineWidth = 5; g.stroke();
    g.fillStyle = "#fff8e8"; g.font = `900 ${Math.round(rh * 0.6)}px "Archivo Black", "Montserrat", sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(rotulo, W / 2, ry + rh * 0.54);
  }
  return [c, ce];
}

// ───────────────────────── materiales ─────────────────────────

// Uniformes compartidos por todos los materiales "pintura" (se actualizan por plano).
const U = {
  uSol: { value: new THREE.Vector3(0, 1, 0) },
  uLit: { value: new THREE.Vector3(1, 1, 1) },
  uShade: { value: new THREE.Vector3(0.5, 0.5, 0.6) },
  uNiebla: { value: new THREE.Color() },
  uNieblaCerca: { value: 25 },
  uNieblaLejos: { value: 300 },
  uCam: { value: new THREE.Vector3() },
  uSombra: { value: null },
  uSombraMat: { value: new THREE.Matrix4() },
  uSombraTexel: { value: 1 / 2048 },
  uNoche: { value: 0 },
  uFarolas: { value: 0 },
};

const VERT_PINTURA = /* glsl */ `
  uniform vec2 uRep;
  varying vec3 vN; varying vec3 vW; varying vec2 vUv;
  void main() {
    vUv = uv * uRep;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(transpose(inverse(mat3(modelMatrix))) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const FRAG_PINTURA = /* glsl */ `
  uniform vec3 uColor; uniform sampler2D uMap; uniform float uUsaMapa;
  uniform sampler2D uEmisMapa; uniform float uUsaEmis; uniform vec3 uEmisColor; uniform float uEmisFuente;
  uniform float uSuave; uniform float uMezclaSombra; uniform float uRecibe; uniform float uNieblaMax; uniform float uNeutro;
  uniform vec3 uSol; uniform vec3 uLit; uniform vec3 uShade;
  uniform vec3 uNiebla; uniform float uNieblaCerca; uniform float uNieblaLejos; uniform vec3 uCam;
  uniform sampler2D uSombra; uniform mat4 uSombraMat; uniform float uSombraTexel;
  uniform float uNoche; uniform float uFarolas;
  varying vec3 vN; varying vec3 vW; varying vec2 vUv;
  float sombra(vec3 p, vec3 n) {
    vec4 s = uSombraMat * vec4(p + n * 0.04, 1.0);
    vec3 q = s.xyz * 0.5 + 0.5;
    if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0 || q.z > 1.0) return 1.0;
    float luz = 0.0;
    for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
      float d = texture2D(uSombra, q.xy + vec2(float(i), float(j)) * uSombraTexel * 1.25).r;
      luz += (q.z - 0.0003 <= d) ? 1.0 : 0.0;
    }
    return luz / 9.0;
  }
  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    float ndl = dot(n, uSol);
    float k = smoothstep(-uSuave, uSuave, ndl - 0.02);
    if (uRecibe > 0.5) k *= sombra(vW, n);
    vec3 sh = uShade * mix(vec3(1.0), vec3(0.93, 0.98, 1.12), 0.5 + 0.5 * n.y);
    vec3 luz = mix(mix(uLit, sh, uMezclaSombra), uLit, k);
    // caras: siempre claras, sólo teñidas un poco por la luz de la escena
    luz = mix(luz, vec3(mix(0.88, 1.0, k)), uNeutro);
    vec3 base = uColor;
    if (uUsaMapa > 0.5) base *= texture2D(uMap, vUv).rgb;
    vec3 c = base * luz;
    if (uUsaEmis > 0.5) {
      float m = texture2D(uEmisMapa, vUv).r;
      float on = uEmisFuente > 0.5 ? uFarolas : uNoche;
      c = mix(c, uEmisColor, m * on);
    }
    float d = length(vW - uCam);
    float f = smoothstep(uNieblaCerca, uNieblaLejos, d) * uNieblaMax;
    c = mix(c, uNiebla, f);
    gl_FragColor = vec4(c, 1.0);
  }`;

/**
 * Material «pintura»: dos tonos (luz cálida / sombra azulada) con borde suave,
 * sombras proyectadas y niebla del color del horizonte.
 * op: { mapa, emisivo (canvas máscara), colorEmisivo, farola, suave, mezclaSombra, recibe, nieblaMax }
 */
export function pintura(color = "#ffffff", op = {}) {
  const mapa = op.mapa ? (op.mapa.isTexture ? op.mapa : texturaDe(op.mapa, op.repetir)) : null;
  const emis = op.emisivo ? (op.emisivo.isTexture ? op.emisivo : texturaDe(op.emisivo, op.repetir)) : null;
  if (emis) emis.colorSpace = THREE.NoColorSpace;
  return new THREE.ShaderMaterial({
    vertexShader: VERT_PINTURA,
    fragmentShader: FRAG_PINTURA,
    side: op.doble ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: {
      ...U,
      uColor: { value: lin(color) },
      uRep: { value: mapa ? mapa.repeat.clone() : new THREE.Vector2(1, 1) },
      uMap: { value: mapa }, uUsaMapa: { value: mapa ? 1 : 0 },
      uEmisMapa: { value: emis }, uUsaEmis: { value: emis ? 1 : 0 },
      uEmisColor: { value: lin(op.colorEmisivo ?? "#ffc66b").multiplyScalar(1.1) },
      uEmisFuente: { value: op.farola ? 1 : 0 },
      uSuave: { value: op.suave ?? 0.06 },
      uMezclaSombra: { value: op.mezclaSombra ?? 1 },
      uRecibe: { value: op.recibe === false ? 0 : 1 },
      uNieblaMax: { value: op.nieblaMax ?? 1 },
      uNeutro: { value: op.neutro ?? 0 },
    },
  });
}

/** Color plano sin luz (tinta de personajes, rótulos, efectos). */
function plano(color, op = {}) {
  return new THREE.MeshBasicMaterial({ color: lin(color), ...op });
}

// Materiales de la pasada de información (normales + tipo) para dibujar la tinta.
const VERT_INFO = /* glsl */ `
  varying vec3 vNv; varying vec2 vUv;
  void main() { vUv = uv; vNv = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG_INFO = /* glsl */ `
  uniform float uTipo; uniform sampler2D uAlfa; uniform float uUsaAlfa;
  varying vec3 vNv; varying vec2 vUv;
  void main() {
    if (uUsaAlfa > 0.5 && texture2D(uAlfa, vUv).a < 0.5) discard;
    vec3 n = normalize(vNv); if (!gl_FrontFacing) n = -n;
    gl_FragColor = vec4(n * 0.5 + 0.5, uTipo);
  }`;
function infoMat(tipo, alfa = null) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT_INFO, fragmentShader: FRAG_INFO, side: THREE.DoubleSide,
    uniforms: { uTipo: { value: tipo }, uAlfa: { value: alfa }, uUsaAlfa: { value: alfa ? 1 : 0 } },
  });
}
const INFO = { mundo: infoMat(1), personaje: infoMat(0.5), nada: infoMat(0) };

/** Marca una malla: entra en tinta como mundo / personaje / nada, y si proyecta sombra. */
function marcar(obj, tipo = "mundo", sombra = true) {
  obj.traverse((m) => {
    if (!m.isMesh) return;
    m.userData.tinta = tipo;
    m.layers.enable(CAPA_INFO);
    if (sombra) m.layers.enable(CAPA_SOMBRA);
  });
  return obj;
}

// Contorno de personajes: casco invertido ciruela, más grueso abajo (como el trazo a mano).
const VERT_CASCO = /* glsl */ `
  uniform float uG0; uniform float uG1;
  void main() {
    vec3 p = position + normal * (uG0 + uG1 * max(0.0, -normal.y));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const FRAG_CASCO = /* glsl */ `uniform vec3 uColor; void main() { gl_FragColor = vec4(uColor, 1.0); }`;
function casco(geo, g0, g1) {
  const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    vertexShader: VERT_CASCO, fragmentShader: FRAG_CASCO, side: THREE.BackSide,
    uniforms: { uG0: { value: g0 }, uG1: { value: g1 }, uColor: { value: lin(ESTILO.tintaPersonaje) } },
  }));
  return m;
}

// ───────────────────────── caras ─────────────────────────

const CARA = 512, ARCO = 2.0; // tamaño del lienzo y ángulo (rad) que cubre la cara en la cabeza
const cx = (xW) => CARA * (0.5 + Math.asin(Math.max(-0.99, Math.min(0.99, 2 * xW))) / ARCO);
const cy = (yW) => CARA * (0.5 + Math.asin(Math.max(-0.99, Math.min(0.99, (2 * yW) / 0.93))) / ARCO);
const PXW = CARA * (2 / ARCO); // px del lienzo por ancho de cabeza (W) cerca del centro

/** Expresiones disponibles. Ojos: parpado (por defecto, cara de póker), punto, grandes, felices. */
export const EXPRESIONES = {
  normal:   { ojos: "parpado", cejas: [0, 0],    boca: "neutra" },
  contento: { ojos: "punto",   cejas: [-6, 6],   boca: "sonrisa" },
  risa:     { ojos: "felices", cejas: [-8, 8],   boca: "risa" },
  sorpresa: { ojos: "grandes", cejas: [-10, 10], boca: "o", cejaAlta: 0.05 },
  enfado:   { ojos: "parpado", cejas: [22, -22], boca: "apretada" },
  triste:   { ojos: "punto",   cejas: [-20, 20], boca: "triste" },
  duda:     { ojos: "parpado", cejas: [0, -14],  boca: "lado", cejaUna: true },
  miedo:    { ojos: "grandes", cejas: [-22, 22], boca: "ondas", pupila: 0.045 },
  orgullo:  { ojos: "felices", cejas: [-4, 4],   boca: "lado" },
};

function dibujarCara(exp, parpadeo) {
  const [c, g] = lienzo(CARA, CARA);
  const E = EXPRESIONES[exp] ?? EXPRESIONES.normal;
  const tinta = ESTILO.tintaPersonaje;
  g.fillStyle = tinta; g.strokeStyle = tinta; g.lineCap = "round"; g.lineJoin = "round";
  const ojoY = cy(0), sep = 0.13;
  for (const lado of [-1, 1]) {
    const x = cx(lado * sep);
    const tipo = parpadeo === 2 ? "cerrado" : E.ojos;
    if (tipo === "cerrado") {
      g.lineWidth = 0.035 * PXW; g.beginPath(); g.moveTo(x - 0.08 * PXW, ojoY); g.lineTo(x + 0.08 * PXW, ojoY); g.stroke();
    } else if (tipo === "felices") {
      g.lineWidth = 0.035 * PXW; g.beginPath(); g.arc(x, ojoY + 0.03 * PXW, 0.07 * PXW, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    } else if (tipo === "parpado") {
      const w = 0.18 * PXW, h = (parpadeo === 1 ? 0.05 : 0.11) * PXW;
      g.beginPath(); g.ellipse(x, ojoY, w / 2, h, 0, 0, Math.PI); g.fill();
      g.lineWidth = 0.032 * PXW; g.beginPath(); g.moveTo(x - w / 2 - 4, ojoY); g.lineTo(x + w / 2 + 4, ojoY); g.stroke();
    } else if (tipo === "punto") {
      const h = (parpadeo === 1 ? 0.06 : 0.13) * PXW;
      g.beginPath(); g.ellipse(x, ojoY, 0.045 * PXW, h / 2, 0, 0, 7); g.fill();
    } else if (tipo === "grandes") {
      const R = 0.11 * PXW, xx = cx(lado * 0.115);
      g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(xx, ojoY, R, parpadeo === 1 ? R * 0.45 : R, 0, 0, 7); g.fill();
      g.lineWidth = 0.022 * PXW; g.stroke();
      g.fillStyle = tinta; g.beginPath(); g.arc(xx, ojoY + 0.01 * PXW, (E.pupila ?? 0.032) * PXW, 0, 7); g.fill();
    }
  }
  // cejas: trazo afilado 0,175 × 0,05 W a 0,20 W por encima de los ojos
  const cejaY = cy(-0.2 - (E.cejaAlta ?? 0));
  [-1, 1].forEach((lado, i) => {
    let ang = E.cejas[i];
    let y = cejaY;
    if (E.cejaUna && lado === 1) y -= 0.05 * PXW;
    const x = cx(lado * 0.14);
    g.save(); g.translate(x, y); g.rotate(rad(ang * (lado === -1 ? 1 : 1)));
    g.beginPath(); g.moveTo(-0.0875 * PXW, 0.012 * PXW); g.quadraticCurveTo(0, -0.03 * PXW, 0.0875 * PXW, 0.006 * PXW);
    g.quadraticCurveTo(0, -0.005 * PXW, -0.0875 * PXW, 0.012 * PXW); g.lineWidth = 0.03 * PXW; g.stroke(); g.fill();
    g.restore();
  });
  // boca a 0,19 W por debajo de los ojos
  const by = cy(0.19), bx = cx(0.02);
  g.lineWidth = 0.035 * PXW;
  const boca = E.boca;
  if (boca === "neutra") { g.beginPath(); g.moveTo(bx - 0.055 * PXW, by + 2); g.lineTo(bx + 0.055 * PXW, by - 3); g.stroke(); }
  else if (boca === "lado") { g.beginPath(); g.moveTo(bx - 0.06 * PXW, by + 4); g.quadraticCurveTo(bx + 0.02 * PXW, by + 6, bx + 0.07 * PXW, by - 10); g.stroke(); }
  else if (boca === "sonrisa") { g.beginPath(); g.arc(bx, by - 0.05 * PXW, 0.09 * PXW, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  else if (boca === "triste") { g.beginPath(); g.arc(bx, by + 0.07 * PXW, 0.075 * PXW, Math.PI * 1.22, Math.PI * 1.78); g.stroke(); }
  else if (boca === "apretada") { g.beginPath(); g.moveTo(bx - 0.07 * PXW, by); g.lineTo(bx + 0.07 * PXW, by); g.stroke(); }
  else if (boca === "ondas") { g.beginPath(); g.moveTo(bx - 0.08 * PXW, by); for (let k = 1; k <= 4; k++) g.lineTo(bx - 0.08 * PXW + k * 0.04 * PXW, by + (k % 2 ? -8 : 8)); g.stroke(); }
  else if (boca === "o" || boca === "risa") {
    const w = (boca === "o" ? 0.1 : 0.15) * PXW, h = (boca === "o" ? 0.13 : 0.08) * PXW;
    g.fillStyle = "#54212a"; g.beginPath();
    if (boca === "o") g.ellipse(bx, by + 0.02 * PXW, w, h, 0, 0, 7); else { g.moveTo(bx - w, by - h * 0.4); g.lineTo(bx + w, by - h * 0.4); g.quadraticCurveTo(bx + w, by + h * 1.6, bx, by + h * 1.6); g.quadraticCurveTo(bx - w, by + h * 1.6, bx - w, by - h * 0.4); }
    g.fill(); g.lineWidth = 0.028 * PXW; g.strokeStyle = tinta; g.stroke();
    if (boca === "risa") { g.fillStyle = "#ffffff"; g.fillRect(bx - w * 0.8, by - h * 0.35, w * 1.6, h * 0.55); g.strokeRect(bx - w * 0.8, by - h * 0.35, w * 1.6, h * 0.55); }
  }
  return texturaDe(c);
}
const cacheCaras = new Map();
function texturaCara(exp, parpadeo) {
  const k = exp + ":" + parpadeo;
  if (!cacheCaras.has(k)) cacheCaras.set(k, dibujarCara(exp, parpadeo));
  return cacheCaras.get(k);
}

// ───────────────────────── personajes 3D ─────────────────────────

/** Deforma una esfera unidad en cabeza de judía: alto/ancho 0,93, barbilla más estrecha, coronilla algo apuntada. */
function deformarCabeza(geo, R) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const yn = y / R;
    let k = 1;
    if (yn < 0) k *= 1 - 0.13 * -yn;               // barbilla estrecha
    else k *= 1 - 0.07 * yn * yn;                 // coronilla
    k *= 1 + 0.03 * Math.sign(x) * Math.max(0, -yn) * 0.5; // pizca de asimetría
    p.setXYZ(i, x * k, y * 0.93, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

const POSES = {
  // [hombro hacia delante° (negativo = adelante), hombro hacia fuera°, codo hacia delante°, codo hacia dentro°]
  abajo:    { iz: [0, 10, 0, 0],      de: [0, 10, 0, 0] },
  sorpresa: { iz: [-25, 55, 20, 0],   de: [-25, 55, 20, 0] },
  arriba:   { iz: [0, 155, 10, 0],    de: [0, 155, 10, 0] },
  saludo:   { iz: [0, 10, 0, 0],      de: [0, 125, 0, 35], ola: "de" },
  senalar:  { iz: [0, 10, 0, 0],      de: [-85, 8, 0, 0] },
  jarras:   { iz: [8, 42, 0, 105],    de: [8, 42, 0, 105] },
  pensar:   { iz: [0, 10, 0, 0],      de: [-35, 12, 140, 15] },
  llevar:   { iz: [-55, 14, 35, 25],  de: [-55, 14, 35, 25] },
  celebrar: { iz: [-10, 140, 20, 0],  de: [-10, 140, 20, 0], bote: true },
  encoger:  { iz: [-5, 32, 0, -100],  de: [-5, 32, 0, -100] },
};
export const NOMBRES_POSES = Object.keys(POSES);

/**
 * Crea un personaje 3D del estilo: cabeza de judía blanca, cuerpo de alubia,
 * piernas y brazos de palito ciruela con manos de punto, contorno ciruela.
 * op: { ropa, piel, sombrero: 'gorra'|'sombrero'|'cocinero'|'pelo'|'casco'|'gorro'|null,
 *       colorSombrero, bigote, nino, escala, semilla }
 * Después rellena sus pistas (todas en segundos):
 *   pj.camino = [[t, x, z, y?], ...] dónde está (y = altura del suelo, p. ej. 0,15 en la acera); entre puntos distintos, anda
 *   pj.mirar  = [[t, grados], ...]    hacia dónde mira cuando está quieto (0 = hacia +z)
 *   pj.caras  = [[t, 'sorpresa'], ...] expresión (parpadea solo, y al cambiar de cara)
 *   pj.poses  = [[t, 'saludo'], ...]  brazos (ver NOMBRES_POSES)
 *   pj.saltos = [t, ...]              un saltito de alegría o susto
 */
export function personaje(mundo, op = {}) {
  const W = 0.46 * (op.escala ?? 1) * (op.nino ? 0.86 : 1);
  const R = W / 2, HH = 0.93 * W;
  const piernas = (op.nino ? 1.0 : 1.4) * HH, torsoAlto = (op.nino ? 0.85 : 1.1) * HH;
  const tinta = plano(ESTILO.tintaPersonaje);
  const raiz = new THREE.Group();     // posición en el suelo y giro
  const cuerpo = new THREE.Group();   // sube/baja al andar e inclina
  raiz.add(cuerpo);

  // cabeza
  const geoCab = deformarCabeza(new THREE.SphereGeometry(R, 48, 32), R);
  const cabeza = new THREE.Group();
  const yCab = piernas + torsoAlto + HH * 0.5 - 0.06 * HH;
  cabeza.position.y = yCab;
  const matPiel = pintura(op.piel ?? "#fdf8f3", { suave: 0.5, mezclaSombra: 0.24, neutro: 0.68 });
  cabeza.add(new THREE.Mesh(geoCab, matPiel));
  cabeza.add(casco(geoCab, 0.022 * W, 0.06 * W));
  // cara: casquete transparente un pelín por fuera de la cabeza
  const geoCara = deformarCabeza(new THREE.SphereGeometry(R * 1.006, 40, 32, Math.PI / 2 - ARCO / 2, ARCO, Math.PI / 2 - ARCO / 2, ARCO), R * 1.006);
  const matCara = new THREE.MeshBasicMaterial({ map: texturaCara("normal", 0), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const cara = new THREE.Mesh(geoCara, matCara);
  cara.renderOrder = 2;
  cabeza.add(cara);
  if (op.bigote) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.06 * W, 16, 12), tinta);
    b.scale.set(1.6, 0.55, 0.6); b.position.set(0, -0.13 * W, R * 0.96); cabeza.add(b);
  }
  sombreroPara(cabeza, op.sombrero, op.colorSombrero, W, R);
  cuerpo.add(cabeza);

  // torso: alubia (ancho 0,8 W, más estrecho arriba, culo redondo)
  const tw = 0.8 * W * (op.nino ? 0.9 : 1);
  const geoTor = new THREE.CapsuleGeometry(tw / 2, Math.max(0.01, torsoAlto + 0.12 * HH - tw), 12, 32);
  {
    const p = geoTor.attributes.position; const h = torsoAlto + 0.12 * HH;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); const u = clamp01((y / h) + 0.5); const k = 1 - 0.18 * Math.max(0, u - 0.6) / 0.4; p.setXYZ(i, p.getX(i) * k, y, p.getZ(i) * k * 0.82); }
    geoTor.computeVertexNormals();
  }
  const torso = new THREE.Group();
  torso.position.y = piernas + (torsoAlto + 0.12 * HH) / 2 - 0.04 * HH;
  torso.add(new THREE.Mesh(geoTor, pintura(op.ropa ?? "#d9534f", { suave: 0.35, mezclaSombra: 0.85 })));
  torso.add(casco(geoTor, 0.018 * W, 0.035 * W));
  cuerpo.add(torso);

  // piernas: un trazo de 0,055 W, pies redondeados hacia delante
  const grosor = 0.055 * W;
  const crearPierna = (lado) => {
    const g = new THREE.Group();
    g.position.set(lado * 0.15 * W, piernas, 0);
    const pierna = new THREE.Mesh(new THREE.CylinderGeometry(grosor / 2, grosor / 2, piernas, 8), tinta);
    pierna.position.y = -piernas / 2; g.add(pierna);
    const pie = new THREE.Mesh(new THREE.CapsuleGeometry(0.035 * W, 0.15 * W, 4, 8), tinta);
    pie.rotation.x = Math.PI / 2; pie.position.set(lado * 0.04 * W, -piernas + 0.035 * W, 0.06 * W); g.add(pie);
    g.rotation.z = lado * rad(-3.5);
    cuerpo.add(g); return g;
  };
  const pi = crearPierna(-1), pd = crearPierna(1);

  // brazos: dos tramos de palito y mano de punto
  const largoBrazo = 0.95 * HH;
  const crearBrazo = (lado) => {
    const hombro = new THREE.Group();
    hombro.position.set(lado * tw * 0.42, piernas + torsoAlto * 0.78, 0);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(grosor * 0.46, grosor * 0.46, largoBrazo / 2, 8), tinta);
    a.position.y = -largoBrazo / 4; hombro.add(a);
    const codo = new THREE.Group(); codo.position.y = -largoBrazo / 2; hombro.add(codo);
    codo.add(new THREE.Mesh(new THREE.SphereGeometry(grosor * 0.46, 8, 6), tinta));
    const b = new THREE.Mesh(new THREE.CylinderGeometry(grosor * 0.46, grosor * 0.46, largoBrazo / 2, 8), tinta);
    b.position.y = -largoBrazo / 4; codo.add(b);
    const mano = new THREE.Group(); mano.position.y = -largoBrazo / 2; codo.add(mano);
    mano.add(new THREE.Mesh(new THREE.SphereGeometry(0.055 * W, 12, 10), tinta));
    cuerpo.add(hombro);
    return { hombro, codo, mano, lado };
  };
  const bi = crearBrazo(-1), bd = crearBrazo(1);

  // sombra de contacto suave bajo los pies
  const mancha = new THREE.Mesh(new THREE.CircleGeometry(0.42 * W * 1.6, 32), new THREE.MeshBasicMaterial({ map: texturaMancha(), transparent: true, depthWrite: false, color: lin("#2a2350"), opacity: 0.45 }));
  mancha.rotation.x = -Math.PI / 2; mancha.position.y = 0.012; mancha.scale.set(1.25, 0.8, 1);
  raiz.add(mancha);

  marcar(raiz, "personaje", true);
  mancha.layers.disable(CAPA_INFO); mancha.layers.disable(CAPA_SOMBRA);
  cara.layers.disable(CAPA_SOMBRA);
  raiz.traverse((m) => { if (m.isMesh && m.material.type === "ShaderMaterial" && m.material.side === THREE.BackSide) m.layers.disable(CAPA_SOMBRA); });
  mundo.escena.add(raiz);

  const r = azar(op.semilla ?? 11 + mundo.personajes.length * 7);
  // parpadeos cada 0,5–2,3 s, 4 fotogramas (medio, cerrado, cerrado, medio)
  const parpadeos = []; { let t = r() * 1.2; while (t < 600) { parpadeos.push(t); t += 0.5 + r() * 1.8; } }

  const pj = {
    raiz, cabeza, alto: piernas + torsoAlto + HH, W,
    camino: [[0, 0, 0]], mirar: [], caras: [[0, "normal"]], poses: [[0, "abajo"]], saltos: [],
    manoDerecha: bd.mano, manoIzquierda: bi.mano,
    actualizar(t) {
      // posición y paso
      const { x, y, z, dist, rumbo, andando, vel } = enCamino(pj.camino, t);
      raiz.position.set(x, y, z);
      let giro = rumbo;
      if (!andando) { const m = pista(pj.mirar, t, 0.12, (a, b, u) => lerpAng(a, b, u)); if (m !== null) giro = rad(m); }
      raiz.rotation.y = giro;
      const zancada = 0.55 * (op.nino ? 0.8 : 1) * (op.escala ?? 1);
      const fase = dist / zancada;              // pasos dados
      const s = andando ? Math.sin(Math.PI * fase) : 0;
      const ampl = andando ? Math.min(1, vel / 0.8) : 0;
      const ang = rad(30) * s * ampl;
      pi.rotation.x = ang; pd.rotation.x = -ang;
      const caida = piernas * (1 - Math.cos(ang));  // la cadera baja con las piernas abiertas: bote plantado
      // saltito
      let salto = 0, agache = 0;
      for (const ts of pj.saltos) {
        const u = (t - ts);
        if (u > -0.1 && u < 0) agache = Math.max(agache, suave((u + 0.1) / 0.1));
        if (u >= 0 && u < 0.45) { const v = u / 0.45; salto = Math.max(salto, 4 * v * (1 - v) * 0.35 * HH * 1.6); agache = Math.max(agache, 1 - suave(u / 0.06)); }
      }
      cuerpo.position.y = -caida + salto - agache * 0.07 * HH;
      cuerpo.rotation.x = andando ? rad(1 + 5 * Math.abs(s)) * ampl : 0;
      // brazos
      const pose = posePara(pj.poses, t);
      const balanceo = andando && pose.nombre === "abajo" ? rad(16) * s * ampl : 0;
      aplicarBrazo(bi, pose.iz, -balanceo, t, pose);
      aplicarBrazo(bd, pose.de, balanceo, t, pose);
      // cara y parpadeo
      const exp = valorEn(pj.caras, t) ?? "normal";
      let p = 0;
      const cambios = pj.caras.map((c) => c[0]).filter((tc) => tc > 0);
      for (const tb of parpadeos.concat(cambios.map((tc) => tc - 0.066))) {
        const u = t - tb;
        if (u >= 0 && u < 0.134) { p = u < 0.033 || u >= 0.1 ? Math.max(p, 1) : 2; }
      }
      if (EXPRESIONES[exp]?.ojos === "felices" || EXPRESIONES[exp]?.ojos === "grandes") p = Math.min(p, 1);
      matCara.map = texturaCara(exp, p);
    },
  };
  mundo.personajes.push(pj);
  return pj;
}

function sombreroPara(cabeza, tipo, color, W, R) {
  if (!tipo) return;
  const g = new THREE.Group();
  const top = R * 0.93;
  const mat = pintura(color ?? (tipo === "cocinero" ? "#fbfbfb" : tipo === "casco" ? "#f2c230" : tipo === "pelo" ? "#3a2a24" : "#3b6fc4"), { suave: 0.3, mezclaSombra: 0.8 });
  const add = (geo, pos, rot, esc) => {
    const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (esc) m.scale.set(...esc);
    g.add(m); const h = casco(geo, 0.016 * W, 0.02 * W); h.position.copy(m.position); h.rotation.copy(m.rotation); h.scale.copy(m.scale); g.add(h);
  };
  if (tipo === "gorra" || tipo === "gorro" || tipo === "casco") {
    add(new THREE.SphereGeometry(R * 1.04, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), [0, top * 0.18, 0], null, [1, 0.95, 1]);
    if (tipo === "gorra") add(new THREE.CylinderGeometry(R * 0.62, R * 0.62, 0.03 * W, 24, 1, false, -Math.PI / 2, Math.PI), [0, top * 0.22, R * 0.62], [0.08, 0, 0], [1, 1, 1.15]);
    if (tipo === "casco") add(new THREE.CylinderGeometry(R * 1.22, R * 1.22, 0.03 * W, 32), [0, top * 0.2, 0.02 * W]);
    if (tipo === "gorro") add(new THREE.TorusGeometry(R * 0.98, 0.06 * W, 8, 32), [0, top * 0.22, 0], [Math.PI / 2, 0, 0]);
  } else if (tipo === "sombrero") {
    add(new THREE.CylinderGeometry(R * 1.32, R * 1.32, 0.03 * W, 40), [0, top * 0.62, 0]);
    add(new THREE.CylinderGeometry(R * 0.66, R * 0.74, R * 0.75, 32), [0, top * 0.98, 0]);
  } else if (tipo === "cocinero") {
    add(new THREE.CylinderGeometry(R * 0.72, R * 0.72, R * 0.8, 32), [0, top * 1.12, 0]);
    add(new THREE.SphereGeometry(R * 0.92, 24, 16), [0, top * 1.68, 0], null, [1, 0.62, 1]);
  } else if (tipo === "pelo") {
    add(new THREE.SphereGeometry(R * 1.03, 32, 16, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * 0.62), [0, 0, -0.01 * W], null, [1, 0.94, 1]);
  }
  cabeza.add(g);
}

function texturaMancha() {
  const [c, g] = lienzo(128, 128);
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,0.75)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); return t;
}

function lerpAng(a, b, u) { let d = ((b - a + 540) % 360) - 180; return a + d * u; }

/** Valor de una pista [[t, v], ...] en t (escalón). */
function valorEn(pistaArr, t) { let v = null; for (const [tk, val] of pistaArr) { if (t >= tk) v = val; else break; } return v; }
/** Igual pero con transición suave de `dur` segundos entre valores numéricos. */
function pista(arr, t, dur, mezcla) {
  if (!arr || !arr.length) return null;
  let v = arr[0][1];
  for (let i = 1; i < arr.length; i++) { const [tk, val] = arr[i]; if (t < tk) break; v = mezcla(v, val, suave((t - tk) / dur)); }
  return t < arr[0][0] ? arr[0][1] : v;
}

function posePara(poses, t) {
  let prev = POSES.abajo, cur = POSES.abajo, nombre = "abajo", u = 1;
  for (const [tk, n] of poses) { if (t < tk) break; prev = cur; cur = POSES[n] ?? POSES.abajo; nombre = n; u = suave((t - tk) / 0.14); }
  const mez = (a, b) => a.map((v, i) => lerp(v, b[i], u));
  return { iz: mez(prev.iz, cur.iz), de: mez(prev.de, cur.de), nombre, ola: cur.ola, bote: cur.bote };
}
function aplicarBrazo(b, [adelante, afuera, codo, dentro], extra, t, pose) {
  let fuera = afuera, d = dentro;
  if (pose.ola === (b.lado === 1 ? "de" : "iz")) d += 22 * Math.sin(t * Math.PI * 2 * 2.2);
  if (pose.bote) fuera += 8 * Math.sin(t * Math.PI * 2 * 2.5);
  b.hombro.rotation.set(rad(adelante) + extra, 0, b.lado * rad(fuera));
  b.codo.rotation.set(-rad(codo), 0, -b.lado * rad(d));
}

/** Posición en un camino [[t,x,z],...]: anda a velocidad constante entre puntos distintos (arranca y frena suave). */
function enCamino(cam, t) {
  let dist = 0, x = cam[0][1], z = cam[0][2], y = cam[0][3] ?? 0, rumbo = 0, andando = false, vel = 0;
  for (let i = 1; i < cam.length; i++) {
    const [t0, x0, z0, y0 = 0] = cam[i - 1], [t1, x1, z1, y1 = 0] = cam[i];
    const L = Math.hypot(x1 - x0, z1 - z0);
    if (t >= t1) { dist += L; x = x1; z = z1; y = y1; if (L > 1e-4) rumbo = Math.atan2(x1 - x0, z1 - z0); continue; }
    if (t > t0 && L > 1e-4) {
      const u = (t - t0) / (t1 - t0);
      const e = u < 0.08 ? (u * u) / (2 * 0.08 * 0.92) : u > 0.92 ? 1 - ((1 - u) * (1 - u)) / (2 * 0.08 * 0.92) : (u - 0.04) / 0.92;
      x = lerp(x0, x1, e); z = lerp(z0, z1, e); y = lerp(y0, y1, e); dist += L * e;
      rumbo = Math.atan2(x1 - x0, z1 - z0); andando = true; vel = L / (t1 - t0);
    }
    break;
  }
  return { x, y, z, dist, rumbo, andando, vel };
}

// ───────────────────────── atrezo ─────────────────────────

function malla(geo, mat, pos, rot) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  return m;
}

/** Suelo enorme: se funde con el horizonte gracias a la niebla. */
function suelo(mundo, { tipo = "adoquin", color = "#c9b8a0", metrosPorTextura = 4, tam = 1600 } = {}) {
  const mapa = texturaDe(pintarSuelo(tipo, color, 3), [tam / metrosPorTextura, tam / metrosPorTextura]);
  const m = malla(new THREE.PlaneGeometry(tam, tam), pintura("#ffffff", { mapa }), [0, 0, 0], [-Math.PI / 2, 0, 0]);
  marcar(m, "mundo", false);
  mundo.escena.add(m); return m;
}

/** Losa elevada (acera, plaza, escenario, mesa grande…). */
function losa(mundo, { desde = [-5, -5], hasta = [5, 5], alto = 0.15, tipo = "baldosa", color = "#d8cbb6", metrosPorTextura = 2 } = {}) {
  const w = hasta[0] - desde[0], d = hasta[1] - desde[1];
  const mapa = texturaDe(pintarSuelo(tipo, color, 5), [w / metrosPorTextura, d / metrosPorTextura]);
  const mats = [pintura(oscurecer(color, 0.15)), pintura(oscurecer(color, 0.15)), pintura("#ffffff", { mapa }), pintura(color), pintura(oscurecer(color, 0.15)), pintura(oscurecer(color, 0.15))];
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, alto, d), mats);
  m.position.set(desde[0] + w / 2, alto / 2, desde[1] + d / 2);
  marcar(m); mundo.escena.add(m); return m;
}

/** Casa con fachada pintada, tejado a dos aguas, cornisa y chimenea. */
function casa(mundo, op = {}) {
  const { pos = [0, 0], giro = 0, ancho = 6, alto = 7, fondo = 6, color = "#d98a5f", tejado = "#8a3f32",
    pisos = Math.max(1, Math.round(alto / 3.2)), puerta = true, marco = "#f4ead6", cristal = "#6f97c6",
    rotulo = null, colorRotulo = "#b73a32", toldo = null, chimenea = true, semilla = 1 } = op;
  const g = new THREE.Group();
  const vpp = Math.max(1, Math.round(ancho / 2.2));
  const [cf, ef] = pintarFachada({ ancho, alto, color, pisos, puerta, ventanasPorPiso: vpp, marco, cristal, rotulo, colorRotulo, semilla });
  const [cl, el] = pintarFachada({ ancho: fondo, alto, color: oscurecer(color, 0.04), pisos, puerta: false, ventanasPorPiso: Math.max(1, Math.round(fondo / 3)), marco, cristal, semilla: semilla + 9 });
  const frente = pintura("#ffffff", { mapa: cf, emisivo: ef });
  const lado = pintura("#ffffff", { mapa: cl, emisivo: el });
  const liso = pintura(color);
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo), [lado, lado, liso, liso, frente, liso]);
  cuerpo.position.y = alto / 2; g.add(cuerpo);
  // tejado a dos aguas (prisma)
  const hT = Math.min(ancho, fondo) * 0.32;
  const forma = new THREE.Shape(); forma.moveTo(-ancho / 2 - 0.3, 0); forma.lineTo(ancho / 2 + 0.3, 0); forma.lineTo(0, hT); forma.closePath();
  const geoT = new THREE.ExtrudeGeometry(forma, { depth: fondo + 0.5, bevelEnabled: false });
  geoT.translate(0, 0, -(fondo + 0.5) / 2);
  const tej = new THREE.Mesh(geoT, pintura("#ffffff", { mapa: pintarTejas(tejado), repetir: [0.5, 0.5] }));
  tej.position.y = alto; g.add(tej);
  // cornisa
  g.add(malla(new THREE.BoxGeometry(ancho + 0.25, 0.22, fondo + 0.25), pintura(marco), [0, alto - 0.05, 0]));
  if (chimenea) {
    g.add(malla(new THREE.BoxGeometry(0.6, 1.6, 0.6), pintura(oscurecer(color, 0.1)), [ancho * 0.28, alto + hT * 0.6, -fondo * 0.15]));
    g.add(malla(new THREE.BoxGeometry(0.75, 0.15, 0.75), pintura(marco), [ancho * 0.28, alto + hT * 0.6 + 0.85, -fondo * 0.15]));
  }
  if (toldo) {
    const [ct] = lienzo(256, 64); const gt = ct.getContext("2d");
    for (let i = 0; i < 8; i++) { gt.fillStyle = i % 2 ? "#fff6e6" : toldo; gt.fillRect(i * 32, 0, 32, 64); }
    const t = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.7, 0.08, 1.3), pintura("#ffffff", { mapa: ct }));
    t.position.set(0, 3.05, fondo / 2 + 0.6); t.rotation.x = 0.32; g.add(t);
  }
  g.position.set(pos[0], 0, pos[1]); g.rotation.y = rad(giro);
  marcar(g); mundo.escena.add(g); return g;
}

function pintarTejas(color) {
  const r = azar(21); const [c, g] = lienzo(256, 256);
  g.fillStyle = color; g.fillRect(0, 0, 256, 256);
  for (let f = 0; f < 8; f++) for (let k = 0; k < 6; k++) {
    g.fillStyle = variar(color, r, 0.05); const x = k * 44 + (f % 2) * 22 - 22;
    g.beginPath(); g.arc(x + 22, f * 32 + 18, 22, 0, Math.PI); g.fill();
    g.strokeStyle = "rgba(20,10,20,0.35)"; g.lineWidth = 3; g.stroke();
  }
  return c;
}

function arbol(mundo, { pos = [0, 0], alto = 5, color = "#5fa84a", tronco = "#7a5136", semilla = 3 } = {}) {
  const r = azar(semilla); const g = new THREE.Group();
  g.add(malla(new THREE.CylinderGeometry(0.16, 0.24, alto * 0.55, 10), pintura(tronco), [0, alto * 0.275, 0]));
  const copa = pintura(color, { suave: 0.12 });
  for (let k = 0; k < 3; k++) {
    const s = alto * (0.24 + r() * 0.08);
    g.add(malla(new THREE.IcosahedronGeometry(s, 3), copa, [(r() - 0.5) * alto * 0.3, alto * (0.62 + k * 0.12), (r() - 0.5) * alto * 0.25]));
  }
  g.position.set(pos[0], 0, pos[1]); marcar(g); mundo.escena.add(g); return g;
}

function farola(mundo, { pos = [0, 0], alto = 4.2, color = "#2f3442" } = {}) {
  const g = new THREE.Group(); const m = pintura(color);
  g.add(malla(new THREE.CylinderGeometry(0.07, 0.11, alto, 10), m, [0, alto / 2, 0]));
  g.add(malla(new THREE.CylinderGeometry(0.2, 0.2, 0.25, 10), m, [0, 0.12, 0]));
  const [cm] = lienzo(8, 8); cm.getContext("2d").fillStyle = "#fff"; cm.getContext("2d").fillRect(0, 0, 8, 8);
  g.add(malla(new THREE.BoxGeometry(0.42, 0.5, 0.42), pintura("#f3e3b0", { emisivo: cm, colorEmisivo: "#ffd27a", farola: true }), [0, alto + 0.25, 0]));
  g.add(malla(new THREE.ConeGeometry(0.38, 0.3, 4), m, [0, alto + 0.65, 0], [0, Math.PI / 4, 0]));
  g.position.set(pos[0], 0, pos[1]); marcar(g); mundo.escena.add(g); return g;
}

function banco(mundo, { pos = [0, 0], giro = 0, color = "#b5643c" } = {}) {
  const g = new THREE.Group(); const m = pintura(color), h = pintura("#33303a");
  g.add(malla(new THREE.BoxGeometry(1.8, 0.08, 0.45), m, [0, 0.45, 0]));
  g.add(malla(new THREE.BoxGeometry(1.8, 0.35, 0.06), m, [0, 0.72, -0.2], [-0.15, 0, 0]));
  for (const x of [-0.75, 0.75]) g.add(malla(new THREE.BoxGeometry(0.07, 0.45, 0.42), h, [x, 0.225, 0]));
  g.position.set(pos[0], 0, pos[1]); g.rotation.y = rad(giro); marcar(g); mundo.escena.add(g); return g;
}

function caja(mundo, { pos = [0, 0, 0], tam = [1, 1, 1], color = "#c9944f", tipo = "madera", giro = 0 } = {}) {
  const mapa = tipo ? pintarSuelo(tipo, color, 9) : null;
  const m = malla(new THREE.BoxGeometry(...tam), pintura(mapa ? "#ffffff" : color, { mapa }), [pos[0], pos[1] + tam[1] / 2, pos[2]], [0, rad(giro), 0]);
  marcar(m); mundo.escena.add(m); return m;
}

/** Cartel con texto (la cara del texto no se apaga con la sombra, para que se lea). */
function cartel(mundo, { pos = [0, 0, 0], giro = 0, texto = "CARTEL", ancho = 2, alto = 0.8, fondo = "#f6e7c1", tinta = "#2a1d2a", palo = true } = {}) {
  const g = new THREE.Group();
  const [c, gg] = lienzo(512, Math.round((512 * alto) / ancho));
  gg.fillStyle = fondo; gg.fillRect(0, 0, c.width, c.height);
  gg.fillStyle = tinta; gg.textAlign = "center"; gg.textBaseline = "middle";
  gg.font = `900 ${Math.round(c.height * 0.5)}px "Archivo Black", "Montserrat", sans-serif`;
  gg.fillText(texto, c.width / 2, c.height * 0.54, c.width * 0.9);
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), plano("#ffffff", { map: texturaDe(c) }));
  cara.position.z = 0.051; g.add(cara);
  g.add(malla(new THREE.BoxGeometry(ancho + 0.1, alto + 0.1, 0.1), pintura("#7a5136")));
  if (palo) g.add(malla(new THREE.BoxGeometry(0.1, pos[1] + 0.01, 0.1), pintura("#7a5136"), [0, -pos[1] / 2 - alto / 2, -0.05]));
  g.position.set(...pos); g.rotation.y = rad(giro); marcar(g); mundo.escena.add(g); return g;
}

function nubes(mundo, { cantidad = 9, semilla = 5, distancia = [160, 320], altura = [35, 80] } = {}) {
  const r = azar(semilla); const mat = pintura("#ffffff", { suave: 0.35, mezclaSombra: 0.45, recibe: false, nieblaMax: 0.2 });
  for (let i = 0; i < cantidad; i++) {
    const g = new THREE.Group();
    const a = (i / cantidad) * Math.PI * 2 + r() * 0.5, d = lerp(distancia[0], distancia[1], r());
    for (let k = 0; k < 4; k++) { const s = 6 + r() * 7; const m = malla(new THREE.SphereGeometry(s, 20, 14), mat, [(k - 1.5) * 8 + r() * 3, r() * 3, r() * 4]); m.scale.y = 0.62; g.add(m); }
    g.position.set(Math.sin(a) * d, lerp(altura[0], altura[1], r()), Math.cos(a) * d);
    g.lookAt(0, g.position.y, 0);
    marcar(g, "nada", false); mundo.escena.add(g);
  }
}

// ───────────────────────── efectos 2D (pegatinas en el mundo) ─────────────────────────

function pintarEfecto(tipo) {
  const [c, g] = lienzo(256, 256); const t = ESTILO.tintaPersonaje;
  g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = t; g.lineWidth = 9;
  if (tipo === "impacto") {
    g.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rr = i % 2 ? 50 : 118; g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr); } g.closePath();
    g.fillStyle = "#ffd23f"; g.fill(); g.stroke(); g.fillStyle = "#fffbe8"; g.beginPath(); g.arc(128, 128, 34, 0, 7); g.fill();
  } else if (tipo === "polvo") {
    g.fillStyle = "#efe6d8"; [[80, 160, 52], [150, 150, 60], [118, 98, 44]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); });
  } else if (tipo === "exclamacion" || tipo === "pregunta") {
    g.font = '900 220px "Archivo Black", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 16; g.strokeText(tipo === "pregunta" ? "?" : "!", 128, 136); g.fillStyle = tipo === "pregunta" ? "#ffd23f" : "#ff5a3c"; g.fillText(tipo === "pregunta" ? "?" : "!", 128, 136);
  } else if (tipo === "notas") {
    g.fillStyle = t; [[90, 170], [170, 150]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 26, 19, -0.4, 0, 7); g.fill(); g.fillRect(x + 18, y - 110, 9, 112); });
    g.fillRect(105, 40, 75, 16); g.fillRect(105, 60, 75, 12);
  } else if (tipo === "brillo") {
    g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? 22 : 110; g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr); } g.closePath();
    g.fillStyle = "#fff7c2"; g.fill(); g.stroke();
  } else if (tipo === "sudor") {
    g.beginPath(); g.moveTo(128, 40); g.quadraticCurveTo(200, 150, 128, 200); g.quadraticCurveTo(56, 150, 128, 40); g.fillStyle = "#8fd3ff"; g.fill(); g.stroke();
  } else if (tipo === "corazon") {
    g.beginPath(); g.moveTo(128, 210); g.bezierCurveTo(10, 130, 50, 30, 128, 85); g.bezierCurveTo(206, 30, 246, 130, 128, 210); g.fillStyle = "#ff4d6d"; g.fill(); g.stroke();
  }
  return texturaDe(c);
}
export const TIPOS_EFECTO = ["impacto", "polvo", "exclamacion", "pregunta", "notas", "brillo", "sudor", "corazon"];

/** Efecto plano de dibujo animado en un punto 3D: aparece con un pop en t y dura `dur`. */
function efecto(mundo, tipo, { pos = [0, 1.5, 0], t = 0, dur = 0.6, tam = 0.8 } = {}) {
  const tex = pintarEfecto(tipo);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.position.set(...pos); m.renderOrder = 5; m.userData.tinta = "nada"; m.userData.infoMat = infoMat(0, tex);
  m.layers.enable(CAPA_INFO);
  mundo.escena.add(m);
  mundo.efectos.push({ m, t, dur, tam });
  return m;
}

// ───────────────────────── cámara ─────────────────────────

/**
 * Cámara por planos. Cada plano: { t, pos:[x,y,z], mira:[x,y,z], fov=38, giro=0 (grados de inclinación),
 *   empuje=5 (% por segundo que se acerca en el plano fijo), corte=false|true|'fundido', dur=0.8 (s del deslizamiento),
 *   luz='dia'|'atardecer'|'noche' (cambia sólo en cortes y fundidos), sol={az,el} opcional }
 * Sin corte, la cámara se desliza desde donde estaba con entrada y salida suaves (dur 0,6–1,3 s).
 */
export function crearCamara(planos) {
  const keys = planos.slice().sort((a, b) => a.t - b.t);
  let luz = keys[0].luz ?? "dia";
  keys.forEach((k, i) => { if (i === 0 || k.corte) luz = k.luz ?? luz; k._luz = luz; });
  const enKey = (k, t) => {
    const e = k.empuje ?? 5, dt = Math.max(0, t - k.t), f = Math.exp(-(e / 100) * dt);
    const pos = [k.mira[0] + (k.pos[0] - k.mira[0]) * f, k.mira[1] + (k.pos[1] - k.mira[1]) * f, k.mira[2] + (k.pos[2] - k.mira[2]) * f];
    return { pos, mira: k.mira.slice(), fov: k.fov ?? 38, giro: k.giro ?? 0 };
  };
  const estado = (t, hasta = keys.length) => {
    let cur = enKey(keys[0], t), plano = 0;
    for (let i = 1; i < hasta; i++) {
      const k = keys[i]; if (t < k.t) break;
      if (k.corte) { cur = enKey(k, t); plano = i; continue; }
      const nx = enKey(k, t), u = suave((t - k.t) / (k.dur ?? 0.8));
      cur = { pos: lerp3(cur.pos, nx.pos, u), mira: lerp3(cur.mira, nx.mira, u), fov: lerp(cur.fov, nx.fov, u), giro: lerp(cur.giro, nx.giro, u) };
    }
    const kp = keys[plano];
    const inicio = estadoBase(kp);
    return { ...cur, plano, luz: kp._luz, sol: kp.sol ?? LUCES[kp._luz].sol, ejePlano: inicio };
  };
  // eje de la cámara al empezar el plano (para el sol pegado al plano)
  const estadoBase = (kp) => { const d = [kp.mira[0] - kp.pos[0], kp.mira[2] - kp.pos[2]]; return Math.atan2(d[0], d[1]); };
  return {
    keys,
    /** Devuelve { A, B, mezcla }: B sólo existe durante un fundido (0,25 s). */
    en(t) {
      const A = estado(t);
      for (let i = 1; i < keys.length; i++) {
        const k = keys[i];
        if (k.corte === "fundido" && t >= k.t && t < k.t + 0.25) {
          return { A: estado(t, i), B: A, mezcla: suave((t - k.t) / 0.25) };
        }
      }
      return { A, B: null, mezcla: 0 };
    },
    estado,
  };
}

// ───────────────────────── mundo y render ─────────────────────────

/**
 * Crea el mundo sobre un <canvas> de 1080×1920.
 * Devuelve { escena, THREE, suelo(), losa(), casa(), arbol(), farola(), banco(), caja(), cartel(), nubes(),
 *            personaje(), efecto(), camara(planos), destellos[], golpes[], render(t), listo() }
 */
export function crearMundo(canvas, { ancho = 1080, alto = 1920, fps = ESTILO.fps } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(ancho, alto, false);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.autoClear = true;

  const escena = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(38, ancho / alto, 0.3, 1500);
  const escala = alto / 1920;

  // cielo
  const cieloMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uArriba: { value: new THREE.Color() }, uHorizonte: { value: new THREE.Color() } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 uArriba; uniform vec3 uHorizonte; varying vec3 vD;
      void main(){ float y = clamp(vD.y, 0.0, 1.0); float k = pow(smoothstep(0.0, 0.55, y), 0.75); gl_FragColor = vec4(mix(uHorizonte, uArriba, k), 1.0); }`,
  });
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), cieloMat);
  cielo.frustumCulled = false; cielo.renderOrder = -10;
  escena.add(cielo);

  // destinos de render
  const rt = (op = {}) => new THREE.WebGLRenderTarget(ancho, alto, { type: THREE.HalfFloatType, ...op });
  const rtColor = rt({ samples: 4 });
  const mkInfo = () => { const d = new THREE.DepthTexture(ancho, alto); d.type = THREE.FloatType; return new THREE.WebGLRenderTarget(ancho, alto, { type: THREE.UnsignedByteType, depthTexture: d }); };
  const rtInfo = mkInfo();
  const rtA = rt(), rtB = rt();
  const TS = 2048;
  const dS = new THREE.DepthTexture(TS, TS); dS.type = THREE.FloatType;
  const rtSombra = new THREE.WebGLRenderTarget(TS, TS, { depthTexture: dS });
  U.uSombra.value = dS; U.uSombraTexel.value = 1 / TS;
  const camSombra = new THREE.OrthographicCamera(-40, 40, 40, -40, 1, 260);
  camSombra.layers.set(CAPA_SOMBRA);
  const matProf = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide });

  // pasadas a pantalla completa
  const camQuad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const escQuad = new THREE.Scene(); escQuad.add(quad);
  const VQ = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  const matTinta = new THREE.ShaderMaterial({
    vertexShader: VQ,
    uniforms: {
      tColor: { value: null }, tInfo: { value: rtInfo.texture }, tProf: { value: rtInfo.depthTexture },
      uTexel: { value: new THREE.Vector2(1 / ancho, 1 / alto) }, uR: { value: ESTILO.anchoTinta * escala }, uRc: { value: ESTILO.anchoPliegue * escala },
      uNear: { value: cam.near }, uFar: { value: cam.far }, uTinta: { value: lin(ESTILO.tintaMundo) },
      uNiebla: U.uNiebla, uNieblaCerca: U.uNieblaCerca, uNieblaLejos: U.uNieblaLejos,
    },
    fragmentShader: /* glsl */ `
      uniform sampler2D tColor; uniform sampler2D tInfo; uniform sampler2D tProf;
      uniform vec2 uTexel; uniform float uR; uniform float uRc; uniform float uNear; uniform float uFar;
      uniform vec3 uTinta; uniform vec3 uNiebla; uniform float uNieblaCerca; uniform float uNieblaLejos;
      varying vec2 vUv;
      float vz(vec2 uv) { float d = texture2D(tProf, uv).r; return uNear * uFar / (uFar - d * (uFar - uNear)); }
      // tinta en un punto: siluetas y saltos de profundidad (sólo en el lado cercano) + aristas convexas
      float tintaEn(vec2 uv) {
        vec4 c = texture2D(tInfo, uv);
        if (c.a < 0.75) return 0.0;
        float z0 = vz(uv);
        vec3 n0 = c.xyz * 2.0 - 1.0;
        float t = 0.0;
        for (int i = 0; i < 4; i++) {
          vec2 dir = i == 0 ? vec2(1.0, 0.0) : i == 1 ? vec2(0.0, 1.0) : i == 2 ? vec2(0.7071, 0.7071) : vec2(0.7071, -0.7071);
          for (int j = 0; j < 2; j++) {
            vec2 o = dir * (j == 0 ? uR * 0.5 : uR) * uTexel;
            float res = 2.0 - z0 / vz(uv + o) - z0 / vz(uv - o);
            t = max(t, smoothstep(0.014, 0.03, res));
          }
          vec2 oc = dir * uRc * uTexel;
          float rc = 2.0 - z0 / vz(uv + oc) - z0 / vz(uv - oc);
          if (rc > -0.0015) {
            vec4 a = texture2D(tInfo, uv + oc), b = texture2D(tInfo, uv - oc);
            if (a.a > 0.75) t = max(t, 1.0 - smoothstep(0.78, 0.9, dot(n0, a.xyz * 2.0 - 1.0)));
            if (b.a > 0.75) t = max(t, 1.0 - smoothstep(0.78, 0.9, dot(n0, b.xyz * 2.0 - 1.0)));
          }
        }
        return t * (1.0 - smoothstep(uNieblaLejos * 0.85, uNieblaLejos * 1.7, z0));
      }
      void main() {
        vec3 col = texture2D(tColor, vUv).rgb;
        // 4 muestras desplazadas medio píxel: bordes de la tinta suaves, sin escalones ni rayas discontinuas
        vec2 h = uTexel * 0.25;
        float tinta = 0.25 * (tintaEn(vUv + vec2(-h.x, -h.y)) + tintaEn(vUv + vec2(h.x, -h.y)) + tintaEn(vUv + vec2(-h.x, h.y)) + tintaEn(vUv + vec2(h.x, h.y)));
        float f = smoothstep(uNieblaCerca, uNieblaLejos, vz(vUv));
        gl_FragColor = vec4(mix(col, mix(uTinta, uNiebla, 0.3 * f), tinta), 1.0);
      }`,
  });

  const matFinal = new THREE.ShaderMaterial({
    vertexShader: VQ,
    uniforms: {
      tA: { value: rtA.texture }, tB: { value: rtB.texture }, uMezcla: { value: 0 },
      uMov: { value: new THREE.Vector2() }, uDestello: { value: 0 }, uGolpe: { value: new THREE.Vector3() },
      uSat: { value: ESTILO.saturacion }, uVin: { value: ESTILO.vineta }, uAspecto: { value: ancho / alto },
    },
    fragmentShader: /* glsl */ `
      uniform sampler2D tA; uniform sampler2D tB; uniform float uMezcla; uniform vec2 uMov;
      uniform float uDestello; uniform vec3 uGolpe; uniform float uSat; uniform float uVin; uniform float uAspecto;
      varying vec2 vUv;
      vec3 muestra(vec2 uv) { vec3 a = texture2D(tA, uv).rgb; if (uMezcla > 0.0) a = mix(a, texture2D(tB, uv).rgb, uMezcla); return a; }
      vec3 srgb(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      vec3 hombro(vec3 c) { return mix(c, 0.82 + 0.18 * (1.0 - exp(-(c - 0.82) / 0.18)), step(0.82, c)); }
      void main() {
        vec2 p = vUv - 0.5; p.x *= uAspecto;
        float s = sin(uGolpe.z), co = cos(uGolpe.z);
        p = mat2(co, -s, s, co) * p; p.x /= uAspecto;
        vec2 uv = p / (1.0 + abs(uGolpe.x) * 4.0 + abs(uGolpe.z) * 2.0) + 0.5 + uGolpe.xy;
        vec3 c = vec3(0.0);
        if (length(uMov) > 0.0005) { for (int i = 0; i < 12; i++) { c += muestra(uv + uMov * (float(i) / 11.0 - 0.5)); } c /= 12.0; }
        else c = muestra(uv);
        c = srgb(hombro(c));
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, uSat);
        c = vec3(0.012, 0.008, 0.012) + c * 0.985;
        vec2 q = (vUv - 0.5) * vec2(1.0, 1.0 / uAspecto) * 1.6;
        c *= 1.0 - uVin * smoothstep(0.2, 0.95, length(q) * 1.15);
        c = mix(c, vec3(1.0), uDestello);
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`,
  });

  const mundo = {
    THREE, escena, camara3d: cam, personajes: [], efectos: [], destellos: [], golpes: [], camaraPlanos: null, animaciones: [],
    /** Registra una función f(t) que mueve cosas propias de la escena (máquinas, puertas, objetos que caen…). */
    animar(f) { mundo.animaciones.push(f); },
    suelo: (op) => suelo(mundo, op), losa: (op) => losa(mundo, op), casa: (op) => casa(mundo, op),
    arbol: (op) => arbol(mundo, op), farola: (op) => farola(mundo, op), banco: (op) => banco(mundo, op),
    caja: (op) => caja(mundo, op), cartel: (op) => cartel(mundo, op), nubes: (op) => nubes(mundo, op),
    personaje: (op) => personaje(mundo, op), efecto: (tipo, op) => efecto(mundo, tipo, op),
    pintura, marcar: (obj, tipo, sombra) => { marcar(obj, tipo, sombra); return obj; },
    camara(planos) { mundo.camaraPlanos = crearCamara(planos); return mundo.camaraPlanos; },

    /** Dibuja el fotograma del segundo t. */
    render(t) {
      for (const f of mundo.animaciones) f(t);
      for (const pj of mundo.personajes) pj.actualizar(t);
      const c = mundo.camaraPlanos.en(t);
      pintarPlano(c.A, rtA, t);
      if (c.B) pintarPlano(c.B, rtB, t);
      // desenfoque de movimiento sólo en barridos rápidos (whip), nunca en planos normales
      const mov = new THREE.Vector2();
      if (!c.B) {
        const dt = 1 / fps; const prev = mundo.camaraPlanos.estado(t - dt);
        if (prev.plano === c.A.plano) {
          colocarCamara(prev);
          const P = new THREE.Vector3(...prev.mira).sub(cam.position).normalize().multiplyScalar(10).add(cam.position);
          colocarCamara(c.A);
          P.project(cam);
          const px = Math.hypot(P.x * ancho * 0.5, P.y * alto * 0.5) / escala;
          const k = clamp01((px - 30) / 20); // ≥30 px/fotograma a 1080: sólo barridos rápidos
          if (k > 0) mov.set(P.x * 0.5 * 0.55 * k, P.y * 0.5 * 0.55 * k);
        }
      }
      // golpe: sacudida que cambia de signo cada 1/30 s y se apaga en 7/30 s
      const g = new THREE.Vector3();
      for (const { t: tg, fuerza = 1 } of mundo.golpes) {
        const u = (t - tg) / 0.233;
        if (u >= 0 && u < 1) { const sg = Math.floor((t - tg) * 30) % 2 ? -1 : 1; const a = (1 - u) * (1 - u) * fuerza; g.x += sg * a * 0.0042; g.y += -sg * a * 0.0025; g.z += sg * a * rad(0.3); }
      }
      let flash = 0;
      for (const td of mundo.destellos) { const u = (t - td) / 0.135; if (u >= 0 && u < 1) flash = Math.max(flash, 1 - u * u); }
      const lz = LUCES[c.A.luz];
      matFinal.uniforms.uSat.value = c.B ? lerp(lz.saturacion, LUCES[c.B.luz].saturacion, c.mezcla) : lz.saturacion;
      matFinal.uniforms.uMezcla.value = c.B ? c.mezcla : 0;
      matFinal.uniforms.uMov.value.copy(mov);
      matFinal.uniforms.uDestello.value = flash;
      matFinal.uniforms.uGolpe.value.copy(g);
      quad.material = matFinal;
      renderer.setRenderTarget(null);
      renderer.render(escQuad, camQuad);
    },

    /** Espera a que las fuentes estén cargadas y compila los shaders. Llama antes del primer render. */
    async listo() {
      try { await document.fonts.ready; } catch (e) { /* sin fuentes: sigue */ }
      for (const exp of Object.keys(EXPRESIONES)) for (const p of [0, 1, 2]) renderer.initTexture(texturaCara(exp, p));
      await renderer.compileAsync(escena, cam);
      // primer fotograma de calentamiento + lectura de un píxel: así la GPU termina antes del primer seek
      mundo.render(0);
      const px = new Uint8Array(4); const gl = renderer.getContext();
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    },
  };

  function colocarCamara(e) {
    cam.position.set(...e.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(...e.mira);
    cam.rotateZ(rad(e.giro));
    cam.fov = e.fov; cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }

  function aplicarLuz(e) {
    const L = LUCES[e.luz] ?? LUCES.dia;
    // sol pegado al plano: az = grados desde el eje de la cámara hacia su derecha
    // (0 = delante, contraluz · 90 = a la derecha · 180 = detrás de la cámara)
    const eje = e.ejePlano, az = rad(e.sol?.az ?? L.sol.az), el = rad(e.sol?.el ?? L.sol.el);
    const fx = Math.sin(eje), fz = Math.cos(eje);        // delante de la cámara (horizontal)
    const rx = -fz, rz = fx;                              // derecha de la cámara
    const dir = new THREE.Vector3((fx * Math.cos(az) + rx * Math.sin(az)) * Math.cos(el), Math.sin(el), (fz * Math.cos(az) + rz * Math.sin(az)) * Math.cos(el));
    U.uSol.value.copy(dir.normalize()); // apunta HACIA el sol
    U.uLit.value.set(...L.lit); U.uShade.value.set(...L.shade);
    U.uNiebla.value.copy(lin(L.cieloHorizonte));
    U.uNieblaCerca.value = L.nieblaCerca; U.uNieblaLejos.value = L.nieblaLejos;
    U.uNoche.value = L.ventanas; U.uFarolas.value = L.farolas;
    cieloMat.uniforms.uArriba.value.copy(lin(L.cieloArriba));
    cieloMat.uniforms.uHorizonte.value.copy(lin(L.cieloHorizonte));
  }

  function pintarPlano(e, destino, t) {
    aplicarLuz(e);
    colocarCamara(e);
    U.uCam.value.copy(cam.position);
    cielo.position.copy(cam.position);
    // efectos: miran a cámara y hacen pop
    for (const fx of mundo.efectos) {
      const u = (t - fx.t);
      const vis = u >= 0 && u < fx.dur;
      fx.m.visible = vis;
      if (vis) {
        const s = u < 0.09 ? suave(u / 0.09) * 1.15 : u < 0.16 ? lerp(1.15, 1, suave((u - 0.09) / 0.07)) : u > fx.dur - 0.1 ? suave((fx.dur - u) / 0.1) : 1;
        fx.m.scale.setScalar(Math.max(0.001, s));
        fx.m.quaternion.copy(cam.quaternion);
      }
    }
    // sombra: cámara ortográfica del sol centrada en lo que mira el plano
    const centro = new THREE.Vector3(...e.mira);
    const S = Math.min(60, Math.max(10, new THREE.Vector3(...e.pos).distanceTo(centro) * 1.3));
    camSombra.left = -S; camSombra.right = S; camSombra.top = S; camSombra.bottom = -S;
    camSombra.position.copy(centro).addScaledVector(U.uSol.value, 120);
    camSombra.lookAt(centro); camSombra.updateMatrixWorld(); camSombra.updateProjectionMatrix();
    U.uSombraMat.value.multiplyMatrices(camSombra.projectionMatrix, camSombra.matrixWorldInverse);
    escena.overrideMaterial = matProf;
    renderer.setRenderTarget(rtSombra); renderer.clear(); renderer.render(escena, camSombra);
    escena.overrideMaterial = null;
    // color
    cam.layers.set(0);
    renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(escena, cam);
    // información para la tinta (normales + tipo + profundidad)
    const guardados = [];
    escena.traverse((m) => { if (m.isMesh && m.layers.isEnabled(CAPA_INFO)) { guardados.push([m, m.material]); m.material = m.userData.infoMat ?? INFO[m.userData.tinta ?? "mundo"]; } });
    cam.layers.set(CAPA_INFO);
    renderer.setRenderTarget(rtInfo); renderer.setClearColor(0x8080ff, 0); renderer.clear(); renderer.render(escena, cam);
    for (const [m, mat] of guardados) m.material = mat;
    cam.layers.set(0);
    renderer.setClearColor(0x000000, 1);
    // tinta encima del color
    matTinta.uniforms.tColor.value = rtColor.texture;
    quad.material = matTinta;
    renderer.setRenderTarget(destino); renderer.render(escQuad, camQuad);
  }

  return mundo;
}
