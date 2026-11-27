# Encargo: el vídeo de hoy para `{{CANAL}}` ({{DIA}} {{FECHA}})

**Hoy es {{DIA}}.** Lo primero: busca con WebSearch si en las últimas 48 h ha pasado algo TOCHO (mira
el brief). Si lo hay, ese es el vídeo. Si no, el tema sale de la semana temática del brief. Un tema
fijado por Rubén manda sobre los dos.

Haz un vídeo entero, de principio a fin, con la skill **`videos-historia-ilustrada`** (está en
`~/.claude/skills/skill-videos/SKILL.md`). Léela antes de empezar y sigue sus 6 pasos **en orden**.
Para escribir el vídeo con HyperFrames, usa además la skill **`hyperframes`**. Donde las dos digan
cosas distintas, manda `videos-historia-ilustrada` (su apartado «Lo que manda esta skill»).

## Dónde estás

Ya estás **dentro de la carpeta del proyecto**. Está hecha con
`hyperframes init --resolution portrait` y la plantilla de la skill ya está copiada encima:
tienes `index.html`, `escena.js`, `subtitulos.mjs` y `motor/`. **No vuelvas a crear el proyecto.**
Todos los comandos se lanzan desde aquí.

## La voz: esto cambia el paso 2 de la skill

La skill dice de generar la voz con `npx hyperframes tts --voice ef_dora`. **Aquí no.** La voz la
pone un script, que además deja hecha la transcripción:

```sh
bash ~/.claude/skills/skill-videos/automatizacion/voz.sh
```

Lo lanzas desde dentro de la carpeta del vídeo, con `guion.txt` ya escrito. Te deja los dos
archivos de una vez: `assets/voz.wav` y `assets/transcript.json`. **No ejecutes `hyperframes
transcribe` después:** el motor de audio ya transcribe al generar, y volver a hacerlo es una pasada
de whisper tirada a la basura.

### El guion es MÁS CORTO que el que dice la skill

La skill pide **190-230 palabras** porque está calculada para la voz local `ef_dora`, que va a 3,4
palabras por segundo. **Esta voz no.** Medido en vídeos reales (24/11), Gemini con la dirección de
documental va **entre 2,75 y 3,1 palabras por segundo**: las pausas entre frases, que son las que
hacen que suene a documental y no a robot, se comen segundos.

Así que para este canal el guion es de **160 a 190 palabras**. Con 150 se queda en 50 s y con 210
pasa de 70; las dos cosas obligan a rehacer la voz, que a las 4:30 de la mañana es tiempo tirado.

Si aun así el script avisa de que la voz no dura entre 54 y 69 segundos, ajusta el guion y vuelve a
lanzarlo, igual que dice el paso 2 de la skill.

Dos cosas del guion, por cómo funciona esta voz:

- **`guion.txt` es solo lo que se dice, literal.** El modelo lee ese texto tal cual, así que no metas
  acotaciones, ni etiquetas tipo `<pausa>`, ni paréntesis con instrucciones: se leerían en voz alta o
  romperían el cuadre de los subtítulos. La interpretación va aparte, en el script.
- **Pocas comas.** Cada coma es una pausa en la voz: pon solo las que haría alguien contándolo en
  voz alta. Si una frase pide tres comas, pártela en dos frases.
- **Lee `assets/transcript.json` cuando esté.** Si una palabra sale cambiada, es que la voz la dice
  mal: escríbela en el guion como suena y vuelve a lanzar `voz.sh`.

## Nadie está mirando

Esto lo ha disparado un reloj a las 4:30 de la mañana, así que **no preguntes nada y no te pares a
esperar respuesta**. Para buscar noticias y comprobar datos tienes **WebSearch** y **WebFetch** (mira el brief). Cuando dudes entre dos opciones razonables, elige la que mejor cumpla la skill
y sigue. Si algo se rompe de verdad, arréglalo e inténtalo otra vez; si después de tres intentos
sigue roto, para y di claramente en el último mensaje qué ha fallado.

## Reglas que no se negocian

- **El estilo no se toca.** `motor/estilo3d.js` se queda como está. Solo cambias `escena.js` y las
  zonas marcadas de `index.html`.
- **Nada de `Math.random()` ni de la hora del reloj** en el código del vídeo.
- **1080×1920 a 60 fps**, y la voz entre 54 y 69 segundos.
- **Ninguna coma en pantalla.** Los subtítulos se escriben SIEMPRE con `node subtitulos.mjs`, nunca
  a mano: ya quita las comas solo. Y las palabras clave (`.clave`) tampoco llevan comas.
