Análisis Crítico + Sprint 3 — Korantis
1. Crítica Visual: Lo que funciona y lo que falta
✅ Lo que se ejecutó bien (felicitaciones al equipo):
Elemento	Evaluación
Bottom Tab Bar	Implementada correctamente. Íconos + labels, estado activo en dorado. Siempre visible.
Estructura de Home	Search bar arriba → pills → sección contextual → feed. Correcto.
Atlas	Mapa oscuro, clusters, HUD de cards flotantes. Muy buena ejecución.
Guardados	Limpio, funcional, listas con conteo. "Agregados recientemente" es buen detalle.
Tab Vos	MUCHO mejor que el "perfil latente / afinidades circadianas" anterior. La barra de calibración es clara.
Contenido real	Hay venues reales con fotos reales. Se siente como producto, no como demo.
Dark mode consistente	El fondo oscuro con acentos dorados se mantiene en todas las pantallas.
🚨 Problemas críticos que impiden el efecto "WOW":
PROBLEMA 1: Los tags son datos crudos, no curación visible
Lo que veo:

WARM  REFINED  LATE_NIGHT  DATE_NIGHT  INTIMATE  CREATIVE  HIDDEN_GEM  COCKTAIL_BAR  VILLA_CRESPO  RECOLETA  BAR  RESTAURANT
El problema:

Guiones bajos (LATE_NIGHT, DATE_NIGHT, HIDDEN_GEM, COCKTAIL_BAR) → se están mostrando slugs de base de datos al usuario.
Mezcla de categorías semánticas: mood (WARM, INTIMATE), momento (LATE_NIGHT), ocasión (DATE_NIGHT), tipo (BAR, RESTAURANT, COCKTAIL_BAR), barrio (RECOLETA, VILLA_CRESPO), cualidad (HIDDEN_GEM, CREATIVE, REFINED). Todo junto sin jerarquía.
7-8 tags por card. Son demasiados. El usuario no procesa más de 3-4.
Todo en MAYÚSCULAS y mismo estilo visual → no hay diferencia entre un mood y un barrio.
La solución:

Separar visualmente por tipo y mostrar MÁXIMO 3-4 tags en las cards:

Cards del feed (máximo 4 tags visibles):
→ Solo moods + ocasión. Nada de tipo ni barrio (eso ya está en el subtítulo).

Correcto:  [Warm] [Intimate] [Date night]
Incorrecto: [WARM] [REFINED] [LATE_NIGHT] [DATE_NIGHT] [INTIMATE] [BAR] [RECOLETA]
Reglas de display:

Moods: pills con borde dorado (los protagonistas)
Barrio: ya está en el texto debajo del nombre → NO repetir como tag
Tipo (bar, restaurant): ya está en el subtítulo → NO repetir como tag
Momento (late night): puede ser un tag pero formateado como "Late night", no "LATE_NIGHT"
NUNCA mostrar underscores al usuario
PROBLEMA 2: Demasiados tags roban protagonismo a la foto y el nombre
Mirá la card de "Pipi Lounge":

WARM  LATE_NIGHT  INTIMATE  CREATIVE  HIDDEN_GEM  COCKTAIL_BAR  VILLA_CRESPO
7 tags. Ocupan más espacio visual que la descripción. El ojo no sabe dónde posarse. Compará con lo que debería ser:

Pipi Lounge
Villa Crespo, Buenos Aires
"Rincón escondido para cócteles creativos."
[Warm] [Intimate] [Late night]
3 tags. Limpios. El usuario capta en 1 segundo: warm + intimate + late night. Listo.

PROBLEMA 3: Las cards full-width no tienen ícono de bookmark visible
En la Home, las cards grandes de "LO NUEVO" no muestran el [♡] para guardar. El usuario tiene que entrar a la ficha para guardar. Eso agrega fricción innecesaria al loop más importante (ver → guardar → volver).

Fix: Agregar ícono de bookmark (♡) en la esquina superior derecha de cada card full-width, sobre la foto, con fondo semi-transparente.

PROBLEMA 4: La Home se siente "lista de items" más que "experiencia de descubrimiento"
El feed actual es:

[Carrusel "TU TARDE"]
[Card full-width]
[Card full-width]
[Card full-width]
[Card full-width]
[Card full-width]
...
Es un scroll vertical monótono. Falta ritmo visual. Falta alternancia entre formatos. El brief original pedía:

[Carrusel contextual]
[Cards full-width editorial (2-3)]
[Carrusel temático: "Para estar solo"]
[Cards full-width (2-3)]
[Carrusel temático: "Citas sin ruido"]
[Pills de barrio: explorar por zona]
La alternancia entre carruseles horizontales y cards verticales crea ritmo y rompe la monotonía. Ahora es solo un feed vertical plano después del primer carrusel.

