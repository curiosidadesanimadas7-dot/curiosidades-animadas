# Dónde va esto y cómo seguir

> **Si eres Claude y acabas de llegar: lee este archivo entero antes de tocar nada.**
> Última actualización: 26 de noviembre de 2026 (mañana).
>
> **Resumen:** el canal Curiosidades Animadas va solo en **GitHub Actions**, en el repo público
> https://github.com/curiosidadesanimadas7-dot/curiosidades-animadas (gratis). El PC de Rubén no hace
> nada. **Modal está apagado** desde el 26/11 (Rubén no quiere pagarlo); `modal/` se queda de reserva. Para el segundo canal, lee
> `NUEVO-CANAL.md`.

---

## 1. Qué hace

Cada día a las **4:30 de Madrid** (a veces unos minutos tarde), GitHub Actions enciende un ordenador y:

1. Hace **un short** vertical de 55-70 s con la skill `videos-historia-ilustrada` (Claude monta el
   vídeo; Gemini pone la voz).
2. Lo **sube a YouTube en privado y programado** a la hora de `horario.json`, con título,
   descripción, hashtags y portada. **Solo si la generación terminó bien.**
3. Se apaga. Guarda el historial con un commit en el repo, y el vídeo y el registro 7 días como
   artefacto (pestaña Actions).

El vídeo no sale a las 4:30: sale solo a su hora (por ejemplo, el miércoles a las 17:30).

---

## 2. Decisiones ya tomadas (no las vuelvas a abrir)

| Decisión | Qué se eligió | Por qué |
|---|---|---|
| **Dónde corre** | **GitHub Actions**, repo público, `.github/workflows/video-del-dia.yml` | El PC no se despertaba. Modal entraba en lo gratis pero Rubén no quiere arriesgarse a pagar (26/11). Repo público = minutos gratis; el privado (2.000 min/mes) no llega |
| **La hora** | Dos crons UTC (2:30 y 3:30) y el primer paso deja pasar solo el que es 4:30 en Madrid | GitHub solo entiende UTC y hay cambio de hora |
| **Cuántos vídeos** | **Un short al día, y se sube** | Antes eran dos (uno a publicar y otro a revisar) |
| **Modelo de Claude** | `claude-sonnet-5-5` (en `generar.sh`) | Con Opus se acabó el límite del plan Pro a mitad de vídeo |
| **Cómo entra Claude** | Plan Pro de Rubén, con `CLAUDE_CODE_OAUTH_TOKEN` (sale de `claude setup-token`) | No gasta créditos de API. **El límite del Pro es uno para toda la cuenta** |
| **La voz** | Gemini `gemini-3.8-flash-tts`, voz **Charon** | Kokoro sonaba robótica y ElevenLabs costaba 22 $/mes |
| **Largo del guion** | **160-190 palabras** | Medido: Charon va a 2,75-3,1 palabras/s |
| **Temas** | **Actualidad** (noticias de los últimos 7 días que tocan a gente de 14-25 en España) **o curiosidades que de verdad flipen**. Nada de libro de texto (cambio del 26/11) | Rubén: «el de hoy es un tostón». Claude busca y comprueba con **WebSearch/WebFetch** (permitidos en `generar.sh`) |
| **Tema fijado a mano** | `canales/curiosidades-animadas-idea.md`: si existe, manda; `dia.sh` lo borra cuando el vídeo sale bien | Para que Rubén elija el tema de un día concreto |
| **Animaciones** | Si explica cómo funciona algo, **la cámara entra en el objeto** y se ve el mecanismo (receta en `prompt.md`, «El porqué se ENSEÑA») | Rubén: «que el plano se meta en la gota y lo explique visualmente» |
| **Estilo de los guiones** | Gancho en el primer segundo, como los 4 shorts de ejemplo | Ver el brief `canales/curiosidades-animadas.md` |
| **Gancho y final** | Primera frase ≤ 5 palabras y el fotograma 0 ya en movimiento. **Final en bucle**: la última frase enlaza con la primera y el último plano se parece al primero. La pregunta para comentar va en la descripción, no en la voz (26/11) | Consejos de retención de Rubén: si menos del 70 % se queda, falla el gancho; los bucles se ven más veces |
| **Comas** | Pocas en el guion; **ninguna en pantalla** | `subtitulos.mjs` las quita al escribir los subtítulos |
| **Subir a YouTube** | `privacyStatus: private` + `publishAt` | Es como funciona «Programar» |
| **App de Google** | **Publicada** | En modo prueba el permiso caduca a los 7 días |
| **El estilo del vídeo** | **No se toca** | Solo se cambian `escena.js` y las zonas marcadas de `index.html` |

---

## 3. El mapa de archivos

