# El vídeo de las 4:30 de la mañana, solo (en GitHub Actions)

Cada día a las **4:30 de Madrid** (a veces hasta una hora tarde: GitHub retrasa los relojes cuando va
cargado), GitHub Actions enciende un ordenador, hace **un short**, lo sube a YouTube **programado** y
se apaga. El PC no tiene que estar encendido. Repo público (minutos gratis):
https://github.com/curiosidadesanimadas7-dot/curiosidades-animadas

```
GitHub Actions, 4:30 Madrid → .github/workflows/video-del-dia.yml
 └── dia.sh <canal>
      ├── generar.sh "1-publicar" → carpeta + encargo (prompt.md + brief + idea fijada) → claude -p (Sonnet)
      │     └── los 6 pasos de la skill: guion → voz.sh → plan → escena → render → portada.sh
      └── si salió bien: subir.mjs → cuando.mjs (la hora) → YouTube, privado y programado
```

> Antes se usó Modal (`modal/curiosidades.py`). **Está parado** desde el 26/11 y no hay que
> volver a encenderlo: saldrían dos vídeos.

## Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| El reloj y los pasos | `.github/workflows/video-del-dia.yml` (dos crons UTC; el primer paso deja pasar solo el de las 4:30 de Madrid) |
| Las claves | Secretos del repo (Settings → Secrets and variables → Actions): `CLAUDE_CODE_OAUTH_TOKEN`, `GEMINI_API_KEY`, `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`. Nadie puede leerlas, ni el dueño |
| El historial de temas y las horas ya cogidas | `canales/` en el repo: GitHub hace un commit cada día |
| **El tema del próximo vídeo, fijado a mano** | `canales/<canal>-idea.md`. Si existe, manda sobre el brief; se borra solo cuando el vídeo sale bien |
| Los vídeos y el registro del día | Pestaña **Actions** → la ejecución del día → artefacto `video-…` (7 días). Las claves salen tachadas |

Claude entra con el **plan Pro** (`CLAUDE_CODE_OAUTH_TOKEN`, sale de `claude setup-token`), no con
clave de API. El límite del Pro es uno para toda la cuenta: si se acaba a mitad de vídeo, ese día
no se sube nada. **Claude no recibe nunca las claves de YouTube** (`dia.sh` se las quita).

## Cómo se usa (desde `skill-videos-github/`)

```sh
git pull                                   # siempre antes de cambiar nada (GitHub hace commits)
git add -A; git commit -m "..."; git push  # tras CUALQUIER cambio: el siguiente vídeo ya lo usa
```

- **Un vídeo ahora, a mano:** Actions → «Vídeo del día» → **Run workflow** (con una idea opcional).
  Se sube de verdad.
- **Fijar el tema de mañana:** escribe `canales/curiosidades-animadas-idea.md` y haz push.
- Para hacer un vídeo sin subirlo (en un PC): `SIN_SUBIR=1 bash dia.sh <canal>`.

## Claude trabaja con permisos cerrados

Nadie está mirando, así que `generar.sh` le da a `claude -p` solo lo que necesita
(`--allowedTools`: bash, npx hyperframes, npm run, node, ffmpeg, ffprobe y las variables de
`portada.sh`) y las carpetas donde puede escribir (`--add-dir`: la skill, `canales/` y su ruta
real en el volumen). Lo demás (curl, borrar fuera…) sigue bloqueado.

## La voz

La pone `automatizacion/voz.sh`, y hace `assets/voz.wav` y `assets/transcript.json` de una vez.

- **Gemini** (`gemini-3.8-flash-tts`) cuando hay `GEMINI_API_KEY`. El modelo está en el **plan
  gratis** de Google: su página de precios pone «Free of charge» en entrada y salida, y para pasar al
  plan de pago hay que activar la facturación tú a mano. Con un vídeo al día no te acercas al límite.
- **Kokoro**, la voz local, cuando no hay clave. Es gratis y va sin internet, pero suena robótica.

La voz de este canal es **`Charon`**, que Google describe como «Informative»: es el registro de
documental. La interpretación se le pasa aparte, en el campo `style`, porque el modelo lee el texto
del guion **literal** y cualquier acotación se leería en voz alta.

Para cambiarla, sin tocar el script:

```sh
VOZ=Rasalgethi bash automatizacion/voz.sh
ESTILO="Narrador de documental, más serio y pausado" bash automatizacion/voz.sh
```

De las 30 voces del catálogo, las que encajan con un canal de curiosidades: `Charon` y `Rasalgethi`
(«Informative»), `Sadaltager` («Knowledgeable»), `Gacrux` («Mature») y `Zubenelgenubi` («Casual»),
esta última si lo quieres más de tú y menos de documental. Google **no dice el género** de ninguna,
así que para elegir hay que oírlas.

Un detalle que sale a cuenta: el motor de audio **transcribe al generar la voz**, así que se ahorra
una pasada de whisper entera. No ejecutes `hyperframes transcribe` después.

## La portada

La saca `automatizacion/portada.sh` del propio vídeo, con la tipografía de la plantilla: el gancho
en blanco con el borde ciruela grueso y la palabra clave en amarillo, igual que las palabras clave
del vídeo. Deja `portada.jpg` de 1280×720, que es lo que YouTube pide.

```sh
GANCHO="Qué pasa si no duermes" CLAVE="3 DÍAS" SEGUNDO=12.4 bash automatizacion/portada.sh
```

El fotograma y el texto los elige Claude al montar el vídeo, porque hay que saber cuál es el momento
más expresivo. Lo que no sabe es si la cara queda bien encuadrada, así que **mira la portada** y, si
corta mal, se repite con otro `SEGUNDO` o cambiando `RECORTE_Y` (la altura del recorte 16:9 dentro
del vertical). No hay que volver a renderizar: cuesta un segundo.

**Para que YouTube te acepte una portada propia, el canal tiene que estar verificado**
(youtube.com/verify, con el móvil). Sin eso, el vídeo se sube bien pero la portada da error de
permisos.


## La subida a YouTube

Se sube el de `1-publicar/`, **solo si su generación terminó bien**, y se deja **programado**.

### A qué hora sale

En `horario.json`, en horas de Madrid:

| | Mejor | Segunda |
|---|---|---|
| Lunes | 18:00 | 21:00 |
| Martes | 18:00 | 21:30 |
| Miércoles | 17:30 | 21:00 |
| Jueves | 18:00 | 21:30 |
| Viernes | 16:00 | 19:30 |
| Sábado | 17:00 | 11:30 |
| Domingo | 18:30 | 12:00 |

`cuando.mjs` coge **la mejor del día**. La segunda solo entra si la mejor ya ha pasado, cosa que con
el reloj de las 4:30 no llega a ocurrir: es la red de seguridad para cuando lo lances a mano por la
tarde. Si las dos han pasado, se va al día siguiente. Fíjate en que **el sábado y el domingo la
segunda es por la mañana**, antes que la mejor: el cálculo no da por hecho que la segunda sea más
tarde, mira cuál sigue en el futuro.

Dos cosas que hace bien y que es donde suele fallar esto:

- **El cambio de hora.** El desfase se calcula para **el día en que sale el vídeo**, no para hoy. Un
  vídeo programado el 27 de marzo para el 28 lleva `+02:00`, no `+01:00`. Si se escribiera el de hoy,
  saldría publicado una hora antes.
- **No pisa huecos.** Cada subida apunta su hora en `canales/<canal>-programados.json`, y la
  siguiente salta los que ya están cogidos.

Para ver qué hora saldría ahora mismo, sin subir nada:

```sh
node automatizacion/cuando.mjs --json
```

### Cómo se programa (y por qué «privado» no es lo contrario de «programado»)

YouTube no tiene un estado «programado». Un vídeo programado se sube con `privacyStatus: private` y
un `publishAt`: se queda privado **hasta esa hora exacta** y entonces se hace público solo. Es
literalmente lo que hace el botón «Programar» de YouTube Studio.

### Darle permiso, una sola vez

