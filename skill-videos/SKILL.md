---
name: videos-historia-ilustrada
description: De una idea a un vídeo vertical de 55 a 70 segundos, contado como una historia con personajes 3D de dibujo animado en un mundo 3D pintado con líneas de tinta, con voz, subtítulos y palabras clave, hecho con HyperFrames y three.js y listo para Instagram o TikTok. Úsala cuando pidas «hazme un vídeo de…», «un reel o un short que explique…» o quieras convertir una idea, una noticia o un texto en un vídeo de 1080×1920.
---

Hecha por Alex Rodríguez · IA para empresas · alexrg.com

# Vídeos de historia ilustrada

Con esta skill, Claude convierte una idea en un vídeo vertical de 55 a 70 segundos. Unos personajes 3D de dibujo animado viven lo que cuenta una voz, dentro de un mundo 3D de colores vivos con líneas de tinta. Los subtítulos acompañan toda la voz y, de vez en cuando, una palabra clave grande salta en pantalla. Todo se construye con código (three.js para el 3D y GSAP para el texto) y se convierte en vídeo con HyperFrames.

## El estilo

1. **Personajes 3D** con cabeza blanca de judía, cuerpo de alubia de un color, brazos y piernas de palito, manos de punto y contorno ciruela. Por defecto, ojos de párpado (cara de póker). Sin nariz ni coloretes.
2. **Mundo 3D pintado.** Colores planos y saturados, juntas finas y líneas de tinta casi negras en los bordes.
3. **Luz cálida y sombras azuladas o violetas.** La luz cambia con la historia: día, atardecer, noche.
4. **Todo nítido.** Nada de fondo desenfocado.
5. **La cámara nunca está muerta.** Se acerca despacio en cada plano y se desliza suave de un plano a otro.
6. **Dos capas de texto.** Subtítulos pequeños abajo durante toda la voz y, de vez en cuando, una palabra clave grande.

La plantilla ya hace todo esto: `plantilla/motor/estilo3d.js` es el estilo y no se toca. Las medidas exactas están en `referencias/estilo.md`. **Antes de montar, mira los fotogramas de `referencias/fotogramas/`.** Son de otro creador y solo sirven para ver el estilo: no se publican ni se copian sus personajes, historias o planos.

## Lo que necesitas

- **Claude Code.**
- **Node 22 o superior, Chrome y FFmpeg.** Para comprobar que los tienes: `npx hyperframes doctor`.
- **La skill `hyperframes`**, que enseña a Claude cómo se escribe un vídeo con HyperFrames. Se instala con `npx hyperframes skills`. En el estilo, el guion y el plan manda esta skill (mira «Lo que manda esta skill», abajo).
- **Una voz.** Sirve la que trae HyperFrames, gratis y en tu ordenador: `npx hyperframes tts`, con la voz española `ef_dora`. La primera vez pide un paquete de Python que `doctor` no avisa. Instálalo en un entorno aparte:
  ```sh
  python3 -m venv ~/.venv-voz && ~/.venv-voz/bin/pip install kokoro-onnx soundfile
  export HYPERFRAMES_PYTHON=~/.venv-voz/bin/python
  ```
  Si tienes ElevenLabs u otro servicio, puedes usarlo. La clave va en una variable de entorno, nunca escrita en un archivo.
- **Internet** mientras haces el vídeo: la plantilla carga three.js y GSAP desde jsDelivr, y la transcripción se baja su modelo la primera vez.
- **Una tarjeta gráfica**, mejor. Sin ella, el 3D se dibuja con el procesador y el render tarda mucho más.

## Los 6 pasos

```
1. Guion  →  2. Voz  →  3. Plan  →  4. Montaje  →  5. Render  →  6. Repaso
```

Ve en orden. Sobre todo, no empieces a montar sin tener la voz: todo se cuadra con ella.

### 1. Guion

- **Entre 190 y 230 palabras.** La voz `ef_dora` va a unas 3,4 palabras por segundo, así que salen de 55 a 68 segundos.
- **Frases cortas,** como si se lo contaras a un amigo, y de tú.
- **La primera frase tiene que hacer que alguien se pare.** Un ejemplo: «Este panadero tiene una máquina que amasa sola, y trabaja más que antes».
- **Uno o dos sitios y de uno a tres personajes** (una panadería, un taller, una oficina…). La voz cuenta y el dibujo lo enseña. No digas con la voz lo que ya se ve.
- **Dos o tres momentos de luz.** Por ejemplo, de día para el arranque, al atardecer para el giro y de noche para la explicación.
- **Si das un dato, que sea uno que has comprobado.**

