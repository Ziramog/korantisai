# The Oracle (Taste Profiler)

## Visión Conceptual
**The Oracle** es la respuesta de Korantis a la fatiga de decisión y al "scroll infinito". En lugar de presentarle al usuario una lista interminable de lugares, lo invitamos a una sesión de calibración de atmósfera inmersiva, táctil y casi meditativa.

Inspirado mecánicamente en aplicaciones de "Swipe" (como Tinder), pero estéticamente arraigado en la elegancia de una **Galería de Arte o una tirada de cartas del Tarot**.

## Mecánica Core
El usuario entra a la pestaña **Taste**. La pantalla se limpia de distracciones y se oscurece.
Se le presenta una única carta gigante (full-screen mobile) con la fotografía inmersiva de un lugar, su nombre, y una frase poética sobre su atmósfera.

- **Swipe Right (Guardar al Atlas)**:
  Al arrastrar la tarjeta hacia la derecha, el borde se ilumina suavemente en dorado (`k-gold`). Si el usuario suelta la tarjeta cruzando el umbral, la tarjeta vuela hacia la derecha, se activa un feedback háptico (vibración) y el bar queda eternamente guardado en su Atlas privado.
  
- **Swipe Left (Desestimar / Pasar)**:
  Al arrastrar hacia la izquierda, la tarjeta se oscurece o se envuelve en sombras. Al soltarla, se desvanece suavemente en la oscuridad. El bar es ignorado para esta sesión, permitiendo que la calibración continúe sin culpa.

## Valor del Producto
1. **Zero Friction Onboarding**: Permite a un usuario nuevo poblar su mapa personal (Atlas) de lugares curados en menos de 60 segundos.
2. **Data-Gathering Silencioso**: En el futuro, estas decisiones binarias pueden entrenar a un modelo algorítmico local para entender si el usuario prefiere "cafeterías luminosas" o "speakeasies ocultos".
3. **Engagement Táctil**: Las animaciones fluidas con `framer-motion` (físicas de resorte, rotación 3D al arrastrar) hacen que la simple acción de organizar lugares sea un juego premium.

## Estética y UI
- **Sin Botones Gigantes**: No hay una "X" roja ni un "Corazón" verde estáticos que ensucien la interfaz. Todo el feedback es visual y dependiente del gesto (drag).
- **Tipografía Protagonista**: La tarjeta solo contiene la imagen de fondo, un gradiente profundo para legibilidad, el Nombre en fuente `Display`, y la Descripción de Atmósfera.
- **Físicas (Physics)**: La tarjeta debe rotar levemente (tilt) dependiendo de hacia dónde y qué tan lejos se esté arrastrando, simulando el peso de un objeto físico.
