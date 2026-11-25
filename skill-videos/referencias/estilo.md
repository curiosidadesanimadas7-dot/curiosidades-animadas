# El estilo, con números

Medido sobre 20 shorts del estilo de referencia (fotograma a fotograma, a 30 fps) y adaptado a personajes 3D. La plantilla (`plantilla/motor/estilo3d.js`) ya trae estos valores. Este archivo sirve para comprobar que lo que sale se parece y para decidir cuando algo no cuadra.

## De un vistazo

Personajes de dibujo animado hechos en 3D dentro de un mundo 3D pintado, con líneas de tinta casi negras. Colores claros y muy saturados, luz cálida y sombras azuladas o violetas, y todo nítido, sin desenfoque de fondo. La cámara nunca está muerta.

## Personajes

| Qué | Valor |
|---|---|
| Cabeza | Blanca (#fdf8f3) o crema. Algo más ancha que alta (alto/ancho 0,93), con la barbilla un poco más estrecha y la coronilla un pelín apuntada. |
| Cara | Sin nariz, orejas, coloretes ni brillos en los ojos. |
| Ojos | Separados 0,26 del ancho de la cabeza (W). Por defecto, «párpado»: una raya y medio disco debajo, cara de póker. |
| Cejas | Trazos cortos y gruesos (0,175 × 0,05 W), 0,20 W por encima de los ojos, a menudo una más alta. |
| Boca | Pequeña, 0,19 W por debajo de los ojos, a menudo torcida. Abierta: interior #54212a y dientes blancos. |
| Contorno | Ciruela oscuro #241726, de 2 a 3 veces más grueso abajo que arriba (≈5 % de W de media). |
| Cuerpo | Alubia de un solo color saturado, 0,8 W de ancho, más estrecha arriba y con el culo redondo. Va tapada por la cabeza: no hay cuello. |
| Proporciones | Un adulto mide 3,5 cabezas (piernas 1,4). Un niño, de 2,7 a 3. |
| Brazos y piernas | Palitos ciruela de 0,055 W, sin rodillas ni hombros. Manos de punto (0,11 W) y pies cortos y redondos. |
| Distinguir personajes | Por el color de la ropa y el sombrero o el pelo: gorra, sombrero, gorro de cocinero, casco, gorro o pelo. Opcional: bigote. |
| Sombras | Mancha suave de contacto bajo los pies y sombra proyectada por el sol. |

Cómo se mueven:

- **Nada de dibujo animado «de goma».** Ni estirar y encoger, ni temblor de línea, ni respiración en reposo. Quietos están quietos.
- **Parpadeo.** Cada 0,5 a 2,3 s y dura 4 fotogramas a 30 fps (medio, cerrado, cerrado, medio). Además parpadean en cada cambio de cara.
- **Reacciones.** Caen de 0 a 3 fotogramas (≈0–0,1 s) **antes** de la palabra. Los cambios de cara son instantáneos.
- **Andar.** Paso de 0,3–0,4 s, bote del 3–7 % de la altura, inclinación hacia delante de 1° a 7° y pies plantados.
- **Saltos.** Agacharse 2–3 fotogramas y luego salir disparado.

## Mundo

| Qué | Valor |
|---|---|
| Superficies | Pocas manchas de color plano con juntas finas y oscuras (3–5 px a 1080 de ancho): adoquines, tablas, tejas, baldosas. Nada de texturas fotográficas. |
| Tinta | Casi negra (#0b0a0c), de 3 a 4 px a 1080 de ancho, igual de gruesa lejos que cerca. Va en siluetas contra el cielo, saltos de profundidad y aristas convexas. Nunca en la unión pared-suelo ni en el horizonte. Los personajes llevan su propio contorno ciruela. |
| Color | De día, luma mediana ≈0,57. Sin negros aplastados (los oscuros también tienen color), salvo la tinta. Lo iluminado, muy saturado (C* p90 ≈55). |
| Fachadas | Ladrillo apagado, crema, ocre, terracota, azul grisáceo. Zócalo más oscuro, cornisa clara, ventanas con marco y alféizar. Nunca color limón ni lavanda iluminada. |
| Cielo de día | Arriba #3f86dc, horizonte #b9d3ef (1,28 veces más claro que arriba). Nubes blancas con la panza lavanda. |
| Lejos | Niebla del color del horizonte: de 25 a 320 m de día. Lo lejano se acerca al color del cielo. |
| Brillos | Solo en lo que da luz: ventanas, farolas, fuego, sol y luna. |
| Atrezo | Cada frase se ilustra literalmente y los objetos cuentan el chiste: una máquina, un cartel, una caja… |

## Luz

| Momento | Cómo es |
|---|---|
| Día | Sol de lado, luz cálida, sombra azulada a ≈0,5 de la luz. |
| Atardecer | Luz naranja rasante, horizonte melocotón #ffd08a, cielo malva arriba y sombras violeta-azul. Nunca marrones. |
| Noche | Azules profundos, con ventanas y farolas amarillas encendidas. |

- **La luz cambia con la historia.** Por ejemplo, día para el arranque, atardecer para el giro y noche para la explicación. Cambia solo en un corte o un fundido.
- **Caras.** Siempre claras (≈0,93–0,97 de brillo) con cualquier luz; solo se tiñen un poco del color de la escena.

## Cámara y montaje (medido a 30 fps)

| Qué | Valor |
|---|---|
| Cortes duros | Casi nunca: de 0 a 1 por vídeo en 12 de los 20. Se va de un plano a otro moviendo la cámara. |
| Cámara quieta del todo | Solo el 10 % del tiempo. El 65 % se mueve y el resto se arrastra despacio. |
| Movimientos | Entran y salen suaves (curva simétrica): ≈23 fotogramas, 0,6–1,3 s. Unos 6 cada 10 s. |
| Planos fijos | Se acercan despacio todo el rato: ≈4 %/s de mediana, hasta 10 %/s. En la palabra fuerte, ≈18 %/s durante 1 s (+22 %). |
| Inclinación | Giros de 3–5° en dramas y caídas, unos 3 cada 10 s, de ≈0,6 s. |
| Golpes | En los impactos, una sacudida que cambia de signo cada fotograma y se apaga en 6–8 fotogramas (≈0,23 s). |
| Cambiar de sitio | Seguir un objeto de un sitio a otro, o un fundido de 6–8 fotogramas (0,2–0,27 s). |
| Barrido rápido | Con desenfoque de movimiento. Raro: menos de uno por minuto. |
| Flash blanco | De ≈4 fotogramas (0,13 s), justo después del gancho. |
| Altura | A la altura de los ojos de los personajes en el 82 % de los planos. Picados y contrapicados, pocos. |
| Encuadre vertical | Horizonte al ≈45 % de la altura. La parte de arriba de la cabeza, al 28 % en primer plano, al 35 % en plano medio y al 50 % en general. |
| Protagonista | Uno por plano, personaje u objeto. Atrezo cerca de la cámara en ≈1/3 de los planos: aquí va nítido, porque no hay desenfoque. |

## Texto en pantalla

- **Subtítulos.** Todo lo que dice la voz, de 2 a 5 palabras a la vez, en blanco con borde negro y pequeños (46 px). Van centrados en la franja de 1318 a 1394 px de alto, la misma altura que en los shorts de referencia. Cambian de golpe, sin animación.
- **Palabras clave.** De 1 a 3 palabras grandes (≈112 px), en blanco con borde ciruela grueso y la clave en amarillo #ffd23f. Entran con un pop, duran de 1 a 1,6 s y salen una cada 5–8 s. Van entre 300 y 1150 px de alto y nunca encima de una cara.

## Fotogramas de referencia (`fotogramas/`)

Son de otro creador. Sirven **solo para mirar el estilo**: no se publican, no se suben a ningún sitio y no se copian sus personajes, sus historias ni sus planos. Allí los personajes son planos y los nuestros son 3D, con el mismo diseño.

| Archivo | Fíjate en |
|---|---|
| 01-dia-calle-plano-medio | Luz de día, fachadas, tinta en el mundo, personaje con sombrero |
| 02-dia-pueblo-plano-general | Plano general: cielo, tejados, grupo de personajes pequeños |
| 03-dia-cubierta-plano-medio | Madera pintada con juntas, atrezo que cuenta (la caja) |
| 04-interior-dia | Interior de colores planos y saturados |
| 05-interior-calido | Luz cálida de lámpara, sombras violetas |
| 06-luz-de-fuego | Fuente de luz con brillo; la cara sigue clara |
| 07-primer-plano | Cara: ojos de párpado, cejas, boca pequeña, contorno |
| 08-atardecer | Luz rasante naranja y sombras violeta |
| 09-noche-azul | Noche: azules profundos y una ventana encendida |
| 10-noche-ciudad | Noche en ciudad: muchas ventanas encendidas |