Guárdalo como `guion.md`, con el texto que va a decir la voz.

### 2. Voz

1. Crea el proyecto, ya en vertical, entra en él y copia encima la plantilla. **Todos los comandos que siguen se lanzan desde dentro de `mi-video`.**
   ```sh
   npx hyperframes init mi-video --resolution portrait --non-interactive
   cd mi-video
   cp -r ~/.claude/skills/skill-videos/plantilla/. .
   ```
   La plantilla trae `index.html`, `escena.js`, `subtitulos.mjs` y la carpeta `motor/`. Si pusiste la skill dentro de un proyecto, cópiala de `.claude/skills/skill-videos/plantilla/`.
2. Crea dentro de `mi-video` el archivo `guion.txt`, solo con el texto que se lee, sin títulos ni tablas. Guarda también ahí el `guion.md`. Después genera la voz:
   ```sh
   npx hyperframes tts guion.txt --voice ef_dora -o assets/voz.wav
   ```
3. Saca el segundo en el que se dice cada palabra:
   ```sh
   npx hyperframes transcribe assets/voz.wav --model small --language es
   ```
   Pon siempre `--model small`. Sin él, usa un modelo que solo sabe inglés y te traduce la voz.

   La transcripción queda en `assets/transcript.json`. Léela: si una palabra sale cambiada, es que la voz la dice mal. Escríbela en el guion como suena y vuelve a generar la voz.
4. Mira cuánto dura la voz:
   ```sh
   ffprobe -v error -show_entries format=duration -of csv=p=0 assets/voz.wav
   ```
   Tiene que durar entre 54 y 69 segundos. Si no, ajusta el guion y vuelve al punto 2. El vídeo dura lo que la voz y un segundo más.

### 3. Plan

Antes de escribir código, haz una tabla en `plan.md` con **una fila por plano: de 18 a 24 planos en un minuto** (cada 2 a 3,5 s):

| Segundo | Lo que dice la voz | Tipo | Plano y movimiento | Lo que pasa | Luz | Palabra clave | Sonido |
|---|---|---|---|---|---|---|---|
| 0,0 | Este panadero tiene una máquina… | CON PERSONAJES | General de la calle → acercándose | El panadero, en jarras, junto a la máquina | día | AMASA *SOLA* | whoosh |
| 1,6 | … 300 gramos de harina… | SOLO OBJETO | Detalle cenital de la báscula → acercándose | La aguja sube hasta 300 | día | — | pop |

- **Usa los segundos de la transcripción,** no los que te imaginas.
- **En el primer fotograma ya se ve todo:** el sitio, el personaje y de qué va. Nada de empezar en negro.
- **Cámara, como en los shorts del estilo:**
  - **Planos de 2 a 3,5 s (18-24 en un minuto), y ninguno quieto.** Cada plano lleva uno de estos movimientos: acercarse despacio (lo normal), barrido rápido para descubrir algo, **meterse dentro** de algo (una puerta, una pantalla, el objeto) hasta que es el siguiente decorado, o **plano aéreo** moviéndose para enseñar escala (una ciudad, una carretera, el mapa). En la palabra más fuerte de la frase, se acerca rápido durante un segundo.
  - Dentro del mismo sitio, de un plano a otro se pasa deslizando la cámara (0,6–1,3 s), no cortando. Solo si el salto es pequeño (como mucho media pantalla y un 40 % más cerca o más lejos).
  - Corte en los saltos grandes. Al cambiar de sitio o de luz, fundido de 0,25 s.
  - Flash blanco justo después de la primera frase.
  - En los momentos de drama o caída, inclina la cámara 3–5°. En los impactos, sacudida.
  - Barridos rápidos, los que pida la historia para descubrir algo (no en cada plano: marean).
  - La cámara, casi siempre a la altura de los ojos.
  - **Si el vídeo explica cómo funciona algo por dentro, la cámara entra en el objeto** y el mecanismo se ve moviéndose (zambullida rápida + fundido a un decorado «interior» montado lejos). La receta está en `automatizacion/prompt.md`, apartado «El porqué se ENSEÑA».