```
skill-videos-github/
├── ESTADO.md                 ← este archivo
├── NUEVO-CANAL.md            encargo para montar el segundo canal
├── .github/workflows/video-del-dia.yml   EL RELOJ: instala todo, lanza dia.sh, guarda historial
├── skills-extra/             las skills hyperframes y media-use (copiadas del PC)
├── modal/
│   └── curiosidades.py       la app de Modal, APAGADA (de reserva)
├── paginas/                  las dos páginas web de la app de Google (ya publicadas)
└── skill-videos/             la skill (en GitHub va enlazada en ~/.claude/skills/skill-videos)
    ├── SKILL.md              los 6 pasos. NO tocar el estilo
    ├── repasar.sh            mide el vídeo acabado
    ├── plantilla/            index.html, escena.js, subtitulos.mjs, motor/estilo3d.js
    ├── referencias/          fotogramas de otro creador: solo para mirar, NO se publican
    └── automatizacion/
        ├── dia.sh            el día: genera el vídeo y, si salió bien, lo sube
        ├── generar.sh        UN vídeo: carpeta + encargo + claude -p (con permisos limitados)
        ├── prompt.md         el encargo que recibe Claude
        ├── voz.sh            voz.wav + transcript.json (Gemini)
        ├── portada.sh        portada.jpg 1280×720 sacada del vídeo
        ├── cuando.mjs        a qué hora sale el vídeo (con cambios de hora)
        ├── horario.json      la tabla de días y horas
        ├── subir.mjs         sube a YouTube, programado
        ├── autorizar.mjs     saca el permiso de YouTube (una vez por canal)
        ├── windows/instalar-skill.ps1   solo para probar la skill en el PC, no hace falta
        └── canales/
            ├── curiosidades-animadas.md            el brief del canal
            ├── curiosidades-animadas-historial.md  la memoria del canal (la buena está en GitHub)
            └── curiosidades-animadas-programados.json  lo ya subido (la buena está en GitHub)
```

**Cómo encaja:**

```
GitHub Actions, 4:30 Madrid → video-del-dia.yml
 └── dia.sh
      ├── generar.sh "1-publicar" → claude -p (Sonnet) → los 6 pasos de la skill
      │     ├── voz.sh      → assets/voz.wav + assets/transcript.json
      │     ├── subtitulos.mjs, check, render → video.mp4
      │     ├── portada.sh  → portada.jpg
      │     └── resumen.json + una línea en el historial
      └── (solo si generar.sh salió bien) subir.mjs → cuando.mjs → YouTube, programado
```

---

## 4. Lo que hay en GitHub (y lo que queda en Modal)

- **Repo público** `curiosidadesanimadas7-dot/curiosidades-animadas`. En el PC se sube como esa
  cuenta (la URL del remoto lleva el usuario delante porque el PC tiene otra cuenta de GitHub guardada).
- **5 secretos** (Settings → Secrets and variables → Actions): `CLAUDE_CODE_OAUTH_TOKEN`,
  `GEMINI_API_KEY`, `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`. **Los pone Rubén**;
  nunca se pegan claves en el chat.
- **El ordenador:** `ubuntu-latest`, 4 núcleos y 16 GB. Tope de 350 min (GitHub corta a las 6 h).
  Se espera ~2,5-3 h por vídeo (en Modal con 8 núcleos eran ~87 min). **Sin medir todavía.**
- **Cada día:** el commit «Historial: vídeo del …» y un artefacto `video-…` con el vídeo, la portada,
  `claude.log` y `logs/dia-….txt` (se borra a los 7 días).
- **Ojo:** si el repo pasa 60 días sin commits, GitHub apaga el reloj. Con el commit diario no pasa.
- **Modal:** app `curiosidades-animadas` **parada** (`modal app stop`). El volumen `curiosidades-datos`
  y el secreto siguen ahí. Para volver: `python -m modal deploy modal/curiosidades.py` (y desactivar el
  workflow de GitHub para que no salgan dos vídeos).

### Comandos (desde la carpeta `skill-videos-github/`)

```powershell
git add -A; git commit -m "lo que sea"; git push    # después de CUALQUIER cambio en la skill
git pull                                             # traer el historial que apunta GitHub cada día
```

Lanzar un vídeo a mano: pestaña **Actions → Vídeo del día → Run workflow** (se sube de verdad).

> **Importante:** haz `git pull` antes de cambiar nada: GitHub hace un commit cada día.

---

## 5. Probado de verdad

- **25/11, prueba completa en Modal:** de 18:43 a 20:10 (~87 min). Salió «Tus dedos no se arrugan
  por el agua: lo hace tu cerebro», 60,6 s, 1080×1920 a 60 fps. `check` y `repasar.sh` sin errores,
  subtítulos sin comas y portada bien. Subido y programado: https://youtu.be/pBlZFNCCskY.