- Los avisos de `npx hyperframes check` que la skill llama normales (`outside_safe_zone` y
  `line_unread` en `.sub`, `contrast_aa_failure` en `.clave`, `canvas_content_at_edge`,
  `timeline_track_too_dense`, `KHR_parallel_shader_compile`) **se dejan tal cual**: no son errores.
- **Mira los fotogramas** de `~/.claude/skills/skill-videos/referencias/fotogramas/` antes de montar,
  para tener el estilo en la cabeza. No copies sus personajes, sus historias ni sus planos, y no los
  uses en el vídeo.
- **El tema sale del brief del canal** que viene más abajo, y **no puede repetir** ninguno de los
  temas del historial.

## El montaje que retiene (cambio del 27/11)

Lo detalla la skill en los pasos 3 y 4; lo importante, resumido:
- **18-24 planos en un minuto, ninguno quieto.** Acercarse, barrido, meterse dentro o plano aéreo.
- **Cuando la voz nombra un objeto, una cifra o un sitio → plano de ese objeto SIN personajes.**
- **Exageraciones visuales** que refuerzan lo que se dice (el suelo que se agrieta, el gigante tejiendo).
- **Todo de colores vivos y lo importante en un color chillón**; rayos de luz si hay ventanas.
- **Efectos de sonido** con `sfx.json` + `node sfx.mjs`: whoosh en los cortes, golpe en los impactos,
  pop en lo que aparece, tictac en las esperas. Por debajo de la voz.
- En `plan.md`, la columna **Tipo** (CON PERSONAJES / SOLO OBJETO) y la columna **Sonido**.

## El principio y el final (lo que más cuenta en YouTube)

- **Fotograma 0:** ya se mueve y ya engancha. La primera frase, 5 palabras como mucho. Antes de
  renderizar, mira el snapshot de los segundos 0 y 0,5: si no te pararías a mirarlo, cámbialo.
- **El final está en bucle:** la última frase enlaza con la primera, el último plano se parece al
  primero, y el vídeo acaba como mucho 0,3 s después de la voz. Sin fundido a negro. Mira el
  snapshot del último segundo junto al del segundo 0: tienen que parecerse.
- La pregunta para comentar **no la dice la voz**: va en la descripción de `resumen.json`.

## El porqué se ENSEÑA, no se cuenta (cambio del 26/11)

Rubén: «si hablas de una gota de agua y explicas de qué está hecha, que el plano se meta en la gota y
lo explique visualmente». Cuando el vídeo explica **cómo funciona algo por dentro**, la cámara
**entra** en el objeto y se ve el mecanismo. Nada de un personaje quieto mientras la voz lo cuenta.

**Al menos un «viaje dentro» por vídeo** (si el tema lo permite), hecho así en `escena.js`:

1. **Fuera:** el objeto grande en el mundo normal (la gota, el vaper, el móvil, la piel…), con la
   cámara acercándose despacio (`empuje` 6-8).
2. **La zambullida (0,6-1 s):** un plano con `empuje` 18-25 que va directo al objeto hasta que
   llena la pantalla. Ajusta `pos` muy cerca de su superficie al final.
3. **El corte a lo pequeño:** en el instante en que el objeto llena la pantalla, `corte: 'fundido'`
   (o `mundo.destellos.push(t)`) a un **segundo decorado montado lejos** (por ejemplo en x = 400),
   del mismo color que el objeto: es «el interior». Así parece un único zoom continuo.
4. **Dentro:** el mecanismo con formas simples, grandes y de colores planos, con tinta
   (`mundo.pintura` + `mundo.marcar`): moléculas como bolas unidas por palos, iones con «+» y «−»,
   gotitas de vapor con puntitos dentro, engranajes, flechas que se mueven. **Lo que dice la voz se
   ve moviéndose en ese momento** (`mundo.animar`): si la voz dice «los iones llevan la corriente»,
   los iones viajan de un lado a otro justo ahí.
5. **Salir (opcional):** el camino inverso (alejarse rápido + fundido) para volver al personaje y su
   reacción.

Más trucos que explican sin palabras: cortar un objeto por la mitad para ver su interior, ponerlo
transparente o en rayos X (`mundo.pintura` con un color claro y piezas internas de color fuerte),
tamaños comparados (el personaje al lado de algo gigante), y flechas que siguen el recorrido.
**Antes de renderizar, mira los snapshots del viaje dentro:** que se entienda sin sonido.

## Cómo ir más rápido (aquí no hay tarjeta gráfica)

El render va con el procesador, así que cada fotograma cuesta. Para no gastar el doble:

- **No hagas el borrador a 30 fps.** Para comprobar cómo va, usa `npx hyperframes snapshot`
  (una imagen por plano) y, si hace falta, un render corto de un trozo (`--start … --end …`).