- **Planos SIN personajes cuando la voz nombra algo concreto** (cambio del 27/11): un objeto, una cifra, un documento, un sitio nuevo o un paso técnico que no está en el plano → **corte a un plano detalle o general sin personas**: el cronómetro avanzando, la nota en la pared con el dato escrito (`mundo.cartel`), la báscula vista desde arriba, el edificio desde el cielo, el objeto doblándose o rompiéndose. Entre un tercio y la mitad de los planos son así.
- **Exageraciones visuales** que refuerzan lo que dice la voz: alguien muy fuerte entra y el suelo se agrieta bajo sus pies (líneas rojas con `mundo.efecto('impacto')` y grietas de formas finas); alguien que se vuelve inofensivo haciendo algo ridículamente tranquilo (un gigante tejiendo una bufanda); alguien que pierde la paciencia pasa de calma a furia en un corte, con sacudida (`mundo.golpes`).
- **Color: todo vivo, y lo importante MÁS vivo.** Nada de grises ni de escenas apagadas. El decorado, en colores vivos pero algo más suaves (azules, verdes, arenas), y **el protagonista o el objeto del que se habla, en un color chillón** que no se repite en el resto del plano (rosa chicle, rojo intenso, amarillo eléctrico). Que el ojo vaya solo a él.
- **Rayos de luz** cuando haya una ventana, una rejilla o una puerta abierta: un cono o un prisma alargado, blanco-amarillento y muy transparente (`MeshBasicMaterial` con `transparent: true`, `opacity` 0,12-0,2, `depthWrite: false`), sin `mundo.marcar` (los rayos no llevan tinta). El motor no se toca.
- **Encuadre vertical.** En planos medios y primeros planos, la parte de arriba de la cabeza va al 28–35 % de la altura. Así la cara queda por encima de los subtítulos.
- **Palabras clave.** Una cada 5–8 s (de 8 a 12 en todo el vídeo), de 1 a 3 palabras, con la palabra que resume la frase en amarillo.
- **Sitios libres.**
  - Arriba, los primeros 250 px: los tapan los botones.
  - Los subtítulos van en su franja, de 1318 a 1394 px.
  - Las palabras clave, entre 300 y 1150 px y nunca encima de una cara.

### 4. Montaje

Pídele a Claude que monte el plan siguiendo la skill `hyperframes` y esta plantilla. Cada archivo tiene su papel:

| Archivo | Qué hay | ¿Se toca? |
|---|---|---|
| `escena.js` | El sitio, los personajes, la cámara y las acciones de este vídeo | Sí: es el único código que cambia |
| `index.html` | La duración, la voz, las palabras clave y los subtítulos | Sí, en las partes marcadas |
| `motor/estilo3d.js` | El estilo: luz, tinta, personajes, cámara y color | No |

1. **Duración y voz.** En `index.html`, pon en el `#root` `data-duration` = la voz + 1. Quita el comentario al `<audio id="voz">` y pon su `data-duration` = lo que dura la voz.
2. **Subtítulos.** Ejecuta `node subtitulos.mjs` (salen de 1 a 3 palabras, al golpe de la voz). Lee `assets/transcript.json` y escribe los subtítulos entre las marcas `SUBTITULOS`. Si `guion.txt` tiene las mismas palabras, usa su ortografía. Si avisa de que no coinciden, revisa a mano las tildes y los nombres.
   **Efectos de sonido.** Escribe `sfx.json` con un efecto en cada momento que lo pida y ejecuta `node sfx.mjs`, que copia los sonidos y los mete en `index.html` (entre las marcas `SFX`, por debajo de la voz). Lista de efectos y formato al principio de `sfx.mjs`. Cómo ponerlos:
   - `whoosh` o `whoosh-short` en cada corte con movimiento, barrido o zambullida; `impact-bass-1` en los golpes, las sacudidas y las revelaciones fuertes; `pop` cuando aparece algo o salta una palabra clave importante; `tictac` con un cronómetro o una espera; `sparkle` en un «¡anda!»; `error` en lo que sale mal; `riser` 10 s antes del clímax.
   - **Entre 12 y 25 efectos en un minuto.** Que acompañen, no que tapen: ninguno encima de una frase importante con más volumen que 0,4.
3. **Palabras clave.** Pon un `<div class="clip clave">` por palabra, como los del ejemplo:
   - `data-start`: cuando la voz dice la palabra, 0,05 s antes.
   - `data-duration`: de 1 a 1,6.
   - `style="top: …px"`: la altura donde va.
   - La palabra que resume va entre `<em>…</em>`, que la pone en amarillo.

   El pop de entrada y la salida ya están hechos.