- **Coste en Modal:** ~0,75 $ por vídeo (~22 $/mes). En GitHub, repo público: 0 $.
- Lo de siempre: la hora de salida con los cambios de hora, el permiso de YouTube (solo
  `youtube.upload`) y que los hashtags se validen.

**Sin probar todavía:** todo lo de GitHub Actions. Se verá el 26/11.

---

## 6. Fallos ya encontrados y arreglados (no los repitas)

1. **El Claude que trabaja solo no podía lanzar comandos** («requires approval»). `generar.sh` le
   da una lista cerrada (`--allowedTools`: bash, npx hyperframes, node, ffmpeg…) y `--add-dir`.
2. **Se acabó el límite del Pro con Opus** y `dia.sh` subió un vídeo sin terminar (`k3g3Q1TutkY`).
   Ahora solo se sube si `generar.sh` termina bien, y se usa Sonnet.
3. **El token de Claude se cortaba al copiarlo** de la terminal (se partía en dos líneas). Tiene
   108 caracteres.
4. **whisper no compilaba en Modal:** faltaban `cmake` y `build-essential`. Ahora el calentamiento
   de whisper es obligatorio al construir la imagen: si falla, se para.
5. **Los subtítulos salían vacíos sin dar error.** `voz.sh` localiza el CLI y, si no hay palabras,
   transcribe aparte.
6. **La portada salía achatada:** el recorte se calcula sobre el ancho (`iw*9/16`).
7. **`set -e` matando scripts en silencio.** Usar `|| true` o `if`.
8. **El token de YouTube guardado con el prefijo pegado** (`YT_REFRESH_TOKEN=1//...`) daba
   `invalid_grant`. Tiene que empezar por `1//`.
9. **El día terminaba con código 0 aunque fallara.** Ahora propaga el error, y Modal lo marca como
   fallido.
10. **Claude no podía escribir el historial en Modal**, porque `canales/` es un enlace al volumen
    y `--add-dir` solo daba la ruta del enlace. Arreglado con `CANALES_REAL` (`pwd -P`). La línea
    del 25/11 se añadió a mano.

---

## 7. Lo que no se toca

- **`motor/estilo3d.js` y la plantilla.** Solo `escena.js` y las zonas marcadas de `index.html`.
- **Los avisos normales de `npx hyperframes check`:** `outside_safe_zone` y `line_unread` en `.sub`,
  `contrast_aa_failure` en `.clave`, `canvas_content_at_edge`, `timeline_track_too_dense` y
  `KHR_parallel_shader_compile`. No son errores.
- **Los fotogramas de `referencias/`.** Son de otro creador: solo para mirar el estilo.
- **Rubén prefiere que le pregunten** antes de improvisar un arreglo, sobre todo si implica
  instalar algo grande o gastar dinero.

---

## 8. Datos del canal

- **Canal:** Curiosidades Animadas. Curiosidades de todo tipo para gente de 14 a 25 años.
- **GitHub:** `curiosidadesanimadas7-dot` (solo para las dos páginas de la app de Google).
- **App de Google:** «Subida Curiosidades», publicada, con las páginas en
  `https://curiosidadesanimadas7-dot.github.io/`.
- **Horario** (`horario.json`, hora de Madrid). Se usa la mejor; la segunda solo si la mejor ya
  pasó:

  | | Mejor | Segunda |
  |---|---|---|
  | Lunes | 18:00 | 21:00 |
  | Martes | 18:00 | 21:30 |
  | Miércoles | 17:30 | 21:00 |
  | Jueves | 18:00 | 21:30 |
  | Viernes | 16:00 | 19:30 |
  | Sábado | 17:00 | 11:30 |
  | Domingo | 18:30 | 12:00 |

---

## 9. Lo que queda

0. **27/11:** el vídeo de los vapers de sabores (tema fijado por Rubén, con datos comprobados el 26/11
   en `canales/curiosidades-animadas-idea.md`). Primer vídeo con temas nuevos, WebSearch y «viaje
   dentro»: mirar que el guion engancha y que la animación explica.
1. **26/11 por la mañana:** primer día en GitHub, **sin prueba previa** (decisión de Rubén). Mirar en
   Actions si salió, cuánto tardó, si subió el vídeo y si el commit del historial está. Si falla,
   el registro está en el artefacto.
2. Rubén: revisar o quitar en YouTube Studio el vídeo subido sin revisar, `k3g3Q1TutkY`.
3. **Segundo canal** (vídeos largos de 10-15 min con imágenes fijas): todo en `NUEVO-CANAL.md`. Se
   hace en otra conversación y no toca nada de este canal.