PROBLEMA 5: Tipografía y jerarquía insuficientes
Elemento	Ahora	Debería ser
Nombre del venue en card	Bold pero no dominante	Más grande, serif, commanding
Tagline/descripción	Texto regular sin diferenciación	Italic, serif, ligeramente más chico, tono diferente
Section headers ("TU TARDE", "LO NUEVO")	Tracking pequeño, uppercase, gris	Más presencia: serif, más grande, o con icon/emoji
Barrio + tipo en card	Ahí pero se pierde	Light weight, color gris sutil pero legible
Tags	Todos iguales visualmente	Jerárquía: moods en dorado, resto en gris si se muestran
PROBLEMA 6: Los Mood Pills de la Home se ven funcionales pero no premium
Ahora son pastillas con borde simple. Para una app que se vende como "emocional y estética", los mood pills deberían ser más expresivos:

Estado default: borde sutil + texto claro
Estado activo: fondo dorado degradado + texto oscuro + sutil glow/shadow
Posible: micro-ícono o emoji por mood (☁ Calmo, 🔥 Energético, 🌙 Íntimo)
Transición animada entre estados (Framer Motion: scale + opacity)
PROBLEMA 7: El tab "Vos" se siente vacío
Es una pantalla con:

Un ícono de usuario
Un "Lv.3" (gamification que no encaja con el tono premium)
Un título
Una barra de progreso
Mucho espacio vacío
Problemas específicos:

"Lv.3" sugiere videojuego, no experiencia premium. Considerar eliminarlo o reemplazar por algo más sutil.
La pantalla tiene UN solo elemento informativo (la barra). Se siente incompleta.
El copy "Korantis calibra tu energía" es mejor que antes pero todavía un poco abstracto.
PROBLEMA 8: Search bar se ve genérica
La barra de búsqueda actual es un input con ícono de lupa. Funcional, sí. Premium, no. Para Korantis debería sentirse más como un botón/invitación que como un formulario.

Ideas:

Background con blur/glass effect sutil
Placeholder que rota entre sugerencias: "café tranquilo..." → "bar íntimo..." → "terraza con sol..."
Al tappear: expansión animada a pantalla fullscreen (no solo redirect)
2. Definición del Sprint 3 — Lista Priorizada
PRIORIDAD 1: Arreglar los tags (Día 1-3)
Impacto: ALTO. Es lo que más "rompe" la percepción de calidad ahora mismo.

Tareas:

Crear un sistema de tag display que mapee slugs internos a labels legibles:

const TAG_DISPLAY: Record<string,> = {
  'LATE_NIGHT': 'Late night',
  'DATE_NIGHT': 'Date night',
  'HIDDEN_GEM': 'Hidden gem',
  'COCKTAIL_BAR': 'Cocktail bar',
  'VILLA_CRESPO': 'Villa Crespo', // PERO no mostrar como tag
  // etc.
}
Definir reglas de qué tags se muestran en cards:

const CARD_TAG_RULES = {
  maxTags: 3, // NUNCA más de 3 en card de feed
  priority: ['mood', 'occasion', 'moment'], // En este orden
  exclude: ['neighborhood', 'venue_type'], // Ya están en el subtítulo
}
Separar visualmente mood tags (dorado) de meta tags (gris, si se muestran en la ficha).

Eliminar ALL CAPS de los tags. Title case o lowercase.

Deliverable: Cards con máximo 3 tags legibles, sin underscores, sin repetir info del subtítulo.

PRIORIDAD 2: Ritmo visual en el feed (Día 2-5)
Impacto: ALTO. Transforma la home de "lista" a "experiencia".

Tareas:

Intercalar carruseles temáticos entre bloques de cards full-width:

[Carrusel: "Tu tarde" - contextual]
[Card HERO]
[Card ESTÁNDAR]
[Card ESTÁNDAR]
[Carrusel: "Para estar solo" - temático]
[Card HERO]
[Card ESTÁNDAR]
[Card ESTÁNDAR]
[Carrusel: "Citas sin ruido" - temático]
[Pills de zona: "Explorá por barrio"]
Implementar 2 variantes de card full-width que se ALTERNEN:

Card HERO (cada 3-4 cards):

Foto: aspect-ratio 3:2 o 16:10 (más ancha, más cinematográfica)
Altura de foto: ~220-260px
Se usa para: venues recién agregados o con foto muy atmosférica
Es el "respiro visual" del feed
Card ESTÁNDAR (la mayoría):