4. **`escena.js`.** El ejemplo de la panadería enseña todo. Se construye con estas piezas (todos los tiempos, en segundos de la transcripción):
   - **Sitio:**
     - Piezas hechas: `mundo.suelo`, `mundo.losa` (aceras y tarimas), `mundo.casa` (con `rotulo`, `toldo` y colores), `mundo.arbol`, `mundo.farola`, `mundo.banco`, `mundo.caja`, `mundo.cartel` y `mundo.nubes`.
     - Lo que no exista (una máquina, un barco, una mesa), hazlo con formas simples de three.js (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`…). Usa `mundo.pintura(color)` y luego `mundo.marcar(objeto)` para que lleve tinta y sombra.
     - Para mover cosas: `mundo.animar(t => …)`.
     - Interiores: suelo de `madera` o `baldosa`, paredes con `mundo.caja` o `mundo.losa`, y la cámara dentro.
   - **Personajes:** `mundo.personaje({ ropa, sombrero, colorSombrero, bigote, nino })`.
     - `sombrero`: `gorra`, `sombrero`, `cocinero`, `pelo`, `casco` o `gorro`.
     - Después rellena sus pistas:
       - `camino = [[t, x, z, y], …]`: anda solo entre puntos distintos.
       - `mirar = [[t, grados], …]`
       - `caras = [[t, 'sorpresa'], …]`: `normal`, `contento`, `risa`, `sorpresa`, `enfado`, `triste`, `duda`, `miedo`, `orgullo`.
       - `poses = [[t, 'saludo'], …]`: `abajo`, `sorpresa`, `arriba`, `saludo`, `senalar`, `jarras`, `pensar`, `llevar`, `celebrar`, `encoger`.
       - `saltos = [t, …]`
     - Para que lleven algo en la mano: `pj.manoDerecha.add(objeto)`.
   - **Efectos de dibujo:** `mundo.efecto('impacto' | 'polvo' | 'exclamacion' | 'pregunta' | 'notas' | 'brillo' | 'sudor' | 'corazon', { pos, t, dur, tam })`.
   - **Cámara:** `mundo.camara([...])`, un objeto por plano con:
     - `t`, `pos`, `mira` y `fov` (36–44).
     - `empuje`: % por segundo que se acerca. De 4 a 8 normal, 15–20 en la palabra fuerte.
     - `giro`: grados de inclinación.
     - `corte`: `true` o `'fundido'`.
     - `dur`: segundos del deslizamiento.
     - `luz`: `'dia'`, `'atardecer'` o `'noche'`.
     - `sol: { az, el }`, si quieres mover el sol de ese plano.

     Además, `mundo.destellos.push(t)` pone el flash blanco y `mundo.golpes.push({ t, fuerza })` la sacudida.
   - **Cada cosa ocurre en el segundo en que la voz la nombra,** o hasta 0,1 s antes.
   - **Nada de `Math.random()` ni de la hora del reloj:** el vídeo tiene que salir igual cada vez que se genera. Si hace falta azar, `azar(semilla)` del motor.
5. **Comprobar.** `npx hyperframes check`. Arregla los errores antes de seguir. Estos avisos son normales en esta plantilla y se dejan:
   - `outside_safe_zone` y `line_unread` en los subtítulos `.sub`: van a la altura de los shorts del estilo y al ritmo de la voz.
   - `contrast_aa_failure` en las palabras clave: el check no cuenta su borde ciruela grueso.
   - `canvas_content_at_edge`, `timeline_track_too_dense` y `KHR_parallel_shader_compile`.

   Si avisa de que separes las escenas en varios archivos, no hace falta: un vídeo corto cabe entero en `index.html`.
6. **Mirar.** Saca una imagen de cada plano con `npx hyperframes snapshot --at 0,4.2,9.8,…` y ponla al lado de los fotogramas de referencia. Comprueba que:
   - se ven las líneas de tinta en el mundo;
   - los colores son vivos y nada sale grisáceo ni oscuro;
   - las caras se ven claras;
   - no hay nada desenfocado salvo un barrido (si un deslizamiento sale borroso, va demasiado rápido: alarga `dur` o corta);
   - ningún texto tapa una cara.

   Para verlo moviéndose mientras trabajas: `npx hyperframes preview`.

### 5. Render

```sh
npx hyperframes render --fps 60 -o video.mp4
```

Primero haz uno rápido para mirarlo (`--fps 30 --quality draft -o borrador.mp4`) y, cuando te guste, el bueno. Para repasar solo un trozo: `--start 20 --end 26`. Son 3.600 fotogramas en 3D: con tarjeta gráfica tarda minutos; sin ella, bastante más.

### 6. Repaso

`repasar.sh` está en la misma carpeta que esta skill: en `~/.claude/skills/skill-videos/` si la instalaste como se explica abajo, o en `.claude/skills/skill-videos/` si la pusiste dentro de un proyecto.

```sh
bash ~/.claude/skills/skill-videos/repasar.sh video.mp4
```

Te dice:
- si mide 1080×1920;
- si va a 60 imágenes por segundo;
- si tiene sonido;
- si dura entre 55 y 70 s.

Además, guarda la primera imagen y una tira con seis momentos del vídeo para que los mires. Después:

- [ ] La primera imagen se entiende sin sonido.
- [ ] La tira se parece a los fotogramas de `referencias/fotogramas/`: misma tinta, colores vivos, caras claras y nada desenfocado.
- [ ] Ningún subtítulo ni palabra clave tapa una cara, y nada queda tapado arriba.
- [ ] Lo has visto entero en el móvil y con sonido.

## Un vídeo al día, solo, a las 4:30 de la mañana (en GitHub Actions)

Los 6 pasos de arriba son los que haces tú con Claude Code. Los mismos 6 pasos corren solos todos
los días en **GitHub Actions** (repo público, gratis): a las 4:30 de Madrid enciende un ordenador,
hace **un short**, lo sube a YouTube **programado** y se apaga. Tu PC no tiene que estar encendido.

```
GitHub Actions, 4:30 Madrid → dia.sh → generar.sh → claude -p (los 6 pasos) → video.mp4 → subir.mjs
```

> **En el modo automático mandan `automatizacion/prompt.md` y el brief del canal**, no lo que dicen
> los pasos de arriba para la voz y el largo: la voz es **Gemini (Charon) con `voz.sh`** y el guion
> tiene **160-190 palabras**, porque esa voz va a 2,75-3,1 palabras por segundo.

| Archivo | Qué hace |
|---|---|
| `../.github/workflows/video-del-dia.yml` (fuera de la skill) | El reloj de las 4:30: instala todo, lanza `dia.sh` con las claves y guarda el historial con un commit |
| `automatizacion/dia.sh` | El día: hace **un** vídeo (`1-publicar/`) y lo sube **solo si salió bien** |
| `automatizacion/generar.sh` | Un vídeo: crea la carpeta con la plantilla, junta el encargo y llama a `claude -p` (Sonnet, con permisos cerrados). Al terminar comprueba que mide 1080×1920 y lo que dura |
| `automatizacion/voz.sh` | La voz con Gemini: hace `assets/voz.wav` y `assets/transcript.json` de una vez, así que **sustituye los puntos 2 y 3 del paso 2** |
| `automatizacion/portada.sh` | La portada para YouTube, sacada del propio vídeo y recortada a 16:9, con el gancho en blanco y la palabra clave en amarillo |
| `automatizacion/cuando.mjs` · `horario.json` | A qué hora sale el vídeo, con el desfase de Madrid del día de salida |
| `automatizacion/subir.mjs` · `autorizar.mjs` | La subida a YouTube, programada y con portada. `autorizar.mjs` se lanza una vez para dar permiso |
| `automatizacion/prompt.md` | El encargo: sigue esta skill sin preguntar nada, con la voz y el largo de arriba, y deja los archivos que pide |
| `automatizacion/canales/curiosidades-animadas.md` | El brief del canal: de qué va, el tono, cómo son los guiones y lo que no se quiere. Su `-historial.md` guarda los temas ya contados, y `-idea.md` (si existe) el tema fijado para el próximo vídeo |

Cómo se monta, los comandos y qué hacer si algo falla: **`automatizacion/README.md`**.

**El estilo sigue siendo el estilo.** Corriendo solo o contigo delante, `motor/estilo3d.js` no se
toca y los avisos normales de `check` se dejan.

## Lo que manda esta skill

Si la skill `hyperframes` dice otra cosa, aquí manda esta:

- **Guion y plan.** Se usan los de esta skill (pasos 1 y 3), no las tres historias ni el `SPEC.md` de `hyperframes`.
- **Personajes.** Sin estirar y encoger, sin temblor de línea y sin respiración en reposo: quietos están quietos. Solo parpadean, solos.
- **Formato.** 1080×1920 a 60 fps.
- **Subtítulos.** En la franja de 1318–1394 px, más abajo que la que propone `hyperframes`, y de 1 a 3 palabras por golpe de voz (desde el 27/11), en blanco con borde negro grueso.

## Instalarla

Copia esta carpeta entera, con `plantilla/`, `referencias/` y `automatizacion/`, en `~/.claude/skills/skill-videos/` y abre Claude Code. Para usarla, basta con pedir: «hazme un vídeo de…».

Para que además se haga solo cada mañana, mira «Un vídeo al día, solo» arriba y
`automatizacion/README.md`.
