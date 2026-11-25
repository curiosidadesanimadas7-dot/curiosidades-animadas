# Curiosidades Animadas

## De qué va el canal

- **Nombre del canal:** Curiosidades Animadas
- **De una frase:** curiosidades de todo tipo, explicadas en un minuto con personajes animados.
- **Para quién:** gente joven, de 14 a 25 años. Están en el móvil, pasando vídeos: o les enganchas
  en el primer segundo o se van.
- **Qué se lleva el que lo ve:** algo que no sabía, que le pasa a él o que ve todos los días, y que
  le apetece contarle a alguien. Nunca un vídeo que no deje nada.

> **Cambio del 25/11:** fuera los moldes fijos («¿qué pasa si…?», «¿sabías que…?»). Ahora manda el
> estilo de estos cuatro shorts, que Rubén puso de ejemplo (**son para mirar cómo están escritos;
> no copies sus temas**):
> - «¿Cuántos kilos levantas de verdad en una flexión?» (El Cuerpo Miente)
> - «Por qué los doctores te golpean la rodilla con un martillito» (MundoDeMedicina)
> - «Misma agua, misma llave. ¿Qué tanque se vacía primero?» (Scientia Explained)
> - «Tu ampolla no es una quemadura: tu piel se rasgó por dentro» (1Cell1Life)

## El tema de cada día: una curiosidad, de lo que sea

**De todo tipo:** el cuerpo, la comida, el deporte, la física de casa, los animales, la tecnología
de todos los días, el espacio, la historia, el dinero, el lenguaje… Lo que importa no es el tema,
es que el que mira piense «anda, pues es verdad» o «no tenía ni idea».

**Lo que tienen los buenos** (así están hechos los cuatro de ejemplo):

- **Habla de algo que el que mira conoce o ha vivido.** Una flexión, el martillito del médico, una
  ampolla, el agua que sale de un depósito. Le pasa a él, así que le importa.
- **El primer segundo engancha, sin presentación.** Nada de «hoy te voy a contar». Funciona:
  - **Una pregunta que le reta:** «¿No te sale ni una flexión? No es que seas débil.»
  - **Corregir lo que cree:** «Tu ampolla no es una quemadura. Tu piel se ha roto por dentro.»
  - **Algo que pasa y no se explica:** «Tu pierna da una patada sola. Y tu cerebro ni se entera.»
  - **Un reto para adivinar:** «Misma agua, mismo grifo. ¿Cuál se vacía antes?» Y la respuesta,
    al final.
- **Números concretos que se puedan imaginar.** «Pesas 80 kilos. En una flexión levantas 51.»
  Mejor un dato exacto que diez vagos. Y solo si es verdad.
- **Explica el porqué paso a paso,** como si lo fueras desmontando: qué pasa primero, qué después,
  y por qué. Cada frase empuja a la siguiente («pero», «así que», «y aquí viene lo raro»).
- **Un giro a mitad:** lo que nadie se espera, o lo que demuestra que lo que creía era al revés.
- **Una sola idea por vídeo.** Nada de listas ni de «cinco datos de…».
- **Varía:** no dos días seguidos del mismo campo (dos del cuerpo, dos del espacio…). Mira el
  historial.
- **Tiene que ser verdad y comprobable.** Si no estás seguro de una cifra, no la pongas. Apunta en
  `guion.md` de dónde sale cada dato.
- **Elige tú el tema del día**, que no esté ya en el historial.

## El tono

- **Narrador de documental, pero para el móvil:** cercano, con un poco de sorna cuando toca, como
  quien te cuenta algo alucinante en el recreo. Ni voz de profesor ni de youtuber gritando.
- **De tú, español de España**, frases cortas. Le habla al que mira: «tu pierna», «tu piel».
- **Sin comas que sobren.** En la voz, una coma es una pausa: pon solo las que haría alguien
  contándolo en voz alta. Si una frase necesita muchas comas, pártela en dos.
- **La voz:** Gemini (`gemini-3.8-flash-tts`), voz `Charon`, con esta dirección de
  interpretación: *narrador de documental en español de España, cercano y con un poco de sorna,
  frases cortas con una pausa breve entre ellas, sin gritar y sin voz de anuncio*. La pone
  `automatizacion/voz.sh`; para cambiarla, `VOZ=...` o `ESTILO=...` delante del comando.

## Lo que no quiero

Esto no es una lista de buenas intenciones: es lo que hace que el canal no se caiga. Si el tema del
día roza cualquiera de estos puntos, **cámbialo por otro** en vez de intentar contarlo con cuidado.

- **Autolesiones, suicidio o hábitos peligrosos.** Nada que muestre o sugiera autolesiones, retos
  mortales o daños físicos graves. Un riesgo conocido se puede explicar de forma educativa, con
  cuidado de que no parezca una invitación a probarlo.
- **Violencia extrema, sangre gratuita o instrucciones para hacer daño.** Nada gráfico, ni armas,
  ni explosivos, ni cómo dañar a personas o infraestructuras.
- **Desinformación médica o de emergencias.** Explicar cómo funciona el cuerpo, sí. Curas
  milagrosas, negar vacunas o tratamientos, o consejos que suenen a diagnóstico, no.
- **Odio, acoso o difamación.** Ningún ataque por raza, religión, género, orientación sexual,
  discapacidad o nacionalidad. Ninguna acusación grave contra una persona real o una marca.
- **Contenido sexual.** Nada explícito, nada erótico, y jamás nada sexual que roce a menores.
  Ojo: el público de este canal empieza en 14 años.
- **Estafas, fraude, malware o delitos.** Se puede contar que algo existe y cómo se protege uno;
  nunca cómo se hace.
- **Copyright.** Nada de música, clips, personajes o marcas protegidas. Todo lo que sale en el vídeo
  es dibujo propio hecho con la plantilla, así que esto se cumple solo: no metas logos, ni marcas
  reconocibles, ni personajes de nadie.
- **Datos inventados.** Si no estás seguro de una cifra, no la pongas. Un vídeo de curiosidades que
  miente se queda sin canal.

## Para subirlo

En `resumen.json`, además del título y la descripción:

- **El título** es el gancho del vídeo en una línea, de tú y con intriga: «Tu tripa ruge aunque
  no tengas hambre: está limpiando». Menos de 70 caracteres.
- **La descripción**: dos o tres líneas que resumen la curiosidad con su dato más fuerte, y la
  pregunta del final.
- **Entre 3 y 5 hashtags**, en minúsculas, sin tildes y sin espacios.
- **`#shorts` siempre**, porque el vídeo es vertical y corto.
- **Uno fijo del canal:** `#curiosidades`.
- **Dos o tres del tema exacto** del vídeo de hoy (`#cuerpohumano`, `#fisica`, `#espacio`…).
- **Ninguno de relleno:** nada de `#viral`, `#fyp` ni `#parati`.

**Cómo acaba el vídeo:** con una pregunta al que lo ve, de las que dan ganas de contestar. Que salga
de lo que se acaba de contar y se pueda responder en tres palabras: «¿Cuántas flexiones seguidas
haces?», no un «¿y tú qué opinas?».
