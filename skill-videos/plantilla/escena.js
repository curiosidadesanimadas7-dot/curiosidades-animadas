// escena.js · Lo que pasa en ESTE vídeo: el sitio, los personajes, la cámara y las acciones.
// Es el único archivo de código que cambias para cada vídeo (además de los textos de index.html).
// Todos los tiempos salen de assets/transcript.json: cada cosa ocurre 0–0,1 s ANTES de que la voz la nombre.
//
// Ejemplo: «Este panadero tiene una máquina que amasa sola…» (8 s de muestra).

import { crearMundo, THREE } from "./motor/estilo3d.js";

export async function crearEscena(canvas) {
  const mundo = crearMundo(canvas);

  // ── El sitio: una calle con la panadería ──
  mundo.suelo({ tipo: "adoquin", color: "#c7b49a", metrosPorTextura: 3.2 });
  mundo.losa({ desde: [-26, -4.2], hasta: [26, -1.3], alto: 0.15, tipo: "baldosa", color: "#e2d6c2" });
  mundo.casa({ pos: [-10.6, -7.2], ancho: 6.2, alto: 7, color: "#cf7f5c", tejado: "#8a3f32", semilla: 2 });
  mundo.casa({ pos: [-3.6, -7.2], ancho: 7, alto: 8.4, color: "#efd9a7", tejado: "#a2493a", rotulo: "PANADERÍA", colorRotulo: "#b8413a", toldo: "#c8433b", semilla: 4 });
  mundo.casa({ pos: [3.6, -7.2], ancho: 6.6, alto: 9.8, color: "#8fb3c9", tejado: "#5b4a63", semilla: 6 });
  mundo.casa({ pos: [10.6, -7.2], ancho: 6.4, alto: 7.6, color: "#d6a24f", tejado: "#8a3f32", semilla: 8 });
  mundo.casa({ pos: [-6, 14], giro: 180, ancho: 8, alto: 7.5, color: "#b9c98f", tejado: "#7d4434", semilla: 12 });
  mundo.casa({ pos: [5, 14], giro: 180, ancho: 8, alto: 8.6, color: "#e3a27f", tejado: "#5b4a63", semilla: 14 });
  mundo.arbol({ pos: [-7.4, -2.6], alto: 5.2, semilla: 3 });
  mundo.arbol({ pos: [7.2, -2.6], alto: 4.6, color: "#6cae4f", semilla: 9 });
  mundo.farola({ pos: [0.2, -1.9] });
  mundo.farola({ pos: [-14, -1.9] });
  mundo.banco({ pos: [5, -2.4] });
  mundo.nubes({ cantidad: 10 });

  // la máquina de amasar: una caja y un brazo que gira (se anima con mundo.animar)
  const maquina = new THREE.Group();
  maquina.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.7), mundo.pintura("#c9ccd6")));
  maquina.children[0].position.y = 0.4;
  const cuenco = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.38, 24), mundo.pintura("#e7e2d6"));
  cuenco.position.y = 1.0; maquina.add(cuenco);
  const brazo = new THREE.Group(); brazo.position.y = 1.5; maquina.add(brazo);
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.62, 10), mundo.pintura("#3c3f4f"));
  palo.position.set(0.12, -0.25, 0); palo.rotation.z = 0.35; brazo.add(palo);
  maquina.position.set(-1.0, 0.15, -2.6);
  mundo.marcar(maquina); mundo.escena.add(maquina);
  mundo.animar((t) => { brazo.rotation.y = t * 7; });

  // ── Los personajes ──
  const panadero = mundo.personaje({ ropa: "#4f86c6", sombrero: "cocinero", bigote: true });
  panadero.camino = [[0, -2.3, -2.3, 0.15]];
  panadero.mirar = [[0, 20]];
  panadero.caras = [[0, "orgullo"], [4.15, "sorpresa"], [5.2, "risa"]];
  panadero.poses = [[0, "jarras"], [2.0, "senalar"], [4.15, "sorpresa"], [5.2, "celebrar"]];
  panadero.saltos = [4.15];

  const vecina = mundo.personaje({ ropa: "#d9534f", sombrero: "pelo", colorSombrero: "#5a3a2c" });
  vecina.camino = [[0, 4.5, 0.4], [2.9, 0.9, -0.6], [8, 0.9, -0.6]];
  vecina.mirar = [[2.9, -40]];
  vecina.caras = [[0, "normal"], [3.0, "duda"], [4.15, "miedo"], [5.2, "contento"]];
  vecina.poses = [[0, "abajo"], [3.0, "pensar"], [4.15, "sorpresa"], [5.2, "saludo"]];

  // efectos de dibujo (aparecen con un pop)
  mundo.efecto("exclamacion", { pos: [0.95, 1.95, -0.6], t: 4.15, dur: 0.7, tam: 0.42 });
  mundo.efecto("polvo", { pos: [-1.0, 1.3, -2.2], t: 4.1, dur: 0.5, tam: 0.9 });
  mundo.efecto("notas", { pos: [-2.0, 2.1, -2.1], t: 5.3, dur: 1.2, tam: 0.55 });

  // ── Cámara (plano a plano) ──
  // Encuadre vertical: la parte de arriba de la cabeza al 28–35 % de la altura en planos cortos,
  // así la cara queda por encima de los subtítulos. Para subir al personaje en el cuadro, mira más abajo (mira y ≈ 1).
  mundo.camara([
    // 0,0 · plano general ya con todo: el sitio, el panadero, la máquina y cielo arriba
    { t: 0, pos: [2.6, 1.15, 9.2], mira: [-1.4, 2.2, -3], fov: 44, empuje: 5, luz: "dia" },
    // 1,6 · corte a plano medio del panadero y la máquina, algo inclinado
    { t: 1.6, corte: true, pos: [0.9, 1.3, 2.9], mira: [-1.5, 1.05, -2.4], fov: 40, giro: -4, empuje: 7 },
    // 3,0 · corte a la vecina que llega (el salto es grande: deslizar aquí sería un barrido borroso)
    { t: 3.0, corte: true, pos: [-1.6, 1.35, 3.0], mira: [0.7, 0.95, -0.7], fov: 40, giro: 0, empuje: 6 },
    // 4,15 · deslizamiento corto + empuje fuerte en la palabra clave
    { t: 4.15, dur: 0.6, pos: [-0.7, 1.45, 1.8], mira: [0.8, 1.1, -0.6], fov: 40, giro: 4, empuje: 18 },
    // 5,0 · fundido a atardecer, plano bajo y amplio
    { t: 5.0, corte: "fundido", pos: [5.5, 0.9, 7.6], mira: [-0.8, 3.6, -3.2], fov: 44, empuje: 4, luz: "atardecer" },
    // 6,7 · barrido rápido (sale con desenfoque de movimiento)
    { t: 6.7, dur: 0.35, pos: [5.5, 0.9, 7.6], mira: [14, 3.2, -3.2], fov: 44, empuje: 3 },
    // 7,2 · corte a la noche
    { t: 7.2, corte: true, pos: [-0.2, 1.3, 6.6], mira: [-2.4, 1.9, -3.4], fov: 42, empuje: 5, luz: "noche" },
  ]);
  mundo.destellos.push(1.6);          // flash blanco justo después del gancho
  mundo.golpes.push({ t: 4.15, fuerza: 1 }); // sacudida en el impacto

  await mundo.listo();
  return mundo;
}