1. En [console.cloud.google.com](https://console.cloud.google.com) (gratis): crea un proyecto,
   activa **YouTube Data API v3**, y en la pantalla de consentimiento OAuth añade **tu propio correo
   en «Usuarios de prueba»**.
2. Credenciales → ID de cliente de OAuth → **Aplicación de escritorio**. Copia el ID y el secreto.
3. En tu ordenador:

   ```sh
   export YT_CLIENT_ID=...apps.googleusercontent.com
   export YT_CLIENT_SECRET=...
   node automatizacion/autorizar.mjs
   ```

   Se abre el navegador, das permiso, y te imprime un `YT_REFRESH_TOKEN` que no caduca.

El permiso que se pide es el mínimo que existe para esto (`youtube.upload`): subir vídeos y ponerles
portada. **No puede leer tus datos, ni borrar nada, ni tocar vídeos ya publicados.**

> ### ⚠ El permiso caduca a los 7 días mientras la app esté en «Prueba» (la nuestra YA está publicada)
>
> Google caduca los permisos de las apps en modo prueba **cada 7 días**. Para algo que sube un vídeo
> al día, eso significa que a la semana deja de funcionar.
>
> El montaje no te deja a ciegas: `subir.mjs` **avisa a partir del quinto día** y, si llega a
> caducar, te lo dice con todas las letras en vez de soltarte un error de autenticación a secas. El
> vídeo no se pierde: se queda hecho en su carpeta y se puede subir luego.
>
> **La solución definitiva es publicar la app** en la consola de Google. Entonces el permiso deja de
> caducar. Te pedirá cuatro cosas: nombre, correo de asistencia, **una URL de página principal y una
> de política de privacidad**. Con una página sencilla en GitHub Pages (que es gratis y ya tienes
> repositorio) basta para las dos.
>
> Mientras tanto, cuando caduque: `node automatizacion/autorizar.mjs` y guardar el token nuevo.

### Probarlo sin subir nada

```sh
node automatizacion/subir.mjs --dir salida/curiosidades-animadas/2026-11-24/1-publicar --prueba
```

Te enseña el título, los hashtags, la hora de salida y el JSON exacto que enviaría. No sube nada.

Y para hacer los vídeos sin subir ninguno: `SIN_SUBIR=1 bash automatizacion/dia.sh <canal>`.

### Los hashtags se comprueban solos

`subir.mjs` **se planta y no sube** si los hashtags de `resumen.json` no cumplen tu regla: de 3 a 5,
en minúsculas, sin tildes ni eñes, con `#shorts` siempre y ninguno de relleno (`#viral`, `#fyp`,
`#parati`). Más vale que falle la subida que publicar con los hashtags mal puestos.


## Lo que cuesta

- **GitHub Actions:** gratis (repo público). Unas 3 h por vídeo con 4 núcleos; el tope son 6 h.
- **Claude:** el plan Pro de Rubén (sin coste extra, pero con límite).
- **Gemini (voz):** gratis con un vídeo al día.
- **YouTube:** gratis. Cada subida gasta 1.600 de las 10.000 unidades diarias de la API.

## Otro canal

Un canal con el **mismo formato** (shorts) es copiar el brief (`canales/<canal>.md`) y su historial y
llamar a `dia.sh <canal>`. Un canal con **otro formato** (vídeos largos con imágenes fijas) está
pensado aparte: mira `NUEVO-CANAL.md` en la raíz del proyecto.

## Si algo falla

| Lo que ves | Qué es |
|---|---|
| `requires approval` en `claude.log` | Claude intentó un comando fuera de la lista de `generar.sh` |
| `usage limit` / se para a medias | Se acabó el límite del Pro. Ese día no se sube nada (a propósito) |
| `OJO: hay video.mp4 pero su generación FALLÓ` | Igual: hay vídeo, pero no se sube sin terminar bien |
| `401 OAuth access token is invalid` | El token de Claude está mal copiado (tiene 108 caracteres) |
| `invalid_grant` al subir | El token de YouTube está mal (tiene que empezar por `1//`) |
| Los subtítulos salen vacíos | El motor de audio no encontró el CLI de HyperFrames. `voz.sh` lo busca solo y, si falla, transcribe aparte |
| `transcribe` traduce al inglés | Falta `--model small --language es` |
| No apunta el tema en el historial | Falta la ruta real en `--add-dir` (`CANALES_REAL` en `generar.sh`) |
| El vídeo empieza tarde | Normal en GitHub: retrasa los relojes hasta ~1 h |
| Rojo con `timeout` | Pasó de 350 min: el render fue demasiado largo |

Lo que pasó cada día está en el artefacto de Actions (`logs/` y `salida/…/claude.log`).