- Renderiza **una sola vez** el bueno: `npx hyperframes render --fps 60 -o video.mp4`.
- Antes de ese render, ten pasado `npx hyperframes check` sin errores: volver a renderizar entero
  por una tontería son horas perdidas.

## Qué tiene que quedar en la carpeta cuando acabes

| Archivo | Qué es |
|---|---|
| `guion.md` | El guion con sus notas y de dónde sale cada dato (160–190 palabras de voz) |
| `guion.txt` | Solo el texto que dice la voz, sin títulos ni tablas |
| `assets/voz.wav` | La voz (la pone `voz.sh`, mira abajo) |
| `assets/transcript.json` | El segundo de cada palabra (lo pone `voz.sh` también) |
| `plan.md` | La tabla del paso 3, con los segundos de la transcripción |
| `escena.js` e `index.html` | El vídeo montado |
| `sfx.json` | Los efectos de sonido (los mete `node sfx.mjs`) |
| `video.mp4` | **El vídeo, 1080×1920 a 60 fps, entre 55 y 70 s** |
| `portada.jpg` | La portada, 1080×1920 en vertical (mira abajo) |
| `resumen.json` | Lo que necesita YouTube (mira abajo). **Es un JSON, no un texto suelto:** lo lee un script |

Y una cosa más, la última: **añade una línea al final de `{{HISTORIAL}}`**, con este formato exacto,
para que el vídeo de mañana no repita el tema:

```
- {{FECHA}} — <el tema en pocas palabras> — <el título de resumen.json>
```

## La portada (la miniatura de YouTube, en vertical)

Después del render, saca la portada del propio vídeo:

```sh
GANCHO="¿Móvil en arroz?" CLAVE="NO FUNCIONA" SEGUNDO=12.4   bash ~/.claude/skills/skill-videos/automatizacion/portada.sh
```

Sale `portada.jpg` de **1080×1920** (vertical: así la enseña YouTube en los Shorts), con el
fotograma entero y el texto **grande arriba, por encima de la cabeza**: el gancho en blanco y la
clave en amarillo. Es lo que ve la gente en la pestaña Shorts del canal, en los estantes y en la
búsqueda, así que es lo que hace que alguien pulse.

- **`SEGUNDO`**: el fotograma más expresivo del vídeo: **una cara grande con una emoción clara**
  (sorpresa, miedo, risa) o el momento del golpe. **Ni el primer segundo, ni un plano sin
  personaje**, y mejor sin subtítulo en pantalla (busca un hueco entre frases). Si dudas, saca
  varios con `npx hyperframes snapshot` y elige el que más tire.
- **`GANCHO`**: 2-4 palabras en blanco que dan curiosidad («¿Móvil en arroz?», «Tus dedos»).
- **`CLAVE`**: 1-2 palabras en amarillo, en mayúsculas, que son el remate («NO FUNCIONA»).

**Mira la portada cuando esté** (es un `.jpg`, ábrelo): que el texto se lea en pequeño, que no tape
la cara y que haya una cara. Si algo falla, cambia `SEGUNDO` o el texto y repítela: cuesta un
segundo.

## `resumen.json`

De aquí salen el título, la descripción y los hashtags con los que se sube el vídeo. Lo lee un
script, así que la forma es exacta:

```json
{
  "titulo": "Tu tripa ruge aunque no tengas hambre: está limpiando",
  "descripcion": "Cada hora y media, con el estómago vacío, una ola de músculo barre lo que queda.\n¿A ti te suena en clase o en el cine?",
  "etiquetas": ["curiosidades", "cuerpo humano", "estómago"],
  "hashtags": ["#shorts", "#curiosidades", "#cuerpohumano", "#digestion"],
  "portada": { "gancho": "Tu tripa ruge", "clave": "LIMPIANDO", "segundo": 12.4 }
}
```

- **`titulo`**: menos de 100 caracteres, y mejor menos de 70 para que no se corte en el móvil.
- **`descripcion`**: dos o tres líneas, **sin los hashtags** (los pega el script al final solita).
  Acaba con la pregunta que pide el brief, la que da ganas de comentar (la voz ya no la dice: el
  vídeo acaba en bucle).
- **`hashtags`**: las reglas del brief, y el script las comprueba y **se planta si no cuadran**: de 3
  a 5, en minúsculas, sin tildes ni eñes, con `#shorts` siempre, y ninguno de relleno.
- **`portada`**: lo mismo que le pasas a `portada.sh`, apuntado para poder repetirla.

Cuando termines, di en un párrafo corto: el tema, cuánto dura el vídeo, qué pone la portada y si
`check` y el repaso han salido limpios.
