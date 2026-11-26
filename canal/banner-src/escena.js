// Banner de Curiosidades Animadas: la calle del canal con personajes flipando a los lados del título.
import { crearMundo, THREE } from "./motor/estilo3d.js";
export async function crearEscena(canvas) {
  const mundo = crearMundo(canvas, { ancho: 2560, alto: 1440 });
  mundo.suelo({ tipo: "adoquin", color: "#c7b49a", metrosPorTextura: 3.2 });
  mundo.losa({ desde: [-40, -4.2], hasta: [40, -1.3], alto: 0.15, tipo: "baldosa", color: "#e2d6c2" });
  const casas = [["#cf7f5c","#8a3f32"],["#efd9a7","#a2493a"],["#8fb3c9","#5b4a63"],["#d6a24f","#8a3f32"],["#b9c98f","#7d4434"],["#e3a27f","#5b4a63"],["#cf7f5c","#8a3f32"],["#8fb3c9","#a2493a"]];
  casas.forEach(([c, t], i) => mundo.casa({ pos: [-24.5 + i * 7, -7.2], ancho: 6.6, alto: 7 + (i % 3) * 1.3, color: c, tejado: t, semilla: 2 + i * 2 }));
  mundo.arbol({ pos: [-9.5, -2.6], alto: 5, semilla: 3 });
  mundo.arbol({ pos: [9.5, -2.6], alto: 4.6, color: "#6cae4f", semilla: 9 });
  mundo.farola({ pos: [-13, -1.9] }); mundo.farola({ pos: [13, -1.9] });
  mundo.nubes({ cantidad: 12, semilla: 5 });

  const pj = (ropa, sombrero, x, z, cara, pose, mirar, extra = {}) => {
    const p = mundo.personaje({ ropa, sombrero, ...extra });
    p.camino = [[0, x, z, 0]]; p.mirar = [[0, mirar]]; p.caras = [[0, cara]]; p.poses = [[0, pose]];
    return p;
  };
  // izquierda
  pj("#ff8a1f", "gorra", -4.25, 0.6, "sorpresa", "arriba", 25, { colorSombrero: "#2f7de1" });
  pj("#4f86c6", "cocinero", -5.55, -0.3, "risa", "senalar", 40, { bigote: true });
  // derecha
  pj("#d9534f", "pelo", 4.25, 0.6, "sorpresa", "sorpresa", -25, { colorSombrero: "#5a3a2c" });
  pj("#6cae4f", "sombrero", 5.55, -0.3, "risa", "senalar", -40, { colorSombrero: "#3c3f4f" });
  mundo.efecto("exclamacion", { pos: [-3.8, 1.5, 0.6], t: 0.1, dur: 30, tam: 0.38 });
  mundo.efecto("pregunta", { pos: [5.9, 1.55, -0.3], t: 0.1, dur: 30, tam: 0.38 });
  mundo.efecto("brillo", { pos: [-5.9, 1.55, -0.3], t: 0.1, dur: 30, tam: 0.3 });
  mundo.efecto("exclamacion", { pos: [4.6, 1.5, 0.6], t: 0.1, dur: 30, tam: 0.34 });
  mundo.camara([{ t: 0, pos: [0, 1.0, 9.9], mira: [0, 0.86, 0], fov: 40, empuje: 0, luz: "dia" }]);
  await mundo.listo();
  return mundo;
}