Foto: aspect-ratio 4:3
Altura de foto: ~160-180px
Es la card regular del feed
La variación de altura entre cards crea ritmo editorial (como una revista) sin sacrificar la legibilidad actual. NO cambia el layout del texto/tags (nombre, barrio, tagline, mood pills siguen igual en ambas variantes). Solo varía la ALTURA de la foto.

Implementar al menos 3 carruseles temáticos con lógica real:

"Tu [momento]": filtrado por franja horaria actual + abierto ahora
"Para estar solo": venues con occasion: estar_solo score ≥ 4
"Citas sin ruido": venues con occasion: primera_cita + conversation_ease ≥ 4
Agregar sección "Explorá por zona" al final:

[Palermo] [Recoleta] [San Telmo] [Villa Crespo] [Belgrano]
Tap → filtra feed por barrio.

Deliverable: Home con carruseles alternados + cards con variación de altura que generan ritmo editorial sin perder legibilidad.

PRIORIDAD 3: Bookmark [♡] en cards del feed (Día 3-4)
Impacto: ALTO. Es la acción más importante para retención.

Tareas:

Agregar ícono bookmark en esquina superior derecha de cada card full-width (sobre la foto, con fondo semi-transparente oscuro para contraste).
Tap → cambia a ♥ lleno dorado + pulse animation (Framer Motion: scale 1→1.3→1 en 300ms).
Mostrar toast bottom: ♥ Guardado    [Agregar a lista]
Si no tiene cuenta → trigger modal de registro.
Deliverable: El usuario puede guardar sin entrar a la ficha.

PRIORIDAD 4: Micro-interacciones y transiciones (Día 4-7)
Impacto: MEDIO-ALTO. Es lo que transforma "funcional" en "premium".

Tareas con Framer Motion:

Cards del feed — entrada progresiva:

// Cada card entra con stagger al scrollear

Mood pills — estado activo:

Bookmark — pulse on save:

Tab switching — content fade:


  

Cards del Atlas HUD — entrada desde bottom:

Search bar → fullscreen: AnimatePresence con layoutId para transición fluida del input a pantalla completa.

Deliverable: Todas las interacciones principales tienen feedback animado.

PRIORIDAD 5: Onboarding de primer uso (Día 5-8)
Impacto: MEDIO. Necesario para nuevos usuarios pero no afecta a los actuales.

Implementación:

// 3 pantallas con swipe o tap para avanzar

// Pantalla 1

  
  Lugares para cómo querés sentirte.
  
    Descubrí cafés, bares y restaurantes por mood, momento y energía.
  
  Empezar →


// Pantalla 2

  ¿Dónde estás?
  
  Continuar →


// Pantalla 3

  ¿Qué te atrae más?
  Elegí 2 o más.
  
    {['Calmo', 'Íntimo', 'Social', 'Energético', 'Refugio', 'Productivo'].map(mood => (
      
    ))}
  
  Explorar →
  Saltar

Reglas:

Solo se muestra UNA vez (flag en localStorage/DB).
Transiciones entre pantallas: slide horizontal con Framer Motion.
"Saltar" visible pero discreto.
La selección de moods se guarda y alimenta el ranking inicial del feed.
Deliverable: Onboarding de 3 pasos funcional que aparece solo en primer uso.

PRIORIDAD 6: Pulido del tab "Vos" (Día 6-9)
Impacto: MEDIO. Mejora percepción pero no es el core loop.

Cambios:

Eliminar "Lv.3" — reemplazar por nada o por un indicador más sutil (ej: los moods que más guarda como pills debajo del avatar).

Agregar stats básicos debajo de la calibración:

─────────────────────
3 guardados · 2 barrios · Desde junio 2025
─────────────────────
Agregar sección "Tus moods" (solo si tiene ≥ 3 guardados):

TUS MOODS
[Warm ●●●●○] [Intimate ●●●○○] [Refined ●●○○○]
Barras horizontales simples de los moods predominantes en sus guardados.

Agregar accesos a settings abajo:

[Cambiar ciudad →]
[Notificaciones →]
[Cerrar sesión]
Mejorar el copy:

Actual: "A medida que interactúas, Korantis calibra tu energía para recomendarte espacios perfectos para ti."
Nuevo: "Guardá y explorá. Tu perfil se construye solo."
Deliverable: Tab Vos con stats + moods + settings. Menos vacío, más informativo.

PRIORIDAD 7: Tipografía y jerarquía visual (Día 7-10)
Impacto: MEDIO. Sutil pero acumulativo en la percepción premium.

Cambios Tailwind:

/* Section headers */
.section-header {
  @apply font-serif text-lg text-[#C9A96E]/80 tracking-wide;
  /* Antes: text-xs uppercase tracking-widest text-gray-500 */
}

/* Venue name in card */
.venue-name-card {
  @apply font-serif text-xl font-semibold text-white leading-tight;
  /* Serif para nombres, no sans-serif */
}

/* Tagline en card */
.venue-tagline {
  @apply font-serif italic text-sm text-white/70 leading-relaxed;
  /* Diferenciado del nombre y los tags */
}

/* Tags/pills */
.mood-tag {
  @apply text-xs font-medium px-2.5 py-1 rounded-full 
         border border-[#C9A96E]/40 text-[#C9A96E]/90;
  /* Nunca uppercase completo. Title case. */
}

.mood-tag-active {
  @apply bg-[#C9A96E] text-[#1a1a1a] border-[#C9A96E]
         shadow-[0_0_8px_rgba(201,169,110,0.25)];
}
Regla tipográfica:

Serif (ej: Playfair Display o similar): Nombres de venues, secciones, taglines
Sans-serif (ej: Inter, DM Sans): Tags, body text, labels, UI elements
Contraste mínimo texto body sobre dark: text-white/80 no text-white/60
Deliverable: Tipografía con clara jerarquía serif/sans. Más contraste. Más legibilidad.

PRIORIDAD 8: Search bar mejorada (Día 8-10)
Impacto: MEDIO-BAJO para funcionalidad actual. ALTO para sensación premium.

Cambios:

Background con glass effect:

Placeholder que rota (cada 4 segundos):

const placeholders = [
  'café tranquilo...',
  'bar para una cita...',
  'terraza con sol...',
  'lugar para trabajar...',
];
// AnimatePresence para fade between placeholders
Al tappear → transición animada a pantalla fullscreen (shared layout animation con layoutId en Framer Motion).

Deliverable: Search bar que se siente como invitación, no como formulario.

PRIORIDAD 9: Mejoras en Atlas (Día 9-11)
Impacto: BAJO-MEDIO. Atlas ya funciona bien.

Cambios:

Markers más branded: En vez de círculos negros genéricos con números, usar un pin con forma personalizada con el dorado Korantis:

// Custom marker: círculo dorado con borde + número blanco

  {count}

Tap en marker sin cluster → card preview directa (no solo centrar mapa, mostrar la card HUD del venue).

Eliminar el header "Atlas" grande. El mapa debe empezar más arriba, maximizando viewport. Solo mantener el header mínimo con KORANTIS + ciudad.

Deliverable: Markers branded + más espacio para el mapa.

PRIORIDAD 10: Performance y polish técnico (Día 10-12)
Impacto: Invisible pero crítico para UX mobile real.

Tareas:

Lazy loading de imágenes con placeholder blur (Next.js Image con placeholder="blur").
Skeleton screens mientras carga el feed (cards grises pulsantes en vez de spinner).
Scroll restoration al volver del venue detail al feed.
Prefetch de venue detail al hacer hover/tap prolongado en card (Next.js prefetch).
Optimizar re-renders del mapa Atlas (memo components, evitar re-mount en tab switch).
Viewport units correctos para mobile (usar dvh en vez de vh para evitar problemas con barra de browser).
Deliverable: App que se siente instantánea en mobile real.

Resumen Sprint 3 — Timeline
Día	Prioridad	Descripción
1-3	P1	Arreglar tags (display legible, max 3, sin underscores)
2-5	P2	Ritmo visual: carruseles temáticos alternados en Home
3-4	P3	Bookmark [♡] en cards del feed + save animation
4-7	P4	Micro-interacciones (Framer Motion en pills, cards, saves, tabs)
5-8	P5	Onboarding 3 pasos
6-9	P6	Pulido tab Vos (stats, moods, eliminar Lv, settings)
7-10	P7	Tipografía y jerarquía (serif/sans, contrastes, tamaños)
8-10	P8	Search bar premium (glass, placeholder rotativo)
9-11	P9	Atlas markers branded + más viewport para mapa
10-12	P10	Performance (lazy load, skeletons, scroll restoration)
Nota Final
El equipo hizo un avance enorme entre lo que era (la versión anterior con hero editorial, Oráculo, perfil latente, afinidades circadianas) y lo que es ahora. La estructura es correcta. La navegación funciona. El contenido es real.

Lo que falta es la capa de polish que separa "app funcional" de "app que te enamora." Y eso se logra con: tags limpios, ritmo visual, microinteracciones, tipografía con intención, y esa sensación de que cada pixel fue pensado.

El fix de tags es urgente — es lo primero que un usuario nota y ahora mismo grita "prototipo de developer". Todo lo demás es acumulativo: cada mejora suma al efecto premium total.