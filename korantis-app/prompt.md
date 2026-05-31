Actúa como un experto Frontend Developer especializado en React, Next.js y animaciones fluidas con Framer Motion. 

Estoy trabajando en una aplicación con una UI extremadamente minimalista (estilo HUD) y tengo dos bugs puntuales de interacción y animación que necesito que arregles.

### Contexto Técnico
- Framework: Next.js (App Router) + React
- Estilos: Tailwind CSS
- Animaciones: `framer-motion`
- Layout: El contenedor principal tiene el scroll nativo de `window`.

### Bug 1: SearchBar Scroll Behavior (Estilo Apple Maps)
Tengo un `SearchBar` flotante (fixed top) que usa `useScroll` y `useMotionValueEvent` de framer-motion. Tiene 3 estados manejados por el hook de animación: `expanded`, `compressed` y `hidden`.
La lógica deseada exacta es:
1. En el tope de la página (0px a 80px de scroll): Estado `expanded` (100% width).
2. Haciendo scroll hacia abajo (más de 80px): Estado `hidden` (opacity 0, y: -60).
3. **Haciendo scroll hacia arriba (desde cualquier profundidad): Estado `compressed` (pastilla pequeña, opacity 1, y: -20).**
4. Al volver a tocar el tope: vuelve a `expanded`.

**El Problema:** La detección de scroll hacia arriba no está funcionando. Cuando el usuario hace scroll hacia arriba desde lo profundo, la barra no reaparece. He intentado calcular la dirección comparando `latest` vs `getPrevious()`, o usando un `useRef`, pero los micro-rebotes (bounces del navegador) o el ciclo de renderizado de React están rompiendo la lógica.
**Misión:** Dame un componente funcional que rastree la dirección de forma robusta e infalible, filtrando el bounce de scroll de Mac/iOS, para que la barra siempre reaparezca al scrollear hacia arriba.

### Bug 2: Global Nav Animation (Menú Inferior)
Tengo una barra de navegación inferior (`GlobalNav`) con 3 íconos de texto (`⌂`, `◈`, `◎`). Almaceno la pestaña activa en un estado `activeTab` en el padre.
Quiero que un pequeño punto dorado (un `<motion.div>`) se deslice suavemente de un icono al otro cuando el usuario cambia de tab. He intentado usar `layoutId="nav-indicator"`, pero la animación se corta, no se ve fluida o directamente no ocurre.

**Misión:** Escribe la estructura correcta del `GlobalNav` usando `layoutId` de framer-motion para asegurar que el indicador animado transicione perfectamente entre los botones.

Por favor, dame el código de ambas soluciones, asegurándote de usar buenas prácticas para evitar re-renders innecesarios o problemas de layout de Framer Motion.