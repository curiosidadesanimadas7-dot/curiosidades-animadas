# Encargo: montar el SEGUNDO canal (vídeos largos con imágenes fijas)

> **Si eres Claude y te acaban de pasar esta carpeta:** lee primero `ESTADO.md` (cómo funciona el
> primer canal, Curiosidades Animadas, que ya va solo en Modal) y después esto. Aquí está lo que
> Rubén quiere para el canal nuevo, lo que ya se sabe y en qué orden hacerlo.
> Escrito el 25/11/2026.

---

## 1. Lo que NO se toca

El primer canal **ya funciona** y no se puede romper:

- La app de Modal **`curiosidades-animadas`**, su volumen `curiosidades-datos`, su secreto
  `curiosidades` y su reloj de las 4:30.
- `skill-videos/` (la skill de los shorts) y `modal/curiosidades.py`. Si necesitas algo de ahí
  (`voz.sh`, `subir.mjs`, `cuando.mjs`, `horario.json`, `portada.sh`), **cópialo** a la carpeta del
  canal nuevo y cambia la copia.
- Todo lo del canal nuevo va con nombres propios: otra app de Modal, otro volumen, otro secreto.

## 2. Qué quiere Rubén

- **Un vídeo al día**, horizontal (1920×1080), de **10 a 15 minutos**.
- **Estilo:** como el de referencia, https://www.youtube.com/watch?v=zzN7jcxZF4k («Cómo se siente
  ser…»): ilustraciones 2D tipo cómic y un narrador que habla de tú y cuenta una historia.
  **Pero SIN partes animadas:** solo **imágenes fijas con un zoom lento** (efecto Ken Burns) para
  que no parezca que está quieto. Muchas imágenes, ninguna animada.
- Medido en el vídeo de referencia: **cambia de imagen cada 2-7 s, unos 5 s de media.**
- Igual que el otro canal: se hace solo, se sube a YouTube **programado**, con título,
  descripción, hashtags y portada, y se apaga.
- **Lo quiere gratis o casi.** Mira el apartado 4.
- **Pendiente de decidir con Rubén:** nombre del canal, de qué van los temas, la voz, las horas a
  las que sale y en qué cuenta de Modal va.

## 3. Cómo montarlo (para que gaste poco)

En los shorts, Claude monta cada escena a mano con HyperFrames y three.js. Eso es lo que más
tokens gasta (≈85-90 % del total). **Para 15 minutos eso no cabe en el plan Pro.** Así que aquí
Claude **solo escribe**, y todo lo demás lo hacen programas:

| Paso | Quién | Cómo |
|---|---|---|
| 1. Tema, guion y lista de escenas | Claude (`claude -p`, Sonnet) | `guion.txt` + `escenas.json`: para cada escena, su trozo de texto y la descripción de la imagen |
| 2. Voz | Gemini TTS, como en los shorts | Un texto de 15 min hay que **partirlo por párrafos** y unir los audios |
| 3. Tiempos | whisper (`hyperframes transcribe`) | Para saber en qué segundo empieza cada escena |
| 4. Imágenes | **FLUX.1-schnell en una GPU de Modal** | Modelo abierto que permite uso comercial; unos 5 s por imagen en una L4 |
| 5. Zoom lento y montaje | **ffmpeg** (no HyperFrames) | `zoompan` sobre cada imagen + concatenar + voz + subtítulos |
| 6. Portada | Una de las imágenes + texto | Igual que `portada.sh`, pero a 1280×720 |
| 7. Subir | Copia de `subir.mjs` | **Sin `#shorts`.** Otro canal = otro token de YouTube (`autorizar.mjs`) |

**Largo del guion:** la voz de Gemini va a 2,75-3,1 palabras/s → 10 min ≈ 1.650-1.850 palabras,
15 min ≈ 2.500-2.800. Apunta a **~2.100 palabras (≈12 min)**.

**Que el personaje salga igual en todas las imágenes:** con IA no queda perfecto. Ayuda poner
siempre el mismo texto de estilo y la misma descripción del personaje en cada imagen, y una
semilla fija.

## 4. El dinero: lo que se sabe y lo que no

- **Modal da 30 $/mes gratis por cuenta.** Si va en la misma cuenta que los shorts, estos ya gastan
  **~22 $/mes** (medido: ~87 min con 8 núcleos ≈ 0,75 $ por short). Quedarían **~8 $/mes ≈ 0,27 $/día**.
- Cálculo aproximado del vídeo largo: montaje con ffmpeg **~0,05-0,07 $**; el resto (~0,20 $)
  da para **~13 min de GPU L4 ≈ 100-150 imágenes** (una cada 6-9 s). **Sin medir.**
- **Gemini para las imágenes NO**: no entra en la parte gratis (o casi nada) y saldría a
  60-200 $/mes. Tampoco webs de imágenes gratis sin clave: fallan y cambian las normas.
- **Primero una prueba de 20 imágenes** en Modal para ver calidad y coste real. **Antes de gastar
  más de lo gratis, pregunta a Rubén.**
- **Claude:** el plan Pro es un solo límite para toda la cuenta. Con este montaje, el vídeo largo
  gasta más o menos como un short. Ponle el reloj **a otra hora que las 4:30** (por ejemplo, 9:00)
  para que no coincida con el short.

## 5. Contenido

- Mismas reglas que el brief de Curiosidades (apartado «Lo que no quiero» de
  `skill-videos/automatizacion/canales/curiosidades-animadas.md`).
- Si los temas son oscuros (crimen, cárteles…), contarlos sin nada gráfico ni que lo haga parecer
  bueno. Avisar a Rubén de que YouTube suele limitar los anuncios en esos temas.
- No copiar personajes, dibujos ni guiones del vídeo de referencia: solo el formato.

## 6. En qué orden

1. Preguntar a Rubén lo pendiente del apartado 2.
2. Prueba de 20 imágenes con FLUX en Modal → enseñárselas y decirle el coste real.
3. Un vídeo entero a mano (guion → voz → imágenes → montaje), sin subirlo. Que Rubén lo vea.
4. Nuevo canal en YouTube: Rubén saca su token con `autorizar.mjs`, crea el secreto de Modal **él
   mismo** (nunca pegar claves en el chat).
5. Prueba completa con subida programada → si va bien, `modal deploy` con su propio reloj.
6. Apuntar todo en un `ESTADO.md` del canal nuevo, como el de este.
