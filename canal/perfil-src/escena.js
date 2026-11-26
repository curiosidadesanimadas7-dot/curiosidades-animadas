// Foto de perfil de Curiosidades Animadas: un personaje alucinando, con el estilo del canal.
import { crearMundo, THREE } from "./motor/estilo3d.js";
export async function crearEscena(canvas) {
  const q = new URLSearchParams(location.search);
  const mundo = crearMundo(canvas);
  mundo.suelo({ tipo: "adoquin", color: "#c7b49a", metrosPorTextura: 3.2 });
  mundo.nubes({ cantidad: 14, semilla: 3 });
  const pj = mundo.personaje({ ropa: q.get("ropa") || "#ff8a1f", sombrero: "gorra", colorSombrero: "#2f7de1" });
  pj.camino = [[0, 0, 0, 0]];
  pj.mirar = [[0, 0]];
  pj.caras = [[0, q.get("cara") || "sorpresa"]];
  pj.poses = [[0, q.get("pose") || "sorpresa"]];
  const e = q.get("efecto") || "exclamacion";
  if (e !== "no") mundo.efecto(e, { pos: [0.34, 1.5, 0.05], t: 0.1, dur: 30, tam: 0.26 });
  const cy = parseFloat(q.get("cy") || "0.75"), cz = parseFloat(q.get("cz") || "2.4");
  mundo.camara([{ t: 0, pos: [0, cy, cz], mira: [0, 1.25, 0], fov: 40, empuje: 0, luz: "dia" }]);
  await mundo.listo();
  return mundo;
}
