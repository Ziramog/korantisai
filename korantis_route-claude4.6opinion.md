User: Estoy construyendo Korantis, una app mobile-first de descubrimiento emocional de cafés, bares y restaurantes para Buenos Aires y New York.

La idea no es competir directamente con Google Maps, Yelp o TripAdvisor. Korantis busca funcionar como una capa de descubrimiento emocional sobre la ciudad: lugares recomendados por mood, momento del día, energía, estética, intención social y contexto.

Quiero que audites el producto actual con criterio de product strategist, UX lead y brand strategist.

Te paso:
- Link del sitio actual.
- Capturas mobile.
- Capturas desktop si hacen falta.
- Video corto navegando la app.

Necesito que analices:

1. Qué se entiende del producto en los primeros 5 segundos.
2. Qué partes de la UI se sienten fuertes y deberían preservarse.
3. Qué partes se sienten confusas, decorativas o innecesarias.
4. Si conviene usar hero o entrar directo a una home de cards tipo Spotify/Pinterest.
5. Si la navegación Explore / Atlas / Taste es clara.
6. Si la búsqueda por mood se entiende.
7. Si el producto se siente como app real o como landing/demo.
8. Qué falta para que el usuario quiera guardar lugares.
9. Qué deberíamos eliminar para el MVP.
10. Qué deberíamos construir primero en los próximos 14 días.
11. Qué deberíamos construir en 60 días.
12. Qué riesgos ves en la propuesta.
13. Qué oportunidades diferenciales ves frente a Google Maps, Instagram, TikTok, Yelp y Time Out.

Importante:
- No propongas un rediseño genérico.
- No cambies la identidad visual sin justificarlo.
- Priorizá claridad, retención, velocidad y usabilidad mobile.
- Separá tus recomendaciones en: mantener, mejorar, eliminar, construir después.
- Sé crítico. No busco validación, busco una auditoría útil.
User: sitio korantis.com pensado para mobile
User: fileNode coordinates.png
User: fileNode venue-detail.png
User: fileNode atlas.png
User: fileNode home.png
Model: # Auditoría Estratégica de Korantis

## Análisis con criterio de Product Strategist, UX Lead y Brand Strategist

---

## 1. Qué se entiende del producto en los primeros 5 segundos

**Pantalla Explore (Home):** Se entiende bastante bien. "Lugares para cómo querés sentirte" es un tagline fuerte y claro. El subtexto lo refuerza. En 5 segundos capturo: esto es una app para encontrar lugares por estado de ánimo.

**Problema:** El hero con el input de búsqueda que dice "café tranquilo, bar oc..." compite con los tags de categoría (COMER, CAFÉ, DRINKS) y con el scroll de cards debajo. Hay tres entry points simultáneos y ninguno tiene jerarquía visual clara sobre los otros.

**Pantalla Taste (Perfil de gusto):** Se entiende mucho menos. "Tus coordenadas de gusto" suena poético pero no explica qué puedo hacer aquí. "Korantis aprende y ajusta tu perfil latente a través del descubrimiento implícito" es jerga de producto interna disfrazada de copy — un usuario no sabe qué es un "perfil latente" ni un "descubrimiento implícito".

**Veredicto:** La Home vende bien el concepto. Las pantallas secundarias lo oscurecen con lenguaje demasiado literario que sacrifica comprensión por atmósfera.

---

## 2. Partes de la UI que se sienten fuertes y deben preservarse

| Elemento | Por qué funciona |
|----------|-----------------|
| Paleta oscura + dorado + tipografía serif | Genera una identidad visual inmediata que se siente premium, nocturna y diferenciada de cualquier competidor. No es Google, no es Yelp, no es TripAdvisor. Es un mood propio. |
| Cards de lugar con foto + descripción atmosférica + mood tags | Son el corazón del producto. La combinación de imagen evocadora + texto narrativo + tags funcionales es lo que nadie más ofrece. |
| Tagline "Lugares para cómo querés sentirte" | Claro, diferencial, memorable. |
| Mood tags en las cards (Bullicioso, Calmo, Dorado, Íntimo, Silencioso, Social) | Son el vocabulario propio del producto. Funcionan como taxonomía emocional única. |
| Ficha de lugar con "Momentos del día" | Información que no existe en ningún otro directorio. Decirme que un lugar es mejor "de noche con energía" o "a la tarde para una copa lenta" es extremadamente útil. |
| Atlas con mapa | La idea de un mapa personal + espacial como herramienta de descubrimiento geográfico está bien. |
| El radar/gráfico de afinidad (en Taste) | Visualmente atractivo y comunica multidimensionalidad del gusto. Necesita más explicación pero el concepto es bueno. |

---

## 3. Partes que se sienten confusas, decorativas o innecesarias

### Confusas:

- **"El Oráculo — Calibrá tu atmósfera"**: ¿Qué es? ¿Un quiz? ¿Un swipe? ¿Un tuner? El nombre "Oráculo" es lindo pero no dice qué hace. "Deslizá suavemente para enseñarle a Korantis qué se siente bien" — ¿deslizar qué? ¿Hacia dónde? La instrucción asume que ya entiendo el mechanic.
- **"Lecturas de gusto"**: "Ahora te atraen espacios sociales equilibrados, con luz equilibrada y ritmo pausado" — suena a horóscopo. Si no tengo confianza en por qué Korantis sabe esto, suena a bullshit generativo.
- **"Afinidades circadianas más fuertes"**: Nadie fuera de un paper de cronobiología usa "circadiano" para decidir dónde tomar café. Reemplazar por "Tus mejores momentos" o "Cuándo te sentís mejor saliendo".
- **"Descubrimientos pico: Night"** y **"Índice del Atlas: 0 guardados"**: Son métricas que no significan nada cuando acabo de llegar. Si tengo 0 guardados, mostrarme un score vacío me hace sentir que la app está muerta.

### Decorativas:

- La card del Trade Sky Bar dentro de la sección Taste/Oráculo con la descripción poética extensa ("A medida que el crepúsculo envuelve el lugar con su abrazo aterciopelado, la luz dorada se derrama sobre la terraza...") — es demasiado texto para un componente de calibración. Si es un ejemplo de lo que el oráculo muestra, necesita contexto. Si es contenido real, necesita ser más corto.
- Los bordes decorativos y glows dorados en algunos containers agregan ruido visual sin mejorar legibilidad.

### Innecesarias (para MVP):

- Selector de idioma en pantalla de Taste: debería estar en Settings.
- "Compatibilidad latente" como porcentaje en las afinidades: 92% de compatibilidad con "El refugio oculto" — ¿basado en qué data si acabo de entrar?

---

## 4. ¿Hero o Home de cards tipo Spotify/Pinterest?

**Recomendación: Híbrido compacto, inclinado hacia cards.**

El hero actual ("Lugares para cómo querés sentirte") tiene valor como anclaje de marca, pero ocupa demasiado espacio vertical antes de que el usuario vea contenido real. En mobile, el contenido debería estar a un pulgar de distancia.

**Propuesta:**

```
[Header: KORANTIS | Buenos Aires ▼]
[Tagline compacto: 1 línea]
[Barra de búsqueda mood-first]
[Pills horizontales: mood/momento/categoría]
[Feed de cards inmediato]
```

El tagline puede reducirse a una línea que desaparece al hacer scroll (como Spotify muestra "Buenos días" y luego pasa directo a contenido). El input de búsqueda debería ser el hero funcional, no decorativo.

**No recomiendo Pinterest grid** porque las fotos de bares y restaurantes necesitan tamaño para comunicar atmósfera. Cards verticales full-width (como las que ya tenés) funcionan mejor que un mosaic chico donde no distingo si es un bar oscuro o un error de carga.

**No recomiendo eliminar el hero completamente** porque perdés el positioning statement para usuarios nuevos. Pero debe ser más corto y más funcional.

---

## 5. ¿La navegación Explore / Atlas / Taste es clara?

**Parcialmente.**

- **Explore**: Se entiende. Es el feed de descubrimiento.
- **Atlas**: Se entiende como mapa, pero "Atlas" es un nombre poético que requiere un segundo de procesamiento. No es grave — es un trade-off de brand vs. convención que vale la pena si el producto construye vocabulario propio.
- **Taste**: No se entiende bien. ¿Es mi perfil? ¿Son mis preferencias? ¿Es una sección de personalización? "Taste" en inglés sugiere gusto/preferencia, pero también podría ser "prueba algo". Si la app está en español, "Gusto" o "Tu Gusto" sería más claro.

**Problema mayor:** No veo en las capturas una tab bar o nav bar persistente. Si la navegación entre estas tres secciones requiere volver al header o a un menú hamburguesa, es un problema serio de usabilidad mobile. **Necesitás una bottom tab bar con 3-4 ítems visibles siempre.**

**Propuesta de nav:**
```
[Explorar] [Atlas] [Guardados] [Perfil]
```

O si querés mantener nomenclatura propia:
```
[Explore] [Atlas] [Taste] con íconos clarísimos
```

Los íconos deben ser autoexplicativos (brújula, mapa, corazón/bookmark, usuario).

---

## 6. ¿La búsqueda por mood se entiende?

**A medias.**

Lo que funciona:
- El placeholder "café tranquilo, bar oc..." sugiere que puedo buscar con lenguaje natural + mood.
- Los pills de categoría (COMER, CAFÉ, DRINKS) dan estructura rápida.

Lo que no funciona:
- No hay un momento explícito donde la app me pregunte "¿Cómo te querés sentir?" de forma interactiva. Los mood tags aparecen en las cards como atributos de los lugares, pero no como filtros primarios de búsqueda.
- Falta una capa de filtrado por mood que sea tan prominente como las categorías. Imaginate:

```
¿Qué buscás ahora?
[Tranquilidad] [Energía] [Romance] [Soledad productiva] [Noche social]
```

Eso debería ser la interacción principal, no un input de texto libre que requiere que el usuario sepa qué escribir.

**La búsqueda por mood debería ser el diferencial de interacción #1 y ahora está subexpresada.**

---

## 7. ¿Se siente como app real o como landing/demo?

**Se siente como demo curada con contenido real.**

Señales de "demo":
- El feed parece tener pocos lugares (veo repetición de Trade Sky Bar en varias pantallas).
- Las métricas de perfil están en 0.
- No hay estados de loading, empty states diseñados, ni feedback de interacción visible.
- No hay onboarding visible.
- La ficha de lugar tiene "precio no confirmado, reserva no confirmada, confianza editorial alta" — es honesto pero comunica "todavía no tenemos toda la data".
- No se ve sistema de guardado (bookmark) en las cards ni confirmación de acción.

Señales de "app real":
- La ficha de lugar es muy completa y rica.
- El mapa funciona con clustering.
- Hay contenido narrativo genuino que se siente escrito, no templado.

**Para cruzar el umbral de "esto es real" necesitás:**
1. Más de 30 lugares visibles en el feed.
2. Acciones claras (guardar, compartir) con feedback visual.
3. Un onboarding mínimo de 2-3 pasos.
4. Un empty state de "Tu Atlas" que invite a guardar, no que diga "0 guardados".

---

## 8. Qué falta para que el usuario quiera guardar lugares

**Falta la motivación emocional del guardado.**

Ahora mismo guardar un lugar no tiene recompensa visible:
- No hay lista personal visible ("Tu noche perfecta", "Para cuando estoy solo").
- No hay colecciones temáticas que el usuario pueda crear.
- No hay un momento de descubrimiento que genere FOMO de perderlo.

**Lo que necesitás:**

1. **Botón de guardado prominente** en cada card (ícono bookmark, esquina superior derecha, siempre visible).
2. **Micro-animación de confirmación** (el dorado que pulsa, un toast sutil).
3. **Colecciones automáticas** por mood: "Tus calmos", "Tus nocturnos", "Para explorar".
4. **Colecciones manuales** que el usuario nombre: "Citas Palermo", "Trabajar solo".
5. **Social proof ligero**: "23 personas guardaron esto esta semana" — no rating, no estrellas, pero sí señal de que otros comparten tu gusto.
6. **Un motivo para volver**: "3 nuevos lugares calmos esta semana" como push notification.

---

## 9. Qué deberíamos eliminar para el MVP

| Eliminar | Razón |
|----------|-------|
| El Oráculo completo (sección de calibración por swipe) | Es un feature de retención de mes 3, no de adquisición de día 1. Nadie quiere calibrar antes de ver valor. |
| Lecturas de gusto textuales | Suenan a horóscopo sin data real. Generan desconfianza si el usuario no hizo nada para ganarlas. |
| Porcentajes de compatibilidad | Sin historial de uso, cualquier % es mentira percibida. |
| Gráfico radar de perfil | Bonito pero no accionable. Reservar para v2 cuando haya datos de uso real. |
| "Afinidades circadianas" | Rename y simplificar. |
| Selector de idioma en pantalla principal | Mover a settings. |
| "Índice del Atlas" como métrica | Vacío = deprimente. Mostrarlo solo cuando haya ≥3 guardados. |
| Descripciones poéticas de más de 2 líneas en cards del feed | En el feed, una línea de mood + tags basta. La prosa va en la ficha de lugar. |

---

## 10. Qué construir primero en los próximos 14 días

### Semana 1-2: Core Loop Funcional

1. **Bottom tab bar persistente** con Explore / Atlas / Saved / Profile.
2. **Botón guardar en cada card** con feedback visual inmediato.
3. **Pantalla "Guardados"** simple: lista de lugares guardados con foto + nombre + mood tags. Sin colecciones aún, solo la lista.
4. **Filtrado por mood en Explore**: Row de pills interactivos arriba del feed (Calmo, Social, Íntimo, Energético, etc.) que filtran las cards en tiempo real.
5. **Reducir el hero de Explore** a 1 línea + search bar + pills. Que la primera card sea visible sin scroll.
6. **Agregar 20+ lugares reales** con data completa. El volumen mata la percepción de demo.
7. **CTA claro en ficha de lugar**: "Guardar" + "Cómo llegar" (link a Maps). Eso es todo lo que un usuario necesita hacer.

---

## 11. Qué construir en 60 días

### Mes 1-2: Retención + Personalización pasiva

1. **Onboarding de 3 pasos**: Seleccioná tu ciudad → Elegí 3 moods que te representan → Listo, tu feed personalizado.
2. **Colecciones editables**: El usuario nombra y organiza sus guardados.
3. **Sistema de señales pasivas**: Trackear qué cards el usuario mira más de 3 segundos, cuáles guarda, cuáles abre. Usar eso para ranking del feed (no decirle al usuario, solo mejorar lo que ve).
4. **"Para vos ahora"**: Sección contextual basada en hora del día + moods guardados. A las 10am mostrar cafés calmos. A las 22hs mostrar bares sociales.
5. **Push notifications**: "3 nuevos lugares nocturnos en tu zona" — una por semana máximo.
6. **Compartir lugar por link** con preview rico (Open Graph bien hecho para WhatsApp/IG Stories).
7. **Listas curadas editoriales**: "Los 7 bares más silenciosos de Palermo" — contenido editable por el equipo que funciona como entry point desde redes sociales.
8. **NYC como segunda ciudad**: Misma estructura, nuevo contenido.
9. **El Oráculo v1 simplificado**: Mostrá 5 lugares, pedí "me gusta / no me gusta" por cada uno. No swipe poético, solo input binario que alimente el perfil.
10. **Perfil de Taste con data real**: Solo mostrar el radar y las lecturas cuando el usuario haya guardado ≥10 lugares o usado la app ≥7 días.

---

## 12. Riesgos que veo

### Riesgo 1: Contenido que no escala
Cada ficha tiene prosa editorial curada. Eso es el diferencial pero también el cuello de botella. Si no podés generar 200 fichas de calidad en 60 días, el producto se siente vacío. **Necesitás un pipeline**: AI genera primer draft → editor humano ajusta → se publica. No 100% artesanal, no 100% generado.

### Riesgo 2: Lenguaje demasiado literario que aliena
"Perfil latente", "descubrimiento implícito", "afinidades circadianas", "resonancia" — si tu audiencia es gente de 25-40 que quiere saber adónde ir esta noche, hablar como un paper de psicología cognitiva los pierde. El mood puede ser sofisticado sin ser críptico. **Regla: si necesita un tooltip para entenderse, reescribilo.**

### Riesgo 3: Sin loop de retención claro
Hoy la app es "descubrí → mirá → cerrá". No hay razón para volver mañana. Sin guardados, sin notificaciones, sin contenido fresco visible, sin social layer, no hay day-2 retention.

### Riesgo 4: Dos ciudades, ninguna completa
Buenos Aires y New York son muy diferentes en user base. Si tenés 40 lugares en BA y 15 en NYC, ninguna ciudad se siente completa. Mejor tener 1 ciudad con 100+ lugares impecables que 2 con 30 cada una.

### Riesgo 5: Competir sin distribución
Instagram y TikTok son los discovery engines reales para restaurantes hoy. Tu diferencial no es el contenido visual (ellos ganan ahí) sino la curación emocional estructurada. Pero necesitás una estrategia de distribución: ¿cómo llega alguien a Korantis por primera vez? ¿SEO? ¿Contenido compartible? ¿Influencer partnerships? ¿Embed en IG stories?

### Riesgo 6: La estética como barrera
La paleta oscura + dorada es hermosa pero puede comunicar "esto es caro" o "esto es solo para gente fancy". Si querés incluir la parrillita de barrio con ambiente perfecto, la estética no debe ser exclusivamente luxury.

---

## 13. Oportunidades diferenciales vs. competidores

| Competidor | Su debilidad | Tu oportunidad |
|-----------|-------------|----------------|
| **Google Maps** | Información funcional sin emoción. Reviews ruidosas, ratings sin contexto. No te dice cuándo ir ni cómo se siente. | Korantis es el "cuándo + cómo" vs. el "dónde + qué". Google te dice que existe. Korantis te dice si es para vos esta noche. |
| **Yelp** | Reviews como quejas públicas. Rating culture tóxica. Sin curación. Diseño horrible. | Zero ratings, zero reviews públicas. La opinión es editorial, no crowd-sourced. Eso es un feature: confianza por curación, no por volumen. |
| **TripAdvisor** | Para turistas, no para locales. Data desactualizada. UX arcaica. | Korantis para locales que quieren redescubrir su ciudad. El turista puede usarla, pero el local es el core user. |
| **Instagram** | Descubrimiento accidental, no intencional. No podés buscar "bar calmo para estar solo". El contenido desaparece. | Búsqueda intencional por emoción. Contenido permanente y organizado. El lugar no se pierde en un feed infinito. |
| **TikTok** | Algoritmo virality-driven. Muestra lo popular, no lo relevante para vos. Mucho ruido. | Relevancia personal por gusto acumulado. Anti-viral: lo bueno para vos, no lo popular para todos. |
| **Time Out** | Editorial genérica. Listas "mejores de". No personalizada. | Personalización sin esfuerzo explícito. No "los 10 mejores bares" — "los 3 bares que encajan con cómo te sentís hoy". |

### Tu jugada estratégica más fuerte:

**Ser la app que reemplaza la pregunta "¿conocés algún lugar lindo para [contexto]?" que hoy se resuelve por WhatsApp.**

Hoy la gente pregunta a amigos. El amigo con buen gusto es tu competidor real. Korantis debería ser ese amigo escalado: alguien que conoce la ciudad, entiende tu mood, y te da 2-3 opciones perfectas, no 47 resultados rankeados.

---

## Resumen ejecutivo: Mantener / Mejorar / Eliminar / Construir después

### ✅ MANTENER
- Identidad visual (paleta, tipografía, tono premium)
- Tagline "Lugares para cómo querés sentirte"
- Cards con foto + descripción corta + mood tags
- Ficha de lugar con "Momentos del día"
- Mood tags como taxonomía propia
- Atlas como concepto de mapa personal
- Narrativa editorial por lugar (en la ficha, no en el feed)

### ⚡ MEJORAR
- Reducir hero de Explore (menos espacio decorativo, más contenido visible)
- Hacer filtrado por mood interactivo y prominente (pills clicables, no solo tags pasivos)
- Agregar bottom tab bar persistente
- Simplificar lenguaje en Taste (eliminar jerga)
- Hacer la card del feed más scaneable (1 línea de texto + tags, la prosa va adentro)
- Mostrar más lugares (volumen percibido)
- Ficha de lugar: poner CTA de "Guardar" y "Cómo llegar" arriba, no al final
- Empty states que inviten a actuar, no que muestren zeros

### 🗑️ ELIMINAR (para MVP)
- El Oráculo (vuelve en v2)
- Lecturas de gusto textuales
- Porcentajes de compatibilidad sin data
- Gráfico radar sin historial
- "Afinidades circadianas"
- Selector de idioma en pantalla principal
- Métricas vacías visibles

### 🔮 CONSTRUIR DESPUÉS
- Onboarding personalizado (mes 2)
- Colecciones editables (mes 2)
- Perfil de gusto con data real (mes 2-3)
- Oráculo simplificado (mes 3)
- Social layer: compartir colecciones (mes 3-4)
- NYC como segunda ciudad completa (mes 2-3)
- Push notifications contextuales (mes 2)
- Content pipeline escalable con AI + editor (mes 1-2, en paralelo)

---

## Una nota final sobre identidad

Korantis tiene algo que el 99% de los productos en este espacio no tiene: **un punto de vista**. No es neutral, no es crowd-sourced, no democratiza la opinión. Es editorializado, atmosférico y unapologetically subjetivo. Eso es tu foso competitivo, no tu tech, no tu data. 

El riesgo es que ese punto de vista se vuelva pretencioso o incomprensible. La línea entre "sofisticado" y "esnob" es finísima. Mantené la atmósfera, bajá la abstracción lingüística un 30%, y asegurate de que cada decisión de UX responda una pregunta simple: **¿esto ayuda al usuario a decidir adónde ir esta noche?**

Si la respuesta es no, sacalo del MVP.
User: Korantis es una app de descubrimiento emocional de cafés, bares y restaurantes para Buenos Aires y New York. No queremos ser otro Google Maps ni otro TripAdvisor. Queremos que el usuario encuentre lugares por mood, momento del día, energía, estética, intención social y contexto.

Analizá si el concepto es suficientemente claro, diferenciable y defendible. Decime:
1. Qué problema real resuelve.
2. Qué no debería intentar resolver.
3. Qué promesa central debería comunicar.
4. Qué riesgos de producto ves.
5. Qué parte del concepto es más fuerte comercialmente.
6. Qué parte es humo o demasiado abstracta.
Model: # Análisis Estratégico del Concepto Korantis

---

## 1. Qué problema real resuelve

### El problema concreto:

**"Sé que quiero salir, sé cómo me quiero sentir, pero no sé adónde ir."**

Este es un problema real, cotidiano y mal resuelto por las herramientas actuales. Desagregado:

**Problema A: La parálisis de elección contextual.**
Google Maps me da 200 resultados por "bar en Palermo". Instagram me muestra lo que el algoritmo viral empuja. Ninguno me pregunta: ¿querés estar solo o acompañado? ¿Querés ruido o silencio? ¿Es una primera cita o un viernes con amigos?

**Problema B: La información existente no tiene capa emocional ni temporal.**
Un rating de 4.3 estrellas no me dice si el lugar es bueno a las 11am o a las 11pm. No me dice si es para trabajar o para romancear. No me dice si la energía es de "conversación íntima" o "levantar la voz para que te escuchen".

**Problema C: El descubrimiento actual depende de capital social.**
Hoy, encontrar un buen lugar = conocer a alguien que ya fue y que tiene gusto compatible con el tuyo. Si sos nuevo en una ciudad, no tenés esa red, no descubrís nada. Si tus amigos tienen gustos distintos, sus recomendaciones no sirven.

**Problema D: La recomendación algorítmica actual es popularity-driven, no relevance-driven.**
Lo que Google, TikTok e Instagram recomiendan es lo popular, lo nuevo, lo sponsoreado. No lo relevante *para vos, ahora, en este estado emocional.*

### Validación del problema:

- La pregunta "¿conocés algún lugar para [contexto específico]?" se hace millones de veces por día en WhatsApp, y se resuelve mal (una persona da una respuesta, sesgada por su última visita).
- Los food bloggers en Instagram explotan precisamente porque llenan este gap de curación — pero su contenido es efímero, no buscable, no filtrable.
- Los grupos de "recomendaciones gastronómicas" en Facebook/Telegram tienen cientos de miles de miembros justamente porque la necesidad existe y ninguna plataforma la resuelve bien.

---

## 2. Qué NO debería intentar resolver

| No resolver | Por qué |
|------------|---------|
| **Reservas** | Eso es OpenTable/Resy. Meterte ahí te distrae del core y requiere integraciones complejas. Linkeá a la reserva externa si existe, pero no la gestiones. |
| **Reviews de usuarios** | El momento en que abrís reviews crowd-sourced, te convertís en Yelp. Tu valor es la curación editorial, no la opinión democrática. Las masas no curan, promedian. |
| **Delivery / menú digital** | Eso es Rappi/PedidosYa/Uber Eats. No tiene nada que ver con descubrimiento emocional. |
| **Ser guía turística** | El turista puede usarte, pero si diseñás para turistas perdés la autenticidad local que es tu ventaja. El turista ya tiene TripAdvisor/Google. |
| **Ser red social** | No followers, no feeds de amigos, no comments. El social layer debería ser mínimo: compartir un lugar o una lista. No crear una comunidad dentro de la app. |
| **Cubrir todas las categorías** | No intentes sumar hoteles, tiendas, museos, experiencias. Cafés, bares y restaurantes. Punto. Esa restricción es tu foco. |
| **Rating o ranking numérico** | Nada de estrellas, puntajes, "top 10". Tu valor es contexto, no jerarquía. Un lugar no es "mejor" que otro — es mejor *para vos, ahora*. |
| **Precisión informacional completa** | No intentes tener los horarios actualizados al minuto ni el menú completo. Eso es Google. Tu ficha es atmosférica y orientativa. Si el usuario quiere el menú detallado, linkeá afuera. |

### La regla de oro:

**Si la respuesta no involucra emoción, contexto o momento, no es tu territorio.**

---

## 3. Qué promesa central debería comunicar

### La promesa en una oración:

> **"Korantis te dice adónde ir basándose en cómo te querés sentir."**

### Desglose de la promesa:

| Componente | Qué comunica |
|-----------|-------------|
| "Te dice" | Es prescriptivo, no democrático. No te da 200 opciones — te da 3 buenas. |
| "Adónde ir" | Acción concreta. No es inspiración pasiva, es decisión. |
| "Basándose en" | Hay un criterio detrás. No es random, no es popular, es relevante. |
| "Cómo te querés sentir" | El input es emocional, no funcional. No buscás "pizza", buscás "lugar tranquilo donde la comida no sea lo central". |

### Lo que la promesa NO es:

- No es "descubrí los mejores lugares" (eso es jerárquico).
- No es "encontrá restaurantes cerca" (eso es geográfico-funcional).
- No es "lee reviews reales" (eso es crowd-sourced).
- No es "mirá qué lugar hermoso" (eso es Instagram).

### Variaciones de comunicación:

- **Para la home:** "Lugares para cómo querés sentirte" ← ya lo tenés, funciona perfecto.
- **Para App Store:** "Descubrí cafés, bares y restaurantes por mood, momento y energía."
- **Para pitch:** "Somos el Spotify del descubrimiento urbano: no ordenamos por popularidad sino por resonancia personal."
- **Para prensa:** "La app que reemplaza preguntar por WhatsApp '¿conocés algún lugar lindo para...?'"

---

## 4. Qué riesgos de producto veo

### Riesgo 1: El cold start problem emocional
**Descripción:** Para recomendar por mood/gusto, necesitás data del usuario. Pero el usuario no te da data hasta que le des valor. Y no le podés dar valor personalizado sin data.
**Gravedad:** Alta.
**Mitigación:** El feed por defecto debe funcionar SIN personalización. Que los filtros de mood sean explícitos (el usuario elige "Calmo" manualmente) y la personalización algorítmica venga después, pasivamente, sin pedir nada.

### Riesgo 2: El contenido no escala artesanalmente
**Descripción:** Cada ficha de lugar tiene prosa editorial, análisis por momento del día, mood tags curados. Eso no se genera en batch. A 30 minutos por ficha, 200 fichas = 100 horas de trabajo editorial.
**Gravedad:** Alta.
**Mitigación:** Pipeline híbrido. AI genera draft completo (descripción, mood tags sugeridos, momentos del día inferidos desde reviews existentes). Editor humano valida, ajusta tono, aprueba. Ratio: 5-7 minutos por ficha en vez de 30.

### Riesgo 3: El mood es subjetivo y no repetible
**Descripción:** "Calmo" para vos puede ser un bar con jazz. Para mí puede ser silencio total. Si tagueo un lugar como "calmo" y el usuario va y está lleno de gente un viernes a las 23hs, pierde confianza en el sistema.
**Gravedad:** Media-alta.
**Mitigación:** Mood tags vinculados a momento del día. "Calmo" no es un atributo absoluto del lugar, es condicional: "Calmo por la mañana, social por la noche". Ya lo hacés con "Momentos del día" — eso es correcto. Asegurate de que los mood tags en el feed reflejen la franja horaria actual del usuario.

### Riesgo 4: No hay razón para volver mañana
**Descripción:** Sin contenido nuevo frecuente, sin notificaciones relevantes, sin loop de uso, la app se usa una vez y se olvida. Day-1 retention en apps de descubrimiento es brutal (sub-20% es normal).
**Gravedad:** Alta.
**Mitigación:** Frecuencia editorial mínima: 3-5 lugares nuevos por semana. Push contextual: "Es viernes 20hs — 2 bares nocturnos nuevos en tu zona". El guardado como loop: "Tu lista creció → explorá los nuevos que coinciden".

### Riesgo 5: La categoría no existe y hay que educar
**Descripción:** "Búsqueda por mood" no es un comportamiento aprendido. Nadie abre una app pensando "voy a buscar por energía emocional". Es un hábito que hay que crear.
**Gravedad:** Media.
**Mitigación:** No dependas del mood como ÚNICO entry point. Los filtros de categoría (café, bar, restaurante) y zona deben coexistir. El mood es la capa extra, no la barrera de entrada. El usuario puede llegar por "bares en Palermo" y DESCUBRIR que puede filtrar por "íntimo" una vez adentro.

### Riesgo 6: Dos ciudades, ninguna densa
**Descripción:** Buenos Aires y NYC son mercados muy distintos en idioma, cultura, competencia y densidad de oferta. Dividir esfuerzos tempranamente puede resultar en dos catálogos incompletos.
**Gravedad:** Media.
**Mitigación:** 1 ciudad primero con densidad matadora (100+ lugares). La segunda ciudad es validación de escalabilidad, no crecimiento real. Recomiendo BA primero porque tenés acceso, contexto cultural y menos competencia que NYC.

### Riesgo 7: La estética ahuyenta antes de demostrar valor
**Descripción:** La identidad visual oscura + dorada + serif es hermosa pero puede comunicar "esto es exclusivo/caro/pretencioso" a un usuario que solo quiere saber dónde tomar un cortado tranquilo.
**Gravedad:** Baja-media.
**Mitigación:** Incluir lugares accesibles (no solo rooftop bars y speakeasies) desde el inicio. Que el primer lugar que vea un usuario nuevo pueda ser un café de barrio con buena luz, no solo un cocktail bar premium.

---

## 5. Qué parte del concepto es más fuerte comercialmente

### A) La curación por momento del día + mood como servicio B2B

**Oportunidad:** Hoteles boutique, edificios de co-living, servicios de concierge, apps de dating (para sugerir dónde ir), aerolíneas, tarjetas de crédito premium.

"Integrá Korantis en tu producto y tus usuarios sabrán adónde ir según su mood" — eso es un API/partnership que monetiza sin cobrar al usuario final.

### B) El lugar paga por visibilidad contextual (no por publicidad genérica)

**Oportunidad:** Un bar no paga por un banner. Paga porque cuando alguien busca "lugar íntimo para cita un jueves a las 21hs", su bar aparezca primero. Eso es publicidad ultra-segmentada por contexto emocional — y vale más que un click en Google Ads porque la intención de compra es altísima y ultra-específica.

**Modelo:** "Promové tu lugar cuando coincida con el mood del usuario." No es spam, es relevancia aumentada. El usuario no lo percibe como publicidad si el lugar realmente encaja.

### C) Las listas curadas como contenido distribuible

**Oportunidad:** "Los 5 bares más calmos de Palermo para ir solo" — eso es un artículo que se comparte en Instagram, que trae tráfico, que posiciona en SEO, que se puede embedear en newsletters de terceros. Es top-of-funnel gratuito.

### D) Versión premium con personalización avanzada

**Oportunidad:** Free = feed general con filtros de mood. Premium = personalización automática, acceso a listas exclusivas, alertas de nuevos lugares que matchean tu perfil, acceso temprano a nuevas ciudades.

### Lo más fuerte comercialmente:

**El modelo B (promoted placement contextual) es el más fuerte** porque:
- No requiere que el usuario pague.
- Escala con el catálogo.
- Es naturalmente no-intrusivo (el lugar ya debería estar ahí si el mood coincide).
- Los venues NECESITAN este canal (están cansados de pagar Google Ads y Rappi).
- El valor para el venue es medible (visitas al perfil, "cómo llegar" clicks, guardados).

---

## 6. Qué parte es humo o demasiado abstracta

### 🚨 Humo claro:

**"Perfil latente" / "Descubrimiento implícito"**
Esto es lenguaje de producto interno que se filtró al usuario. Un "perfil latente" es un concepto válido de ML (embeddings de preferencia inferidos del comportamiento). Pero comunicarlo así al usuario no genera valor — genera confusión o desconfianza. 

**Alternativa:** No le digas al usuario que tiene un perfil. Solo mostrá mejores resultados con el tiempo y que se dé cuenta solo. Spotify no te dice "tu embedding vectorial cambió". Te dice "Descubrimiento Semanal" y te da canciones nuevas que te gustan.

---

**"Afinidades circadianas"**
Nadie usa esta palabra en la vida real. Lo que estás diciendo es "a qué hora del día disfrutás más salir". 

**Alternativa:** "Tus mejores momentos" o "Cuándo disfrutás más".

---

**"Resonancia" como métrica de ranking**
"Lugares ordenados por resonancia, memoria y proximidad" — "resonancia" aquí es una metáfora que no se traduce en utilidad percibida. ¿Qué es resonancia? ¿Cómo sé si un lugar "resuena" conmigo si nunca fui?

**Alternativa:** "Lugares que encajan con tu gusto" o simplemente no explicar el criterio y que los resultados hablen solos. Google no te dice "ordenado por PageRank y 200 señales de ML". Te dice "Resultados" y confiás.

---

**"Coordenadas de gusto"**
Como naming de sección es poético y aceptable. Pero si esperás que el usuario entienda qué es, necesita un subtítulo funcional: "Así entendemos lo que te gusta" o "Tu perfil de preferencias".

---

**El Oráculo como feature**
La idea de calibrar gusto via swipe es válida (Tinder lo probó, Spotify usa playlists exploratorias). Pero llamarlo "Oráculo" y pedir "deslizá suavemente para enseñarle a Korantis qué se siente bien" es demasiado poético para una interacción que debería ser obvia. Si tengo que interpretar la instrucción, ya perdiste.

**Alternativa para v2:** "¿Esto te gusta?" + card de lugar + Sí/No. Punto. Sin misticismo.

---

### La línea entre atmósfera y humo:

| Aceptable (atmósfera) | Problemático (humo) |
|----------------------|-------------------|
| "Lugares para cómo querés sentirte" | "Perfil latente a través del descubrimiento implícito" |
| Mood tags (Calmo, Social, Íntimo) | "Afinidades circadianas" |
| "Atlas" como nombre de sección de mapa | "Resonancia" como criterio de orden explicado al usuario |
| Descripciones poéticas DE los lugares | Descripciones poéticas del SISTEMA y cómo funciona |
| Tono editorial sofisticado | Jerga de producto disfrazada de copy |

### La regla:

**Sé poético sobre los lugares. Sé claro sobre la app.**

El usuario acepta (y disfruta) que le describas un bar como "bañado en luz dorada con un murmullo social de fondo". No acepta que le describas la app como "un sistema de resonancia emocional basado en señales circadianas latentes". 

Lo primero es atmósfera. Lo segundo es un pitch deck mal puesto en una UI.

---

## Síntesis final

| Dimensión | Evaluación |
|-----------|-----------|
| **Claridad** | 7/10 — La home es clara. Las pantallas secundarias no. |
| **Diferenciabilidad** | 9/10 — No hay nada parecido en el mercado. El positioning es único. |
| **Defendibilidad** | 6/10 — El foso es editorial + data de preferencia. Ambos requieren tiempo y volumen. Sin eso, un clon con más plata te copia en 3 meses. |
| **Problema real** | 8/10 — Sí existe. Lo resuelven mal WhatsApp + Instagram + amigos. |
| **Viabilidad comercial** | 7/10 — El modelo de promoted contextual placement es sólido pero requiere volumen de usuarios primero. |
| **Riesgo de abstractez** | Alto — La parte más peligrosa no es el concepto, es la comunicación del concepto. La idea es buena. Las palabras que usan para explicarla al usuario a veces la oscurecen. |

### El concepto es fuerte. La ejecución comunicacional necesita un filtro de "¿mi mamá entiende esto?" aplicado a toda UI copy que no sea descripción de lugar.
User: Estoy diseñando Korantis. Dudo entre una home con hero editorial y search bar arriba, versus una home directa tipo Spotify/Pinterest: cards, carruseles horizontales, categorías, moods y descubrimiento visual desde el primer segundo.

El producto es una app/web mobile-first para descubrir bares, cafés y restaurantes por mood. Quiero que se sienta premium, rápida, emocional y útil.

Analizá profundamente:
1. Qué opción conviene para retención.
2. Qué opción conviene para claridad del producto.
3. Qué opción conviene para mobile.
4. Qué opción se parece menos a una landing y más a una app.
5. Qué debería ver el usuario en los primeros 5 segundos.
6. Proponé una estructura final de home.
Model: # Análisis de Home: Hero Editorial vs. Feed Directo

---

## 1. Qué opción conviene para retención

### Gana: Feed directo (tipo Spotify/Pinterest)

**Por qué:**

La retención se construye sobre un principio: **cada vez que abro la app, hay algo nuevo y relevante que ver.**

Un hero editorial es estático. Si vuelvo mañana y veo el mismo hero con el mismo tagline y la misma search bar vacía, mi cerebro registra "nada cambió" y cierra. No hay recompensa variable.

Un feed de cards, carruseles y secciones dinámicas me da:
- **Variabilidad:** La sección "Para vos ahora" cambia con la hora del día.
- **Progresión:** "Nuevos esta semana" me dice que el catálogo crece.
- **Reconocimiento:** "Porque guardaste lugares calmos" me dice que la app me conoce.
- **Exploración infinita:** Siempre puedo scrollear y encontrar algo que no vi antes.

El hero editorial funciona para **primera visita** (posicionamiento). Pero penaliza las visitas 2-50 porque ofrece la misma promesa genérica en vez de contenido fresco.

**Dato de referencia:** Spotify eliminó la home estática hace años. Cada vez que abrís, el contenido refleja tu hora, historial y contexto. Resultado: la home ES el producto, no la puerta al producto.

---

## 2. Qué opción conviene para claridad del producto

### Gana: Híbrido con inclinación al feed

**Análisis:**

El hero editorial comunica *qué es* Korantis.
El feed directo comunica *qué hace* Korantis.

Para un producto nuevo donde la categoría no existe ("descubrimiento por mood"), necesitás un mínimo de framing conceptual. Pero ese framing puede ser **una línea**, no una sección hero de 400px.

**El error del hero:** Te obliga a explicar antes de demostrar. El usuario lee "Lugares para cómo querés sentirte" → interesante → pero luego tiene que buscar activamente (¿escribo algo? ¿qué escribo? ¿scrolleo?). Hay fricción entre la promesa y la acción.

**La ventaja del feed:** MUESTRA el concepto en vez de explicarlo. Si la primera sección es una fila de pills que dicen "Calmo · Íntimo · Social · Energético" y debajo veo cards con fotos atmosféricas y mood tags, entiendo el producto sin que nadie me lo explique.

**Principio: Show > Tell. Especialmente en mobile donde el espacio es sagrado.**

La claridad máxima se logra cuando la estructura misma de la home comunica la propuesta:
- Veo moods → entiendo que busco por emoción.
- Veo "Para esta noche" → entiendo que es contextual.
- Veo fotos de atmósferas, no de platos → entiendo que no es un directorio gastronómico.

---

## 3. Qué opción conviene para mobile

### Gana: Feed directo, sin discusión

**El argumento es casi matemático:**

En una pantalla de 390x844px (iPhone 14), un hero con tagline + subtexto + search bar + espacio visual ocupa ~350-450px. Eso significa que **el primer contenido real está below the fold.** El usuario tiene que scrollear para ver un solo lugar. En mobile, eso es muerte.

**Benchmark:**

| App | Qué ves sin scrollear | Contenido real visible |
|-----|----------------------|----------------------|
| Spotify | Saludo contextual + 4-6 items recientes + primer carrusel | Sí, inmediato |
| Pinterest | Grid de pins inmediato | Sí, inmediato |
| Instagram | Stories + primer post del feed | Sí, inmediato |
| TikTok | Video fullscreen | Sí, inmediato |
| Airbnb | Search bar compacta + categorías + primer listing | Sí, inmediato |
| Google Maps | Mapa + search bar + chips de categoría | Sí, inmediato |

**Patrón universal:** Las apps mobile exitosas muestran contenido accionable sin scroll. El hero es un patrón de landing page, no de app.

**Para Korantis mobile:**
El pulgar del usuario debería poder tocar algo interesante (una card, un mood pill, un carrusel) dentro de los primeros 2 segundos sin scrollear.

---

## 4. Qué opción se parece menos a una landing y más a una app

### Gana: Feed directo

**Señales de "landing page":**
- Hero con tagline centrado
- Espacio negativo decorativo
- Una sola acción visible (search bar o CTA)
- Contenido que empieza después de scroll
- Sensación estática

**Señales de "app real":**
- Contenido dinámico visible inmediatamente
- Múltiples puntos de entrada (carruseles, pills, cards)
- Información que cambia según contexto (hora, ubicación, historial)
- Interacciones directas sin intermediarios (tap en card → ficha)
- Densidad informacional controlada pero presente
- Navegación persistente (tab bar)

**Tu home actual con hero** se siente como la página de presentación de un producto que todavía no puedo usar. Un feed directo se siente como un producto que ya estoy usando.

**La distinción clave:** Una landing te convence de usar algo. Una app te pone a usarlo directamente.

---

## 5. Qué debería ver el usuario en los primeros 5 segundos

### Sin scroll, en una pantalla mobile de 390px de ancho:

```
Segundo 0-1: Reconozco la marca y mi contexto
→ Logo + ciudad actual + hora implícita en el contenido

Segundo 1-3: Entiendo qué puedo hacer
→ Pills de mood visibles y tocables
→ Barra de búsqueda compacta (no hero, no protagonista)
→ Primer contenido real visible (al menos 1 card)

Segundo 3-5: Algo me atrae y quiero tocar
→ Una card con foto atmosférica + nombre + mood tags
→ O un carrusel temático ("Para esta noche", "Nuevos")
→ Sensación de que hay más abajo (scroll affordance)
```

### Lo que NO debería ver en los primeros 5 segundos:
- Un tagline que ya leí ayer.
- Un input vacío esperando que yo sepa qué escribir.
- Espacio decorativo que no es contenido.
- Una explicación de cómo funciona la app.

### Principio rector:
**En 5 segundos el usuario debe sentir: "Acá hay cosas interesantes para mí, ahora."**

No debe sentir: "Esto se ve lindo, pero ¿qué hago?"

---

## 6. Estructura final de home propuesta

### Arquitectura mobile (de arriba a abajo):

```
┌─────────────────────────────────────┐
│ HEADER FIJO                         │
│ [Logo KORANTIS]    [Buenos Aires ▼] │
│                                     │
│ [🔍 Buscar lugar, mood, zona...]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ MOOD PILLS (scroll horizontal)      │
│                                     │
│ [Calmo] [Íntimo] [Social]          │
│ [Energético] [Silencioso] [Dorado] │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ SECCIÓN CONTEXTUAL                  │
│ "Para esta noche" / "Tu mañana"    │
│ (cambia según hora del día)         │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │CARD 1│ │CARD 2│ │CARD 3│  →→→   │
│ │      │ │      │ │      │        │
│ │foto  │ │foto  │ │foto  │        │
│ │nombre│ │nombre│ │nombre│        │
│ │tags  │ │tags  │ │tags  │        │
│ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ SECCIÓN EDITORIAL                   │
│ "Recién sumados"                    │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ CARD VERTICAL FULL-WIDTH      │  │
│ │ [Foto atmosférica grande]     │  │
│ │ Nombre del lugar              │  │
│ │ 1 línea descriptiva           │  │
│ │ [Calmo] [Dorado] [Noche]     │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ CARD VERTICAL FULL-WIDTH      │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ CARRUSEL: "Para estar solo"         │
│ (basado en mood o interés)          │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→   │
│ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ CARRUSEL: "Citas sin ruido"         │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→   │
│ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ SECCIÓN: "Explorá por zona"         │
│                                     │
│ [Palermo] [San Telmo] [Recoleta]   │
│ [Colegiales] [Villa Crespo]        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ BOTTOM TAB BAR FIJA                 │
│                                     │
│ [Explore] [Atlas] [Guardados] [Vos]│
└─────────────────────────────────────┘
```

---

### Desglose y justificación de cada bloque:

#### Header (fijo, ~60px)
- Logo mínimo (no completo, solo ícono o wordmark compacto).
- Selector de ciudad.
- Search bar **compacta** (un input, no un hero). Tappable → se expande a pantalla de búsqueda fullscreen con sugerencias.
- **No es el protagonista. Es una herramienta siempre accesible.**

#### Mood Pills (sticky o scrollable, ~50px)
- Scroll horizontal de mood tags interactivos.
- Tap en uno → filtra todo el feed debajo instantáneamente.
- Es tu **diferencial convertido en interacción**. Esto es lo que ningún competidor tiene.
- Visualmente: píldoras con borde dorado, fondo oscuro, tipografía pequeña y elegante.
- Pueden incluir un ícono sutil (opcional) para reforzar significado.

#### Sección contextual (~200px con carrusel)
- **Título dinámico basado en hora:**
  - 7-11am: "Para tu mañana"
  - 11-14: "Un mediodía con calma"
  - 14-18: "Tu tarde"
  - 18-21: "Para esta noche"
  - 21-02: "Noche abierta"
- Carrusel horizontal de cards chicas (thumbnail + nombre + 1-2 tags).
- **Esto comunica contextualidad sin explicarla.** El usuario ve que la app "sabe" qué hora es.

#### Sección editorial (cards full-width, scroll vertical)
- Cards grandes con foto prominente.
- Formato vertical, una debajo de otra.
- **Esto es donde brilla la identidad visual.** Fotos grandes, atmosféricas, bien curadas.
- Texto mínimo: nombre + 1 línea + tags. No párrafos.
- **Estas son las que el usuario va a guardar.**

#### Carruseles temáticos (curación editorial)
- "Para estar solo" / "Citas sin ruido" / "Donde nadie te apura" / "Viernes con amigos"
- Son listas curadas por el equipo editorial.
- **Dan razones para scrollear** más allá de la primera sección.
- **Dan vocabulario al usuario** sobre cómo pensar los lugares (educación de categoría).
- Se pueden rotar semanalmente para frescura.

#### Zona como filtro secundario
- Pills de barrio/zona al final del feed para quienes buscan por ubicación.
- **No es el entry point principal** pero existe para quienes piensan geográficamente.

#### Bottom Tab Bar (fija, siempre visible, ~50px)
- 4 ítems: Explore / Atlas / Guardados / Perfil.
- Íconos claros + labels.
- **Imprescindible para UX mobile.** Sin esto no hay navegación predecible.

---

### Lo que esta estructura logra:

| Objetivo | Cómo lo logra |
|----------|--------------|
| Claridad del producto | Los mood pills + sección contextual demuestran el concepto sin explicarlo |
| Retención | Contenido cambia por hora, por semana, por historial |
| Velocidad en mobile | Contenido real visible sin scroll |
| Premium/emocional | Fotos grandes, paleta oscura/dorada, tipografía serif en títulos |
| Utilidad | Filtros funcionales (mood, zona, hora) accesibles siempre |
| App vs. landing | Densidad de contenido interactivo, nav persistente, dinamismo |

---

### Lo que esta estructura NO tiene (intencionalmente):

- ❌ Hero editorial con tagline grande
- ❌ Espacio vacío decorativo
- ❌ Explicación de cómo funciona la app
- ❌ Un solo input como punto de entrada
- ❌ Contenido estático que no cambia entre visitas

---

## Nota sobre el hero para primer uso

**Excepción válida:** Para el **primerísimo ingreso** de un usuario nuevo (antes de cualquier interacción), podés mostrar un overlay o splash contextual de 1 pantalla:

```
"Korantis te muestra lugares por cómo te querés sentir.
Explorá por mood, momento o zona."

[Empezar a explorar]
```

Esto desaparece después del primer tap y nunca vuelve. Es onboarding de 3 segundos, no un hero permanente.

Después de ese momento, el usuario siempre ve el feed directo. La marca se comunica a través del contenido, no a través de un billboard interno.

---

## Veredicto final

| Criterio | Hero editorial | Feed directo | Ganador |
|----------|---------------|-------------|---------|
| Retención | ❌ Estático | ✅ Dinámico | Feed |
| Claridad | ⚠️ Explica pero no muestra | ✅ Muestra sin explicar | Feed |
| Mobile | ❌ Desperdicia viewport | ✅ Contenido inmediato | Feed |
| Sensación de app | ❌ Parece landing | ✅ Parece producto vivo | Feed |
| Branding premium | ✅ Muy fuerte visualmente | ⚠️ Requiere diseño cuidadoso | Empate* |

*El feed directo puede ser igual de premium si las cards, tipografía y fotos mantienen el nivel estético. Premium no es "espacio vacío". Premium es "cada pixel tiene intención y calidad".

**Recomendación definitiva: Feed directo con framing mínimo.** El tagline vive en el App Store, en la meta description, en el onboarding de primer uso. La home vive para mostrar contenido, no para vender la idea.
User: Diseñá un sistema de clasificación emocional para lugares gastronómicos. Korantis clasifica bares, cafés y restaurantes según mood, energía, momento del día, ocasión, estética, ruido, intimidad, tipo de público, iluminación, música y contexto urbano.

Necesito:
1. Taxonomía principal de moods.
2. Variables observables para puntuar cada lugar.
3. Escala de scoring de 0 a 5.
4. Cómo evitar clasificaciones subjetivas inconsistentes.
5. Cómo combinar datos humanos, reseñas, fotos e interacción del usuario.
6. Ejemplo aplicado a 5 tipos de lugares.
Model: # Sistema de Clasificación Emocional Korantis

## Arquitectura Taxonómica Completa

---

## 1. Taxonomía Principal de Moods

### Estructura: 3 capas

**Capa 1: Moods Primarios (8)**
Son los que el usuario ve, toca y filtra. Mutuamente comprensibles, no mutuamente excluyentes (un lugar puede tener 2-3 moods primarios).

| Mood Primario | Definición operativa | Emoción del usuario |
|---------------|---------------------|-------------------|
| **Calmo** | Ritmo lento, sin presión temporal, silencio relativo | Quiero desacelerar |
| **Íntimo** | Escala reducida, proximidad, luz baja, conversación posible en voz baja | Quiero conectar con alguien |
| **Social** | Energía grupal, ruido aceptable, movimiento, interacción con desconocidos posible | Quiero estar entre gente |
| **Energético** | Ritmo alto, música presente, movimiento corporal, estímulo sensorial | Quiero activarme |
| **Refugio** | Aislamiento del exterior, sensación de burbuja, protección | Quiero esconderme del mundo |
| **Contemplativo** | Visual interesante (vista, diseño, naturaleza), invita a observar | Quiero mirar y pensar |
| **Productivo** | Condiciones para trabajar/leer: wifi, enchufes, no te apuran, ruido blanco | Quiero hacer algo mientras estoy ahí |
| **Celebratorio** | Festejo, abundancia, permiso para exceso, atmósfera de ocasión especial | Quiero marcar un momento |

---

**Capa 2: Atributos Atmosféricos (15)**
Son las variables medibles/observables que COMPONEN los moods. No se muestran al usuario como filtros primarios, pero alimentan el scoring y aparecen en la ficha del lugar como detalle.

| Atributo | Espectro | Escala |
|----------|----------|--------|
| **Volumen ambiental** | Silencio → Bullicio | 0-5 |
| **Densidad de gente** | Vacío → Lleno | 0-5 |
| **Velocidad de rotación** | Te quedás horas → Te apuran | 0-5 |
| **Luminosidad** | Penumbra → Bien iluminado | 0-5 |
| **Temperatura cromática** | Cálido (dorado/ámbar) → Frío (blanco/azul) | 0-5 |
| **Presencia musical** | Sin música → Música dominante | 0-5 |
| **Tipo de música** | Categórica: ninguna / ambient / jazz / electrónica / rock / playlist pop / en vivo |
| **Escala del espacio** | Pequeño (≤10 mesas) → Grande (≥40 mesas) | 0-5 |
| **Ratio bar/mesa** | Solo mesas → Solo barra → Mixto | Categórica |
| **Visibilidad exterior** | Cerrado/sin ventanas → Totalmente abierto/terraza | 0-5 |
| **Calidad del asiento** | Banqueta incómoda → Sillón/sofá | 0-5 |
| **Intervención de diseño** | Sin intención estética → Altamente diseñado | 0-5 |
| **Conectividad** | Sin wifi ni enchufes → Wifi rápido + enchufes accesibles | 0-5 |
| **Atención del staff** | Te ignoran → Atención constante | 0-5 |
| **Permeabilidad urbana** | Aislado de la calle → Integrado con la vereda/ciudad | 0-5 |

---

**Capa 3: Contextos de Uso (Ocasiones)**
Son las situaciones para las que el lugar es apropiado. Se asignan como tags binarios (sí/no) con peso de confianza.

| Contexto | Ejemplo |
|----------|---------|
| Primera cita | Luz baja, íntimo, no ruidoso, estético |
| Trabajar solo | Wifi, no te apuran, ruido bajo, enchufes |
| Grupo de amigos (4-8) | Mesas grandes, social, no necesitás reserva o es fácil |
| Reunión laboral | Ambiente neutro, no ruidoso, buena iluminación |
| Salida nocturna | Energético, bar, música, noche |
| Estar solo sin tristeza | Calmo, contemplativo, barra posible, no incómodo solo |
| Impresionar a alguien | Diseño alto, servicio bueno, estético, no mainstream |
| Desayuno/brunch lento | Mañana, calmo, buena luz, no te apuran |
| After office | Social, accesible, cerveza/vino, 18-21hs |
| Fecha especial | Celebratorio, reserva recomendada, experiencia completa |

---

## 2. Variables Observables para Puntuar Cada Lugar

### Protocolo de Observación (para clasificación editorial)

Cada lugar se evalúa en **3 franjas horarias** cuando es posible:
- **Mañana** (8-12)
- **Tarde** (12-19)
- **Noche** (19-cierre)

Un lugar puede tener scores diferentes por franja. Un café puede ser Calmo=5 a las 9am y Social=3 a las 18hs.

### Ficha de Evaluación por Lugar:

```
LUGAR: [Nombre]
EVALUADOR: [Nombre/ID]
FECHA: [DD/MM/YYYY]
FRANJA: [Mañana / Tarde / Noche]
DÍA: [L-V / Sábado / Domingo]

OBSERVACIONES DIRECTAS (en sitio):
├── Volumen ambiental: [0-5]
├── Densidad de gente: [0-5]
├── ¿Te apuran para irte?: [Sí/No/Depende]
├── Luminosidad: [0-5]
├── Temperatura de luz: [Cálida/Neutra/Fría]
├── Música: [Tipo + volumen 0-5]
├── Tamaño del espacio: [Chico/Mediano/Grande]
├── Configuración: [Mesas/Barra/Mixto/Terraza]
├── Vista al exterior: [0-5]
├── Comodidad del asiento: [0-5]
├── Nivel de diseño/estética: [0-5]
├── Wifi: [No/Lento/Rápido]
├── Enchufes: [No/Pocos/Muchos]
├── Atención staff: [0-5]
├── Relación con la calle: [Aislado/Semi/Abierto]

OBSERVACIONES DEMOGRÁFICAS:
├── Rango etario predominante: [20s/30s/40s/50+/Mix]
├── Tipo de grupos: [Solos/Parejas/Grupos/Familias/Mix]
├── Dress code percibido: [Muy casual/Casual smart/Formal]
├── Laptops visibles: [Ninguna/Algunas/Muchas]

IMPRESIÓN EMOCIONAL (del evaluador):
├── 3 palabras que describen cómo se siente estar acá:
├── ¿Para quién es este lugar?:
├── ¿Cuándo es mejor venir?:
├── ¿Volverías para qué ocasión?:
```

---

## 3. Escala de Scoring 0-5

### Definición universal de la escala:

| Score | Significado | Regla |
|-------|------------|-------|
| **0** | Ausencia total | El atributo no existe en el lugar |
| **1** | Mínima presencia | Apenas perceptible, no define la experiencia |
| **2** | Presente pero no dominante | Lo notás si prestás atención |
| **3** | Moderado / Equilibrado | Claramente presente, contribuye a la atmósfera |
| **4** | Dominante | Define significativamente la experiencia del lugar |
| **5** | Extremo / Total | Es la característica definitoria, imposible de ignorar |

### Calibración por variable (ejemplos):

#### Volumen Ambiental:
| Score | Referencia concreta |
|-------|-------------------|
| 0 | Silencio total. Escuchás el reloj. (Raro en gastro) |
| 1 | Murmullos. Podrías hablar en susurros. Biblioteca con café |
| 2 | Conversaciones en volumen bajo. Café tranquilo de mañana |
| 3 | Conversaciones normales superpuestas. Restaurant a mitad de servicio |
| 4 | Tenés que levantar la voz para que te escuchen. Bar lleno viernes noche |
| 5 | Gritás y no te escuchan. Boliche, patio cervecero con banda en vivo |

#### Luminosidad:
| Score | Referencia |
|-------|-----------|
| 0 | Prácticamente a oscuras. Solo velas o LEDs mínimos |
| 1 | Penumbra. Ves rostros pero no el menú sin linterna del celular |
| 2 | Luz baja intencional. Ambiente de speakeasy/cena romántica |
| 3 | Bien iluminado pero no agresivo. Restaurant estándar de noche |
| 4 | Mucha luz natural o artificial. Café con ventanales de día |
| 5 | Exceso de luz. Espacio todo blanco con fluorescentes |

#### Velocidad de Rotación (te apuran):
| Score | Referencia |
|-------|-----------|
| 0 | Podrías vivir ahí. Nadie te dice nada. |
| 1 | Podés quedarte 2-3 horas sin presión |
| 2 | Después de 1.5hs sentís que deberías pedir algo más |
| 3 | Servicio eficiente, esperan que comas y te vayas en ~1h |
| 4 | Te traen la cuenta sin pedirla. Miran la mesa |
| 5 | Cola afuera, te piden que liberes en 45min |

---

## 4. Cómo Evitar Clasificaciones Subjetivas Inconsistentes

### Problema:
Si 3 evaluadores distintos van al mismo bar, ¿dan scores parecidos?

### Sistema de consistencia en 5 capas:

---

### Capa 1: Anclaje con referencias concretas

Cada evaluador tiene una "tabla de referencia" de lugares ya clasificados como ancla:

```
ANCLAS DE CALIBRACIÓN (Buenos Aires):
- Silencio máximo (Volumen=1): [Café específico de referencia]
- Bullicio máximo (Volumen=5): [Bar específico de referencia]
- Penumbra total (Luz=0): [Speakeasy de referencia]
- Luz máxima (Luz=5): [Café de día de referencia]
```

Antes de evaluar un lugar nuevo, el evaluador se pregunta: "¿Tiene más o menos volumen que [ancla]?"

---

### Capa 2: Evaluación dual + promedio

Cada lugar es evaluado por **mínimo 2 personas** independientemente. Si la diferencia en cualquier variable es >1 punto, se resuelve con:
1. Discusión entre evaluadores.
2. Si no hay acuerdo, se promedia y se marca como "confianza media".
3. Si la diferencia es >2 puntos, una tercera persona evalúa.

---

### Capa 3: Variables objetivas vs. subjetivas

Separar lo que se puede medir de lo que es interpretación:

**Objetivas (baja varianza entre evaluadores):**
- Wifi: existe o no, es rápido o no → medible con speedtest
- Enchufes: contables
- Tamaño: contable en mesas
- Música: hay o no, qué tipo, a qué volumen → medible en dB con app
- Horarios: verificables
- Precio promedio: verificable con menú

**Semi-objetivas (varianza media):**
- Volumen ambiental → app de dB como backup (pero varía por hora)
- Luminosidad → app de lux como backup
- Densidad → contable en momento específico
- Tipo de público → observable pero interpretable

**Subjetivas (varianza alta):**
- "Nivel de diseño" → muy dependiente del evaluador
- "Calidad del asiento" → depende del cuerpo del evaluador
- "Impresión emocional" → inherentemente personal

**Regla:** Las variables subjetivas requieren rúbricas más estrictas y doble evaluación obligatoria.

---

### Capa 4: Peso del momento temporal

Un score NO es absoluto. Es relativo a la franja horaria. La base de datos almacena:

```
{
  lugar_id: "trade-sky-bar",
  scores: {
    mañana: { volumen: 1, densidad: 1, luz: 4, ... },
    tarde: { volumen: 3, densidad: 3, luz: 3, ... },
    noche: { volumen: 4, densidad: 5, luz: 1, ... }
  }
}
```

Cuando el usuario busca a las 22hs, ve los scores nocturnos. Cuando busca a las 9am, ve los matutinos.

---

### Capa 5: Corrección con señales de usuario

Los scores editoriales son la base. Pero se corrigen con data de uso:

- Si 80% de los usuarios que guardan un lugar como "calmo" luego no guardan otros lugares calmos → quizás no es tan calmo como lo clasificamos.
- Si muchos usuarios buscan "productivo" y abren la ficha de un lugar pero no lo guardan → quizás el score de productivo es demasiado alto.
- Si un lugar marcado como "íntimo" tiene alta tasa de guardado por usuarios que también guardan otros lugares "energéticos" → revisar clasificación.

Esto es corrección pasiva. No le pedimos al usuario que vote ni corrija. Solo observamos comportamiento.

---

## 5. Cómo Combinar Datos Humanos, Reseñas, Fotos e Interacción del Usuario

### Pipeline de 4 fuentes de señal:

```
┌─────────────────────────────────────────────────┐
│           FUENTES DE SEÑAL                       │
├──────────────┬──────────────┬──────────────┬────┤
│  Editorial   │  Reviews     │  Fotos       │User│
│  (humana)    │  (externas)  │  (análisis)  │data│
├──────────────┼──────────────┼──────────────┼────┤
│ Evaluación   │ Google Maps  │ Instagram    │Guar│
│ in-situ con  │ TripAdvisor  │ Google       │dados│
│ protocolo    │ Yelp         │ Foursquare   │Clics│
│              │ comentarios  │ Propias      │Tiempo│
│              │ de Instagram │              │Filtros│
└──────┬───────┴──────┬───────┴──────┬───────┴──┬─┘
       │              │              │           │
       ▼              ▼              ▼           ▼
┌──────────────────────────────────────────────────┐
│         PROCESAMIENTO POR FUENTE                  │
├──────────────────────────────────────────────────┤
│                                                    │
│  Editorial → Score directo (confianza: alta)       │
│  Reviews → NLP: extracción de atributos            │
│  Fotos → CV: luminosidad, color, densidad, escala  │
│  User data → Señales implícitas de corrección      │
│                                                    │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│         SCORE COMBINADO PONDERADO                 │
│                                                    │
│  Score_final = (Editorial × 0.50) +               │
│                (Reviews_NLP × 0.25) +             │
│                (Fotos_CV × 0.15) +                │
│                (User_signals × 0.10)              │
│                                                    │
│  * Pesos iniciales. Se ajustan con volumen de data │
└──────────────────────────────────────────────────┘
```

---

### Detalle por fuente:

#### A) Editorial Humana (peso: 50% inicial)

- Evaluación con protocolo estandarizado.
- Es la fuente más confiable pero menos escalable.
- Confianza: ALTA.
- Limitación: un evaluador va 1-2 veces. El lugar puede cambiar.
- **Se usa como:** Score base de publicación.

#### B) Reviews Externas – Procesamiento NLP (peso: 25%)

Extraer de reviews en Google/TripAdvisor/Yelp los atributos atmosféricos mencionados.

**Pipeline NLP:**

```
Input: "Fuimos un viernes y estaba a reventar, 
        la música muy alta, linda onda pero no 
        pudimos hablar tranquilos"

Extracción:
- volumen: alto (→ score 4)
- densidad: alta (→ score 5)
- música: presente y alta (→ score 4)
- día: viernes (→ franja noche)
- limitación mencionada: no pudieron hablar
  → mood "íntimo": bajo para noche de viernes
  → mood "social/energético": alto
```

**Prompt de extracción (para GPT/Claude como procesador):**

```
Dado este review de un bar/café/restaurante, 
extraé las siguientes variables atmosféricas 
mencionadas o inferibles:

- Volumen ambiental (0-5)
- Densidad de gente (0-5)
- Luminosidad (0-5)
- Música (tipo + volumen)
- Momento del día/semana mencionado
- Mood percibido
- Ocasión mencionada
- Aspectos positivos atmosféricos
- Aspectos negativos atmosféricos

Solo extraé lo que esté explícita o fuertemente 
implícito. Si no hay información sobre una variable, 
respondé "no mencionado".
```

**Agregación:** Con 50+ reviews procesadas, los promedios se estabilizan. Se usa la mediana, no la media (para evitar outliers).

#### C) Fotos – Computer Vision (peso: 15%)

Analizar fotos del lugar (Instagram, Google, propias) para extraer:

| Señal visual | Variable |
|-------------|----------|
| Histograma de luminosidad | → Luminosidad score |
| Temperatura de color dominante | → Cálido vs. frío |
| Cantidad de personas visibles | → Densidad aproximada |
| Ratio espacio vacío/ocupado | → Escala del espacio |
| Presencia de elementos decorativos | → Nivel de diseño |
| Dominancia de materiales (madera, concreto, plantas) | → Estética categórica |
| Proporción de luz natural vs. artificial | → Tipo de iluminación |

**Herramientas:** Google Vision API, CLIP embeddings para clasificación de estilo, histogramas de color con OpenCV.

**Limitación:** Las fotos de Instagram están filtradas y no representan la realidad. Ponderar fotos de Google Street View interior y fotos editoriales propias más alto que fotos de usuarios.

#### D) Señales de Usuario (peso: 10% inicial, crece con volumen)

| Señal | Qué infiere |
|-------|------------|
| Guardados | Preferencia explícita |
| Tiempo en ficha (>15s) | Interés real |
| Tap en "Cómo llegar" | Intención de visita |
| Filtro usado → lugar abierto | Asociación mood-lugar validada |
| Lugar guardado pero nunca "cómo llegar" | Aspiracional, no accionable |
| Combinación de guardados de un usuario | Perfil de gusto (embedding) |

**Uso:**
- Si muchos usuarios con perfil "calmo" guardan un lugar que clasificamos como "social" → revisar.
- Si un lugar tiene alta tasa de apertura desde filtro "íntimo" pero baja tasa de guardado → no cumple la promesa de íntimo.

---

### Confianza del Score:

Cada score tiene un valor de confianza:

```
Confianza = f(fuentes_disponibles, concordancia, volumen)

- Solo editorial, 1 visita: confianza 0.6
- Editorial + 50 reviews procesadas: confianza 0.8
- Editorial + reviews + fotos + user signals: confianza 0.95
```

Si la confianza es <0.7, el lugar se muestra pero con indicador visual sutil de "clasificación preliminar" (o simplemente se rankea más abajo en el feed).

---

## 6. Ejemplo Aplicado a 5 Tipos de Lugares

---

### Lugar 1: Speakeasy íntimo (Florería Atlántico, BA)

**Evaluación:**

| Variable | Mañana | Tarde | Noche |
|----------|--------|-------|-------|
| Volumen ambiental | — | 2 | 4 |
| Densidad | — | 2 | 5 |
| Rotación | — | 1 | 3 |
| Luminosidad | — | 1 | 1 |
| Temp. cromática | — | Cálida | Cálida |
| Música | — | Jazz low (2) | Electrónica soft (3) |
| Escala | — | Mediano | Mediano |
| Config. | — | Barra + mesas | Barra + mesas |
| Vista exterior | — | 0 (subterráneo) | 0 |
| Asiento | — | 3 | 3 |
| Diseño | — | 5 | 5 |
| Wifi | — | No | No |
| Staff | — | 4 | 3 |
| Permeabilidad | — | 0 (puerta oculta) | 0 |

**Moods asignados:**
- Tarde: Refugio (5), Íntimo (4), Contemplativo (3)
- Noche temprana: Íntimo (4), Social (3), Celebratorio (3)
- Noche avanzada: Social (4), Energético (3), Celebratorio (4)

**Ocasiones:** Primera cita ✓ | Impresionar a alguien ✓ | Fecha especial ✓ | Estar solo sin tristeza ✓ (en barra, tarde) | Grupo de amigos ✓ (noche)

**Descripción editorial:**
"Bajás por una florería que ya cerró. Al fondo, una escalera. Abajo, un mundo de penumbra dorada, cócteles que no necesitan nombre y una barra donde el silencio se siente elegante. De noche se llena y la energía sube, pero a las 19hs es un refugio subterráneo perfecto para hablar en voz baja."

---

### Lugar 2: Café de especialidad minimalista (Cuervo Café, BA)

**Evaluación:**

| Variable | Mañana | Tarde | Noche |
|----------|--------|-------|-------|
| Volumen | 1 | 2 | — |
| Densidad | 2 | 3 | — |
| Rotación | 0 | 1 | — |
| Luminosidad | 4 | 4 | — |
| Temp. cromática | Neutra-cálida | Neutra-cálida | — |
| Música | Ambient (1) | Ambient (1) | — |
| Escala | Chico (6 mesas) | Chico | — |
| Config. | Mesas + barra | Mesas + barra | — |
| Vista exterior | 3 (ventanal) | 3 | — |
| Asiento | 3 | 3 | — |
| Diseño | 4 | 4 | — |
| Wifi | Rápido (5) | Rápido (5) | — |
| Enchufes | 3 (algunos) | 3 | — |
| Staff | 3 | 3 | — |
| Permeabilidad | 3 | 3 | — |

**Moods asignados:**
- Mañana: Productivo (5), Calmo (5), Contemplativo (3)
- Tarde: Productivo (4), Calmo (4), Social (2)

**Ocasiones:** Trabajar solo ✓✓✓ | Estar solo sin tristeza ✓ | Desayuno lento ✓ | Reunión laboral informal ✓

**Descripción editorial:**
"Seis mesas, luz limpia que entra por un ventanal amplio, el sonido del molinillo como único puncto de ruido. Nadie te mira, nadie te apura. El wifi vuela. Si necesitás tres horas con tu laptop y un filtrado de Etiopía, esto es tu oficina sin oficina."

---

### Lugar 3: Patio cervecero ruidoso (On Tap, BA)

**Evaluación:**

| Variable | Mañana | Tarde | Noche |
|----------|--------|-------|-------|
| Volumen | — | 3 | 5 |
| Densidad | — | 3 | 5 |
| Rotación | — | 1 | 2 |
| Luminosidad | — | 5 (patio) | 3 (luces string) |
| Temp. cromática | — | Natural | Cálida |
| Música | — | Rock/indie (3) | Rock/indie (4) |
| Escala | — | Grande | Grande |
| Config. | — | Mesas largas + banquetas | Mesas largas + barra |
| Vista exterior | — | 5 (patio abierto) | 4 |
| Asiento | — | 2 (bancos compartidos) | 2 |
| Diseño | — | 2 (industrial simple) | 2 |
| Wifi | — | No | No |
| Staff | — | 2 (autoservicio parcial) | 2 |
| Permeabilidad | — | 5 (al aire libre) | 4 |

**Moods asignados:**
- Tarde: Social (4), Energético (3), Celebratorio (2)
- Noche: Energético (5), Social (5), Celebratorio (4)

**Ocasiones:** Grupo de amigos ✓✓✓ | After office ✓✓ | Salida nocturna ✓ | Celebrar informal ✓

**Descripción editorial:**
"Levantás la voz y no importa. La mesa es larga, compartida, y el tipo de al lado termina brindando con vos. 30 canillas, patio al cielo, y una energía de viernes que aparece también los martes. No vengas a hablar de sentimientos — vení a reírte fuerte."

---

### Lugar 4: Restaurante de hotel con terraza (Aramburu, BA)

**Evaluación:**

| Variable | Mañana | Tarde | Noche |
|----------|--------|-------|-------|
| Volumen | — | — | 2 |
| Densidad | — | — | 3 |
| Rotación | — | — | 2 |
| Luminosidad | — | — | 2 |
| Temp. cromática | — | — | Cálida |
| Música | — | — | Ninguna o ambient (1) |
| Escala | — | — | Mediano-chico (12 mesas) |
| Config. | — | — | Mesas individuales |
| Vista exterior | — | — | 2 (cerrado, jardín interior) |
| Asiento | — | — | 5 (sillas tapizadas, espacio) |
| Diseño | — | — | 5 |
| Wifi | — | — | No relevante |
| Staff | — | — | 5 (servicio impecable) |
| Permeabilidad | — | — | 1 (mundo aparte) |

**Moods asignados:**
- Noche: Íntimo (5), Contemplativo (4), Celebratorio (5), Refugio (3)

**Ocasiones:** Fecha especial ✓✓✓ | Impresionar a alguien ✓✓✓ | Primera cita (avanzada) ✓ | Aniversario ✓

**Descripción editorial:**
"No es un restaurante. Es una decisión. Cada plato es un argumento, cada silencio entre bocados está bien. El servicio desaparece cuando no lo necesitás y aparece cuando sí. Si esta noche importa, este es el lugar donde honrarla."

---

### Lugar 5: Café-bar de barrio con doble vida (Lúcuma, BA)

**Evaluación:**

| Variable | Mañana | Tarde | Noche |
|----------|--------|-------|-------|
| Volumen | 1 | 2 | 3 |
| Densidad | 1 | 2 | 4 |
| Rotación | 0 | 1 | 2 |
| Luminosidad | 4 | 3 | 2 |
| Temp. cromática | Natural | Natural-cálida | Cálida |
| Música | Ninguna (0) | Indie bajo (2) | Indie-electrónica (3) |
| Escala | Chico (8 mesas) | Chico | Chico |
| Config. | Mesas + barra ventana | Mesas | Barra + mesas altas |
| Vista exterior | 4 (ventanal a la calle) | 3 | 2 (cortina parcial) |
| Asiento | 3 | 3 | 2 (cambian sillas por banquetas) |
| Diseño | 3 (prolijo, plantas, simple) | 3 | 3 |
| Wifi | Bueno (4) | Bueno (4) | No relevante |
| Enchufes | 2 | 2 | — |
| Staff | 3 (amable, relajado) | 3 | 4 (barman presente) |
| Permeabilidad | 4 (ventana abierta) | 3 | 2 (más cerrado) |

**Moods asignados:**
- Mañana: Calmo (5), Productivo (4), Refugio (3)
- Tarde: Calmo (3), Social (3), Contemplativo (3)
- Noche: Social (4), Íntimo (3), Energético (2)

**Ocasiones:**
- Mañana: Trabajar solo ✓✓ | Desayuno lento ✓ | Estar solo ✓
- Tarde: Encontrarte con alguien ✓ | Lectura ✓
- Noche: After office relajado ✓ | Segunda cita ✓ | Amigos (pocos) ✓

**Descripción editorial:**
"A las 9 es un café de barrio donde el sol entra sin pedir permiso y nadie habla. A las 19 alguien pone un vinilo y la barra se llena de vecinos que se conocen de vista. Dos lugares en uno, separados solo por la hora. Llevá cargador a la mañana, dejá el teléfono a la noche."

---

## Apéndice: Estructura de Datos Propuesta

```json
{
  "id": "lucuma-villa-crespo",
  "name": "Lúcuma",
  "type": "café-bar",
  "city": "buenos-aires",
  "neighborhood": "villa-crespo",
  "address": "...",
  "coordinates": { "lat": -34.xxx, "lng": -58.xxx },
  
  "atmospherics": {
    "morning": {
      "volume": 1,
      "density": 1,
      "rotation": 0,
      "luminosity": 4,
      "color_temp": "natural",
      "music_type": "none",
      "music_volume": 0,
      "connectivity": 4,
      "outlets": 2,
      "comfort": 3,
      "design": 3,
      "permeability": 4,
      "staff_attention": 3
    },
    "afternoon": { ... },
    "night": { ... }
  },
  
  "moods": {
    "morning": { "calmo": 5, "productivo": 4, "refugio": 3 },
    "afternoon": { "calmo": 3, "social": 3, "contemplativo": 3 },
    "night": { "social": 4, "intimo": 3, "energetico": 2 }
  },
  
  "occasions": {
    "trabajar_solo": { "score": 4, "best_time": "morning" },
    "primera_cita": { "score": 3, "best_time": "night" },
    "grupo_amigos": { "score": 2, "best_time": "night" },
    "estar_solo": { "score": 5, "best_time": "morning" }
  },
  
  "metadata": {
    "scale": "small",
    "config": ["mesas", "barra"],
    "price_range": 2,
    "reservation": "not_needed",
    "age_demo": "25-40",
    "dress_code": "casual",
    "confidence_score": 0.85,
    "last_evaluated": "2025-01-15",
    "sources": ["editorial", "google_reviews_nlp", "instagram_cv"]
  },
  
  "editorial": {
    "short": "Café de barrio con doble vida: silencio productivo de mañana, bar de vecinos de noche.",
    "long": "A las 9 es un café de barrio donde el sol entra sin pedir permiso...",
    "one_line_for_card": "Sol de mañana, vino de noche. Dos lugares en uno."
  }
}
```

---

## Reglas Finales del Sistema

1. **Un lugar no tiene UN mood. Tiene moods por franja horaria.**
2. **Los scores se publican con mínimo 2 fuentes concordantes.**
3. **El usuario nunca ve números. Ve mood tags que resultan de los números.**
4. **La corrección es continua: editorial → NLP → CV → user signals → re-evaluación.**
5. **Cada 6 meses, los lugares con confianza <0.7 se re-evalúan o se bajan.**
6. **Los moods del feed se ajustan a la hora actual del usuario automáticamente.**
7. **Nunca se muestra un mood que no aplica al momento actual** (no mostrar "Productivo" a las 23hs para un café que cierra a las 20hs).
User: Diseñá el ranking engine v1 de Korantis para recomendar lugares. El usuario puede buscar por mood, ubicación, hora del día, tipo de plan, clima, presupuesto, compañía y preferencias personales.

Necesito una fórmula inicial simple, explicable y programable. Considerá:
- Mood match
- Distance
- Time of day
- Venue quality
- Novelty
- User taste memory
- Popularity
- Editorial curation
- Open/closed status

Dame pesos sugeridos, fórmula, pseudocódigo y ejemplos.
Model: # Ranking Engine v1 — Korantis

## Sistema de Recomendación y Ordenamiento de Lugares

---

## Filosofía del Engine

Korantis no rankea por "mejor" o "más popular". Rankea por **relevancia contextual personal**: el lugar correcto para esta persona, en este momento, con esta intención.

**Principio rector:** Un lugar con mood match perfecto a 10 cuadras siempre gana sobre un lugar popular a 2 cuadras que no encaja emocionalmente.

---

## 1. Fórmula Principal

### Score Final:

```
SCORE_FINAL = (Mood_Match × 0.30) +
              (Time_Fit × 0.18) +
              (Distance_Score × 0.15) +
              (Taste_Memory × 0.12) +
              (Editorial_Quality × 0.10) +
              (Novelty × 0.08) +
              (Occasion_Fit × 0.05) +
              (Popularity_Signal × 0.02)

× MULTIPLIER_Open_Status
× MULTIPLIER_Conditions
```

**Rango de output:** 0.0 — 1.0

---

## 2. Desglose de Cada Factor

---

### A) MOOD MATCH (Peso: 0.30)

**Qué mide:** Qué tan bien coincide la atmósfera del lugar con lo que el usuario busca.

**Inputs:**
- Mood solicitado por el usuario (explícito: tap en pill o búsqueda)
- Mood scores del lugar para la franja horaria actual
- Moods inferidos del perfil del usuario (si no hay búsqueda explícita)

**Cálculo:**

```
Si el usuario seleccionó mood explícito:
  mood_match = lugar.moods[franja_actual][mood_solicitado] / 5.0

Si el usuario no seleccionó mood (feed general):
  mood_match = max(
    cosine_similarity(user_mood_vector, lugar_mood_vector[franja_actual])
  )

Si múltiples moods seleccionados:
  mood_match = promedio(lugar.moods[franja][mood] / 5.0 for mood in selected)
```

**Ejemplo:**
- Usuario busca "Calmo" a las 10am.
- Lugar A tiene Calmo=5 en mañana → mood_match = 5/5 = 1.0
- Lugar B tiene Calmo=2 en mañana → mood_match = 2/5 = 0.4
- Lugar C tiene Calmo=4 en mañana → mood_match = 4/5 = 0.8

---

### B) TIME FIT (Peso: 0.18)

**Qué mide:** Qué tan apropiado es el lugar para el momento actual o el momento buscado.

**Inputs:**
- Hora actual del dispositivo (o hora que el usuario indica: "para esta noche")
- Franja horaria del lugar con mejor score
- Horario de apertura/cierre

**Cálculo:**

```
franja_actual = determinar_franja(hora)  
// mañana: 7-12, tarde: 12-19, noche: 19-02

Si el lugar tiene scores para franja_actual:
  time_fit_base = 1.0

Si el lugar NO tiene scores para franja_actual (ej: café sin data nocturna):
  time_fit_base = 0.3

// Bonus por "momento óptimo"
Si franja_actual == lugar.best_time_for_occasion[ocasion_buscada]:
  time_fit_base += 0.2 (cap 1.0)

// Penalización por cercanía al cierre
horas_hasta_cierre = lugar.cierre - hora_actual
Si horas_hasta_cierre < 1:
  time_fit_base × 0.5
Si horas_hasta_cierre < 0.5:
  time_fit_base × 0.2

time_fit = clamp(time_fit_base, 0, 1)
```

**Ejemplo:**
- Son las 22:00, usuario busca "Social"
- Lugar A: bar que brilla de noche, cierra 3am → time_fit = 1.0
- Lugar B: café que cierra 20hs → ya cerrado → eliminado del ranking
- Lugar C: restaurant que cierra 23hs → time_fit = 1.0 × 0.5 = 0.5 (cierra pronto)

---

### C) DISTANCE SCORE (Peso: 0.15)

**Qué mide:** Proximidad al usuario, con decaimiento gradual.

**Inputs:**
- Coordenadas del usuario (GPS)
- Coordenadas del lugar
- Ciudad (el threshold cambia: en BA caminás más que en NYC con mal clima)

**Cálculo con decaimiento sigmoideal:**

```
distancia_km = haversine(user_coords, lugar_coords)

// Función de decaimiento suave
// Ideal < 1km, aceptable 1-3km, lejos > 3km
distance_score = 1 / (1 + e^(2 × (distancia_km - 2)))

// Alternativa lineal simple para v1:
Si distancia_km <= 0.5: distance_score = 1.0
Si distancia_km <= 1.0: distance_score = 0.9
Si distancia_km <= 2.0: distance_score = 0.75
Si distancia_km <= 3.0: distance_score = 0.55
Si distancia_km <= 5.0: distance_score = 0.35
Si distancia_km <= 8.0: distance_score = 0.15
Si distancia_km > 8.0:  distance_score = 0.05
```

**Nota importante:** Distance tiene peso 0.15, NO 0.30. Esto es intencional. Korantis no es Google Maps — no priorizamos lo cercano sobre lo relevante. Un lugar perfecto a 15 minutos siempre debería aparecer antes que uno mediocre a 2 cuadras.

**Override:** Si el usuario filtra por barrio específico, distance_score se neutraliza (= 1.0 para todo el barrio).

---

### D) TASTE MEMORY (Peso: 0.12)

**Qué mide:** Qué tanto el lugar coincide con el perfil de gusto acumulado del usuario.

**Inputs:**
- Vector de preferencia del usuario (construido desde guardados, clics, tiempo en ficha)
- Vector atmosférico del lugar
- Historial de interacciones

**Cálculo:**

```
// Si el usuario es nuevo (< 5 interacciones):
taste_memory = 0.5 (neutro, no penaliza ni favorece)

// Si el usuario tiene historial:
user_vector = promedio_ponderado(
  vectores_atmosfericos de lugares_guardados (peso 3x),
  vectores de lugares con click_en_como_llegar (peso 2x),
  vectores de lugares con tiempo_en_ficha > 15s (peso 1x)
)

taste_memory = cosine_similarity(user_vector, lugar_vector[franja_actual])

// Clamp entre 0 y 1
taste_memory = clamp(taste_memory, 0, 1)
```

**Vector atmosférico del lugar (para similaridad):**
```
lugar_vector = [
  volumen/5, densidad/5, luminosidad/5, musica/5, 
  diseño/5, comodidad/5, escala/5, permeabilidad/5,
  calmo/5, intimo/5, social/5, energetico/5, 
  refugio/5, contemplativo/5, productivo/5, celebratorio/5
]
// 16 dimensiones
```

**Ejemplo:**
- Usuario guardó 8 lugares: todos calmos, con poca gente, luz cálida, chicos.
- user_vector ≈ [bajo_volumen, baja_densidad, luz_media, diseño_alto, calmo_alto...]
- Lugar nuevo: speakeasy chico, calmo, diseño alto → similaridad 0.87
- Lugar nuevo: patio cervecero ruidoso, grande → similaridad 0.15

---

### E) EDITORIAL QUALITY (Peso: 0.10)

**Qué mide:** La calidad y completitud de la información editorial del lugar.

**No es rating del lugar. Es rating de nuestra cobertura.**

**Cálculo:**

```
editorial_quality = promedio(
  tiene_descripcion_larga: 0 o 1,
  tiene_fotos_propias (≥3): 0 o 1,
  evaluacion_insitu: 0 o 1,
  tiene_momentos_del_dia: 0 o 1,
  tiene_ocasiones: 0 o 1,
  confidence_score del lugar: 0-1,
  ultima_evaluacion < 6 meses: 0 o 1
)
```

**Por qué importa:** Los lugares mejor cubiertos editorialmente generan mejor experiencia. Mostrar un lugar con ficha incompleta arriba del ranking degrada la percepción del producto.

**Efecto práctico:** Los primeros 5 resultados siempre deberían tener fichas ricas. Los lugares con ficha mínima pueden aparecer pero más abajo.

---

### F) NOVELTY (Peso: 0.08)

**Qué mide:** Qué tan "nuevo" o "no visto" es el lugar para este usuario.

**Inputs:**
- ¿El usuario ya vio la ficha de este lugar?
- ¿Hace cuánto fue la última vez que lo vio?
- ¿Cuántas veces apareció en su feed?
- ¿Es un lugar recién agregado al catálogo?

**Cálculo:**

```
// Nunca visto por el usuario:
novelty = 1.0

// Visto pero no interactuado (apareció en feed, no hizo tap):
novelty = 0.7

// Visto y abrió ficha pero no guardó:
novelty = 0.4

// Ya guardado:
novelty = 0.2 (no desaparece, pero baja prioridad de descubrimiento)

// Bonus: lugar recién agregado al catálogo (< 14 días):
novelty += 0.2 (cap 1.0)

// Decay temporal: si no lo vio hace > 30 días, resetear parcialmente:
Si dias_desde_ultima_vista > 30:
  novelty = min(novelty + 0.3, 1.0)
```

**Efecto:** El feed se renueva. No ves siempre los mismos 10 lugares. Los nuevos tienen bonus. Los ya vistos bajan gradualmente.

---

### G) OCCASION FIT (Peso: 0.05)

**Qué mide:** Si el usuario especificó un plan/ocasión, qué tan adecuado es el lugar.

**Inputs:**
- Ocasión seleccionada o inferida (primera cita, trabajar solo, grupo de amigos, etc.)
- Scores de ocasión del lugar

**Cálculo:**

```
Si el usuario especificó ocasión:
  occasion_fit = lugar.occasions[ocasion].score / 5.0

Si no especificó ocasión:
  occasion_fit = 0.5 (neutro)

// Bonus si el best_time coincide con la hora actual:
Si lugar.occasions[ocasion].best_time == franja_actual:
  occasion_fit += 0.1 (cap 1.0)
```

---

### H) POPULARITY SIGNAL (Peso: 0.02)

**Qué mide:** Señal mínima de que otros usuarios validan el lugar.

**Deliberadamente bajo peso.** Korantis no es popularity-driven. Pero un lugar que nadie guarda ni visita puede tener un problema.

**Cálculo:**

```
guardados_totales = count(users que guardaron el lugar)
visitas_ficha_30d = count(aperturas de ficha en últimos 30 días)

popularity = min(1.0, log(guardados_totales + 1) / log(MAX_GUARDADOS + 1))

// MAX_GUARDADOS = el lugar más guardado del catálogo
// Usando log para que no haya winner-take-all
```

**Ejemplo:**
- Lugar con 200 guardados (el máximo es 500): popularity = log(201)/log(501) ≈ 0.85
- Lugar con 3 guardados: popularity = log(4)/log(501) ≈ 0.22
- Lugar con 0 guardados: popularity = 0

**Por qué peso 0.02:** No queremos que lo popular gane. Solo queremos evitar mostrar lugares que NADIE usa como primer resultado. Es un tiebreaker, no un driver.

---

## 3. Multipliers (Post-Score)

### MULTIPLIER: Open Status

```
Si el lugar está ABIERTO ahora: × 1.0
Si el lugar CIERRA en < 1 hora: × 0.7
Si el lugar CIERRA en < 30 min: × 0.3
Si el lugar está CERRADO: × 0.0 (eliminado del ranking)
Si horario DESCONOCIDO: × 0.8 (penalización leve por incertidumbre)
```

**Efecto:** Los lugares cerrados no aparecen. Los que están por cerrar bajan. Simple.

---

### MULTIPLIER: Conditions (Clima + Contexto)

```
// Si llueve y el lugar es 100% terraza exterior:
Si clima == lluvia AND lugar.config == "terraza_only":
  × 0.2

// Si llueve y el lugar tiene interior:
  × 1.0

// Si hace > 30°C y el lugar no tiene AC ni exterior:
Si temp > 30 AND lugar.ac == false AND lugar.exterior == false:
  × 0.7

// Si es feriado y el lugar probablemente está cerrado:
Si dia == feriado AND lugar.horario_feriado == "desconocido":
  × 0.6
```

---

## 4. Pseudocódigo Completo

```python
def rank_venues(user, query, context):
    """
    Ranking engine v1 de Korantis.
    
    Args:
        user: perfil del usuario (historial, guardados, vector de gusto)
        query: búsqueda actual (moods, ocasión, zona, texto libre)
        context: hora, ubicación, clima, día de la semana
    
    Returns:
        Lista ordenada de venues con scores
    """
    
    # 1. Filtrado duro (eliminación)
    candidates = get_all_venues(city=context.city)
    candidates = filter_open_now(candidates, context.time)
    
    if query.neighborhood:
        candidates = filter_by_neighborhood(candidates, query.neighborhood)
    
    if query.venue_type:  # café, bar, restaurante
        candidates = filter_by_type(candidates, query.venue_type)
    
    if query.max_price:
        candidates = filter_by_price(candidates, query.max_price)
    
    # 2. Determinar franja horaria
    time_slot = get_time_slot(context.time)
    # "morning" | "afternoon" | "night"
    
    # 3. Determinar moods de búsqueda
    if query.moods:
        search_moods = query.moods  # explícitos
    elif user.has_history:
        search_moods = user.inferred_moods(time_slot)  # del perfil
    else:
        search_moods = None  # feed general, sin filtro de mood
    
    # 4. Calcular score para cada candidato
    scored_venues = []
    
    for venue in candidates:
        
        # A) Mood Match (0.30)
        if search_moods:
            mood_scores = [
                venue.moods[time_slot].get(mood, 0) / 5.0 
                for mood in search_moods
            ]
            mood_match = mean(mood_scores)
        else:
            if user.has_vector:
                mood_match = cosine_similarity(
                    user.taste_vector, 
                    venue.get_vector(time_slot)
                )
            else:
                mood_match = venue.editorial_quality  # fallback para nuevos
        
        # B) Time Fit (0.18)
        time_fit = calculate_time_fit(venue, context.time, time_slot)
        
        # C) Distance (0.15)
        if query.neighborhood:
            distance_score = 1.0  # neutralizado por filtro de zona
        else:
            dist_km = haversine(context.user_location, venue.coordinates)
            distance_score = distance_decay(dist_km)
        
        # D) Taste Memory (0.12)
        if user.interactions_count >= 5:
            taste_memory = cosine_similarity(
                user.taste_vector,
                venue.get_vector(time_slot)
            )
        else:
            taste_memory = 0.5  # neutro para usuarios nuevos
        
        # E) Editorial Quality (0.10)
        editorial = venue.confidence_score  # 0-1 pre-calculado
        
        # F) Novelty (0.08)
        novelty = calculate_novelty(venue, user)
        
        # G) Occasion Fit (0.05)
        if query.occasion:
            occasion_data = venue.occasions.get(query.occasion)
            if occasion_data:
                occasion_fit = occasion_data.score / 5.0
                if occasion_data.best_time == time_slot:
                    occasion_fit = min(1.0, occasion_fit + 0.1)
            else:
                occasion_fit = 0.2  # no tiene data para esta ocasión
        else:
            occasion_fit = 0.5  # neutro
        
        # H) Popularity (0.02)
        popularity = popularity_score(venue)
        
        # === SCORE COMBINADO ===
        base_score = (
            mood_match * 0.30 +
            time_fit * 0.18 +
            distance_score * 0.15 +
            taste_memory * 0.12 +
            editorial * 0.10 +
            novelty * 0.08 +
            occasion_fit * 0.05 +
            popularity * 0.02
        )
        
        # === MULTIPLIERS ===
        open_mult = open_status_multiplier(venue, context.time)
        condition_mult = conditions_multiplier(venue, context.weather)
        
        final_score = base_score * open_mult * condition_mult
        
        scored_venues.append({
            'venue': venue,
            'score': final_score,
            'debug': {
                'mood': mood_match,
                'time': time_fit,
                'distance': distance_score,
                'taste': taste_memory,
                'editorial': editorial,
                'novelty': novelty,
                'occasion': occasion_fit,
                'popularity': popularity,
                'multipliers': open_mult * condition_mult
            }
        })
    
    # 5. Ordenar
    scored_venues.sort(key=lambda x: x['score'], reverse=True)
    
    # 6. Diversificación (anti-monotonía)
    final_list = diversify(scored_venues, max_same_neighborhood=3, max_same_mood_profile=4)
    
    return final_list


# === FUNCIONES AUXILIARES ===

def distance_decay(dist_km):
    """Sigmoid decay centrado en 2km"""
    import math
    return 1 / (1 + math.exp(2 * (dist_km - 2)))


def calculate_time_fit(venue, current_time, time_slot):
    """Evalúa qué tan apropiado es el momento"""
    
    # Verificar si tiene data para esta franja
    if time_slot not in venue.moods:
        return 0.3  # penalización: no sabemos cómo es a esta hora
    
    base = 1.0
    
    # Penalizar si está por cerrar
    hours_to_close = venue.closing_time - current_time
    if hours_to_close < 1.0:
        base *= 0.5
    elif hours_to_close < 0.5:
        base *= 0.2
    
    return min(1.0, base)


def calculate_novelty(venue, user):
    """Qué tan nuevo es este lugar para el usuario"""
    
    if venue.id not in user.seen_venues:
        novelty = 1.0
    elif venue.id in user.saved_venues:
        novelty = 0.2
    elif venue.id in user.opened_venues:
        days_since = days_since_last_open(venue.id, user)
        if days_since > 30:
            novelty = 0.6
        else:
            novelty = 0.4
    else:
        # Apareció en feed pero no interactuó
        novelty = 0.7
    
    # Bonus por lugar nuevo en catálogo
    if venue.days_since_added < 14:
        novelty = min(1.0, novelty + 0.2)
    
    return novelty


def popularity_score(venue):
    """Señal logarítmica de popularidad"""
    import math
    MAX_SAVES = get_max_saves_in_catalog()
    if MAX_SAVES == 0:
        return 0
    return min(1.0, math.log(venue.total_saves + 1) / math.log(MAX_SAVES + 1))


def diversify(scored_venues, max_same_neighborhood=3, max_same_mood_profile=4):
    """
    Evita que el top 10 sea todo del mismo barrio 
    o todo el mismo tipo de lugar.
    """
    final = []
    neighborhood_count = {}
    mood_profile_count = {}
    
    for item in scored_venues:
        v = item['venue']
        hood = v.neighborhood
        primary_mood = v.primary_mood
        
        neighborhood_count[hood] = neighborhood_count.get(hood, 0) + 1
        mood_profile_count[primary_mood] = mood_profile_count.get(primary_mood, 0) + 1
        
        if neighborhood_count[hood] > max_same_neighborhood:
            continue  # skip, demasiados del mismo barrio
        if mood_profile_count[primary_mood] > max_same_mood_profile:
            continue
        
        final.append(item)
        
        if len(final) >= 20:  # top 20 es suficiente para el feed
            break
    
    return final
```

---

## 5. Ejemplos Completos de Ranking

### Escenario 1: "Calmo" un martes a las 10am, usuario en Palermo

**Contexto:**
- Hora: 10:00
- Franja: mañana
- Mood: Calmo (explícito)
- Ubicación: Palermo, BA
- Usuario: tiene 12 guardados, todos calmos/productivos
- Clima: soleado, 22°C

**Candidatos y scores:**

| Lugar | Mood | Time | Dist | Taste | Editorial | Novelty | Occasion | Pop | Multi | **FINAL** |
|-------|------|------|------|-------|-----------|---------|----------|-----|-------|-----------|
| Cuervo Café (Palermo) | 1.0 | 1.0 | 0.95 | 0.9 | 0.9 | 0.4 | 0.5 | 0.3 | 1.0 | **0.873** |
| Lúcuma (V. Crespo) | 1.0 | 1.0 | 0.70 | 0.85 | 0.8 | 1.0 | 0.5 | 0.2 | 1.0 | **0.870** |
| LAB Café (Palermo) | 0.8 | 1.0 | 0.90 | 0.88 | 0.7 | 0.7 | 0.5 | 0.4 | 1.0 | **0.815** |
| Verne Club (Centro) | 0.4 | 0.3 | 0.35 | 0.3 | 0.9 | 0.7 | 0.5 | 0.6 | 1.0 | **0.405** |
| On Tap (Palermo) | 0.0 | 1.0 | 0.90 | 0.1 | 0.7 | 0.8 | 0.5 | 0.5 | 1.0 | **0.368** |

**Resultado:** Cuervo y Lúcuma arriba. Lúcuma casi empata porque tiene novelty máximo (el usuario no lo vio nunca). On Tap y Verne bajan porque su mood no matchea.

---

### Escenario 2: "Social" + "Grupo de amigos" un viernes a las 22hs

**Contexto:**
- Hora: 22:00
- Franja: noche
- Mood: Social (explícito)
- Ocasión: Grupo de amigos
- Ubicación: Recoleta
- Usuario: nuevo, 2 interacciones
- Clima: noche fresca, 16°C

| Lugar | Mood | Time | Dist | Taste | Editorial | Novelty | Occasion | Pop | Multi | **FINAL** |
|-------|------|------|------|-------|-----------|---------|----------|-----|-------|-----------|
| On Tap (Palermo) | 1.0 | 1.0 | 0.55 | 0.5 | 0.7 | 1.0 | 0.9 | 0.6 | 1.0 | **0.797** |
| Backroom Bar (Recoleta) | 0.6 | 1.0 | 0.95 | 0.5 | 0.85 | 1.0 | 0.5 | 0.5 | 1.0 | **0.721** |
| Trade Sky Bar (Centro) | 0.8 | 1.0 | 0.35 | 0.5 | 0.9 | 1.0 | 0.7 | 0.7 | 1.0 | **0.740** |
| Florería (Centro) | 0.6 | 1.0 | 0.40 | 0.5 | 0.95 | 1.0 | 0.4 | 0.8 | 1.0 | **0.672** |
| Cuervo Café | 0.0 | 0.0 | 0.50 | 0.5 | 0.9 | 1.0 | 0.1 | 0.3 | 0.0 | **ELIMINADO** (cerrado) |

**Resultado:** On Tap gana por mood perfecto + ocasión perfecta, a pesar de estar un poco lejos. Trade Sky sube por editorial y mood alto. Cuervo eliminado por cerrado.

---

### Escenario 3: Sin filtros — Feed general, sábado 17hs, usuario con historial

**Contexto:**
- Hora: 17:00
- Franja: tarde
- Mood: ninguno explícito → se usa taste_memory del usuario
- Usuario: 25 guardados, perfil: íntimo + contemplativo + luz cálida
- Ubicación: San Telmo
- Clima: nublado

**Aquí el engine usa taste_memory como driver principal combinado con novelty:**

| Lugar | Mood* | Time | Dist | Taste | Editorial | Novelty | Occasion | Pop | Multi | **FINAL** |
|-------|-------|------|------|-------|-----------|---------|----------|-----|-------|-----------|
| Nuevo lugar íntimo (S. Telmo) | 0.8 | 1.0 | 0.95 | 0.88 | 0.75 | 1.0 | 0.5 | 0.1 | 1.0 | **0.842** |
| Florería Atlántico | 0.85 | 1.0 | 0.55 | 0.90 | 0.95 | 0.2 | 0.5 | 0.8 | 1.0 | **0.746** |
| Bar contemplativo (Palermo) | 0.75 | 1.0 | 0.35 | 0.85 | 0.8 | 1.0 | 0.5 | 0.2 | 1.0 | **0.737** |

*Mood aquí = cosine_similarity entre user_vector y venue_vector*

**Resultado:** El lugar nuevo en San Telmo gana porque tiene mood alto para su perfil + es novedoso + está cerca. Florería baja por novelty (ya la guardó y la visitó).

---

## 6. Tabla Resumen de Pesos

| Factor | Peso | Justificación |
|--------|------|---------------|
| Mood Match | 0.30 | Es el core del producto. Si el mood no matchea, nada importa. |
| Time Fit | 0.18 | Contexto temporal es el segundo diferencial de Korantis. |
| Distance | 0.15 | Importa pero no domina. No somos Google Maps. |
| Taste Memory | 0.12 | Personalización pasiva. Crece en importancia con el uso. |
| Editorial Quality | 0.10 | Asegura que los top resultados tengan fichas ricas. |
| Novelty | 0.08 | Mantiene el feed fresco y fomenta descubrimiento. |
| Occasion Fit | 0.05 | Relevante solo cuando el usuario especifica plan. |
| Popularity | 0.02 | Tiebreaker mínimo. Anti-popularity by design. |
| **TOTAL** | **1.00** | |

---

## 7. Ajustes Dinámicos de Pesos

Los pesos no son estáticos. Cambian según contexto:

### Cuando el usuario es nuevo (< 5 interacciones):

```
Mood Match: 0.30 → 0.35 (compensar falta de taste memory)
Taste Memory: 0.12 → 0.00 (no hay data)
Editorial Quality: 0.10 → 0.17 (mostrar los mejores curados)
Novelty: 0.08 → 0.08 (todo es nuevo)
Popularity: 0.02 → 0.05 (un poco más de social proof para generar confianza)
```

### Cuando el usuario tiene historial fuerte (> 30 guardados):

```
Taste Memory: 0.12 → 0.20 (el perfil es confiable)
Mood Match: 0.30 → 0.25 (taste memory ya incluye mood preference)
Novelty: 0.08 → 0.12 (evitar burbuja de repetición)
```

### Cuando hay búsqueda por texto libre:

```
// "café tranquilo para trabajar con wifi en Palermo"
// Se parsea: mood=calmo, occasion=trabajar, filter=wifi, zone=palermo

// NLP extrae intención y ajusta pesos:
Mood Match: 0.30 → 0.35
Occasion Fit: 0.05 → 0.15
Distance: 0.15 → 0.05 (zona ya filtrada)
```

---

## 8. Anti-Patterns (Lo que el engine NO debe hacer)

| Anti-pattern | Por qué es malo | Cómo lo evitamos |
|-------------|-----------------|-----------------|
| Mostrar siempre los mismos 5 lugares | Mata descubrimiento, aburre | Novelty decay + diversificación |
| Que lo popular gane siempre | Nos convierte en Yelp | Popularity peso 0.02 |
| Que lo cercano gane siempre | Nos convierte en Google Maps | Distance peso 0.15, no 0.30 |
| Burbuja de personalización | El usuario solo ve lo que ya le gusta | Novelty + diversificación por mood |
| Resultados irrelevantes arriba | Pierde confianza | Mood Match como factor dominante |
| Mostrar lugares cerrados | Frustración máxima | Filtro duro previo al scoring |
| Cambiar el ranking cada refresh | Confusión | Cache de ranking por 30 min mínimo |

---

## 9. Implementación para MVP (14 días)

### Lo que se implementa ahora:

```python
# v0.1 — Ranking simplificado funcional

def rank_v01(venues, user_mood, user_location, current_time):
    """
    MVP: solo mood + distancia + time + open status.
    Sin personalización, sin popularity, sin novelty complejo.
    """
    time_slot = get_time_slot(current_time)
    results = []
    
    for v in venues:
        # Filtro duro
        if not is_open(v, current_time):
            continue
        
        # Mood match simple
        if user_mood:
            mood = v.moods.get(time_slot, {}).get(user_mood, 0) / 5.0
        else:
            mood = 0.5
        
        # Distancia simple
        dist = haversine(user_location, v.coords)
        dist_score = max(0, 1 - (dist / 5.0))  # linear decay hasta 5km
        
        # Time fit simple
        time_fit = 1.0 if time_slot in v.moods else 0.4
        
        # Score MVP
        score = (mood * 0.45) + (dist_score * 0.25) + (time_fit * 0.20) + (v.confidence * 0.10)
        
        results.append((v, score))
    
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:20]
```

### Lo que se implementa después (día 15-60):

1. **Semana 3-4:** Taste Memory (empezar a trackear guardados, construir vectores)
2. **Semana 5-6:** Novelty tracking (registrar vistas, calcular decay)
3. **Semana 7-8:** Diversificación + ajuste dinámico de pesos
4. **Mes 3:** NLP sobre reviews externas para validar/corregir scores
5. **Mes 4:** Computer vision sobre fotos
6. **Mes 5:** A/B testing de pesos para optimizar engagement

---

## 10. Métricas para Validar el Engine

| Métrica | Qué indica | Target |
|---------|-----------|--------|
| Tasa de guardado desde top 5 | Los primeros resultados son relevantes | > 15% |
| Tasa de "cómo llegar" desde top 10 | Los resultados generan acción | > 8% |
| Scroll depth promedio | El feed mantiene interés | > 8 venues vistas |
| Tasa de uso de filtro mood | Los moods son útiles | > 40% de sesiones |
| Retorno D7 de usuarios que guardaron ≥1 | El guardado genera retention loop | > 25% |
| CTR en lugar #1 vs lugar #5 | El ranking tiene sentido (decay natural) | #1 > 3x #5 |
| Diversidad de barrios en top 10 | No hay sesgo geográfico extremo | ≥ 3 barrios |

---

## Conclusión

Este ranking engine es:

- **Simple:** Una fórmula lineal ponderada. No es un modelo de ML opaco.
- **Explicable:** Podés decir exactamente por qué un lugar está primero.
- **Programable:** El pseudocódigo es implementable en un día.
- **Evolucionable:** Los pesos se ajustan, las fuentes se suman, la complejidad crece gradualmente.
- **Alineado con el producto:** Mood primero, popularidad última. Descubrimiento sobre confirmación.

El engine no necesita ser perfecto. Necesita ser **mejor que el default** (orden random o por distancia). Con mood match + time fit + distancia ya superás a Google Maps en relevancia emocional. Todo lo demás es optimización incremental.
User: Estoy armando la base de datos inicial de Korantis con cafés, bares y restaurantes de Buenos Aires y New York. Necesito definir qué campos capturar de cada venue para que el producto pueda recomendar por mood, estética, horario, ocasión y experiencia.

Diseñá:
1. Schema ideal de venue.
2. Campos obligatorios.
3. Campos opcionales.
4. Campos derivados por IA.
5. Campos curados manualmente.
6. Campos que se pueden inferir desde reviews.
7. Campos que se pueden inferir desde imágenes.
8. Qué NO deberíamos guardar todavía.
Model: # Schema de Base de Datos — Korantis Venues

## Arquitectura de Datos Completa

---

## 1. Schema Ideal de Venue

```typescript
interface KorantisVenue {
  
  // ═══════════════════════════════════════════
  // IDENTIDAD
  // ═══════════════════════════════════════════
  
  id: string;                          // UUID único
  slug: string;                        // "floreria-atlantico-san-telmo"
  name: string;                        // "Florería Atlántico"
  name_normalized: string;             // "floreria atlantico" (para búsqueda)
  
  type: VenueType;                     // "café" | "bar" | "restaurante" | "café-bar"
  subtypes: string[];                  // ["speakeasy", "coctelería", "cocktail bar"]
  
  status: VenueStatus;                 // "active" | "temporarily_closed" | "permanently_closed" | "draft"
  
  // ═══════════════════════════════════════════
  // UBICACIÓN
  // ═══════════════════════════════════════════
  
  location: {
    city: City;                        // "buenos-aires" | "new-york"
    neighborhood: string;              // "san-telmo"
    neighborhood_display: string;      // "San Telmo"
    sub_neighborhood?: string;         // "Dorrego" (microzona, opcional)
    address: string;                   // "Arce 872, C1426 CABA"
    address_short: string;             // "Arce 872"
    floor?: string;                    // "Subsuelo" | "Piso 19"
    coordinates: {
      lat: number;                     // -34.6037
      lng: number;                     // -58.3816
    };
    cross_streets?: string;            // "Arce y Cerviño"
    access_notes?: string;             // "Entrar por la florería, bajar escalera"
    urban_context: UrbanContext;       // "calle_residencial" | "avenida" | "pasaje" | "esquina_comercial"
  };

  // ═══════════════════════════════════════════
  // HORARIOS
  // ═══════════════════════════════════════════
  
  hours: {
    regular: WeeklySchedule;           // Lun-Dom con apertura/cierre
    exceptions?: ScheduleException[];  // Feriados, temporadas
    timezone: string;                  // "America/Argentina/Buenos_Aires"
    confidence: HoursConfidence;       // "verified" | "from_google" | "estimated" | "unknown"
    last_verified?: Date;
    
    // Derivados
    is_open_now?: boolean;             // Calculado en runtime
    closes_soon?: boolean;             // < 1h para cierre
    best_arrival_window?: string;      // "19:00 - 20:30" (para evitar lleno)
  };
  
  // ═══════════════════════════════════════════
  // ATMÓSFERA — CORE DE KORANTIS
  // ═══════════════════════════════════════════
  
  atmosphere: {
    
    // Scores por franja horaria (0-5 cada uno)
    by_timeframe: {
      morning?: AtmosphereScores;      // 7:00 - 12:00
      afternoon?: AtmosphereScores;    // 12:00 - 19:00
      night?: AtmosphereScores;        // 19:00 - 02:00
      late_night?: AtmosphereScores;   // 02:00 - 06:00
    };
    
    // Variación por día (opcional, para lugares con diferencia L-V vs S-D)
    weekday_variation?: {
      weekday: Partial<AtmosphereScores>;
      weekend: Partial<AtmosphereScores>;
    };
  };
  
  // ═══════════════════════════════════════════
  // MOODS
  // ═══════════════════════════════════════════
  
  moods: {
    by_timeframe: {
      morning?: MoodScores;
      afternoon?: MoodScores;
      night?: MoodScores;
      late_night?: MoodScores;
    };
    
    // Tags visibles al usuario (los top 2-4 moods por franja)
    display_tags: {
      morning?: string[];              // ["calmo", "productivo"]
      afternoon?: string[];            // ["calmo", "contemplativo"]
      night?: string[];                // ["social", "íntimo"]
    };
    
    // Mood primario (el más fuerte, usado para clasificación rápida)
    primary_mood: string;              // "calmo"
    primary_mood_timeframe: string;    // "morning"
  };
  
  // ═══════════════════════════════════════════
  // OCASIONES
  // ═══════════════════════════════════════════
  
  occasions: {
    [key: OccasionType]: {
      score: number;                   // 0-5
      best_time: TimeSlot;             // "night"
      notes?: string;                  // "Ideal para parejas en la barra"
    };
  };
  
  // ═══════════════════════════════════════════
  // ESPACIO FÍSICO
  // ═══════════════════════════════════════════
  
  space: {
    scale: SpaceScale;                 // "tiny" | "small" | "medium" | "large" | "very_large"
    capacity_estimate?: number;        // ~30 personas
    configuration: SpaceConfig[];      // ["mesas", "barra", "terraza", "patio"]
    floors?: number;                   // 2
    has_outdoor: boolean;
    outdoor_type?: string;             // "terraza" | "patio" | "vereda" | "rooftop"
    has_private_area: boolean;
    seating_comfort: number;           // 0-5
    table_spacing: number;             // 0-5 (0=pegados, 5=muy separados)
  };
  
  // ═══════════════════════════════════════════
  // SENSORIAL
  // ═══════════════════════════════════════════
  
  sensory: {
    lighting: {
      type: LightingType;              // "natural" | "warm_artificial" | "cool_artificial" | "candles" | "mixed"
      intensity: number;               // 0-5
      natural_light: number;           // 0-5 (cuánta luz natural entra)
      notable?: string;                // "Velas en cada mesa + luz dorada cenital"
    };
    
    sound: {
      volume_level: number;            // 0-5
      music_presence: number;          // 0-5
      music_type?: MusicType;          // "ambient" | "jazz" | "electronic" | "indie" | "latin" | "playlist_pop" | "live" | "none"
      music_curation: number;          // 0-5 (qué tan buena es la selección)
      conversation_ease: number;       // 0-5 (5 = podés susurrar, 0 = imposible hablar)
      notable_sounds?: string;         // "Sonido del molinillo, tazas, silencio entre ellos"
    };
    
    smell?: {
      dominant?: string;               // "café recién molido" | "madera" | "cócteles cítricos"
      intensity: number;               // 0-5
    };
    
    temperature: {
      has_ac: boolean;
      has_heating: boolean;
      notable?: string;                // "Puede hacer frío en la terraza de noche"
    };
  };
  
  // ═══════════════════════════════════════════
  // ESTÉTICA Y DISEÑO
  // ═══════════════════════════════════════════
  
  aesthetics: {
    design_level: number;              // 0-5
    style: AestheticStyle[];           // ["industrial", "vintage", "minimal", "tropical", "art_deco"]
    color_palette: string[];           // ["dorado", "negro", "madera_oscura"]
    dominant_materials: string[];      // ["madera", "ladrillo", "concreto", "plantas"]
    era_feel?: string;                 // "años 20" | "contemporáneo" | "atemporal"
    instagram_factor: number;          // 0-5 (qué tan fotogénico es)
    notable_design?: string;           // "Barra de mármol original de 1920, lámparas de bronce"
  };
  
  // ═══════════════════════════════════════════
  // SERVICIO
  // ═══════════════════════════════════════════
  
  service: {
    style: ServiceStyle;               // "table" | "counter" | "self" | "mixed"
    attentiveness: number;             // 0-5
    speed: number;                     // 0-5 (5=rápido)
    friendliness: number;              // 0-5
    knowledge: number;                 // 0-5 (saben de lo que venden)
    pressure_to_leave: number;         // 0-5 (5=te apuran mucho)
    reservation: ReservationType;      // "required" | "recommended" | "accepted" | "not_needed" | "not_accepted"
    reservation_difficulty?: number;   // 0-5 (qué tan difícil es conseguir mesa)
    wait_time_typical?: string;        // "15-30 min viernes noche"
  };
  
  // ═══════════════════════════════════════════
  // OFERTA (qué venden, no menú completo)
  // ═══════════════════════════════════════════
  
  offering: {
    primary_category: OfferingCategory;  // "café_especialidad" | "coctelería" | "vino" | "cerveza_artesanal" | "comida"
    categories: OfferingCategory[];    // ["coctelería", "tapas", "vino"]
    cuisine_type?: string[];           // ["italiana", "japonesa", "argentina"] (solo si restaurante)
    
    highlights?: string[];             // ["Negroni de la casa", "Tostado en barra", "Natural wines"]
    dietary_options?: string[];        // ["vegetariano", "vegano", "celíaco"]
    
    price_range: PriceRange;           // 1-4 ($ $$ $$$ $$$$)
    price_reference?: string;          // "Café: $2500, Cóctel: $8000" (referencia rápida)
    price_confidence: Confidence;      // "confirmed" | "estimated" | "unknown"
    price_last_checked?: Date;
    
    quality_perception: number;        // 0-5 (calidad percibida de lo que ofrecen)
  };
  
  // ═══════════════════════════════════════════
  // CONECTIVIDAD Y FUNCIONALIDAD
  // ═══════════════════════════════════════════
  
  functional: {
    wifi: WifiStatus;                  // "none" | "slow" | "good" | "fast" | "unknown"
    wifi_password_needed: boolean;
    outlets: OutletAvailability;       // "none" | "few" | "many" | "unknown"
    laptop_friendly: boolean;
    phone_signal: number;              // 0-5
    accepts_cards: boolean;
    accepts_cash_only: boolean;
    has_parking_nearby: boolean;
    accessibility: {
      wheelchair: boolean;
      ground_floor: boolean;
      elevator?: boolean;
    };
  };
  
  // ═══════════════════════════════════════════
  // DEMOGRAFÍA OBSERVADA
  // ═══════════════════════════════════════════
  
  demographics: {
    age_range: string[];               // ["25-35", "35-45"]
    typical_group_size: string[];      // ["solo", "parejas", "grupos_chicos"]
    gender_balance?: string;           // "balanced" | "mostly_male" | "mostly_female"
    dress_code: DressCode;             // "very_casual" | "casual" | "smart_casual" | "formal"
    vibe_tribe?: string[];             // ["creativos", "tech", "foodies", "literarios", "corporativos"]
    local_vs_tourist: string;          // "mostly_local" | "mixed" | "mostly_tourist"
    laptops_present: LaptopPresence;   // "none" | "few" | "many"
  };
  
  // ═══════════════════════════════════════════
  // EDITORIAL — CONTENIDO KORANTIS
  // ═══════════════════════════════════════════
  
  editorial: {
    // Descripciones
    tagline: string;                   // Max 80 chars. Para cards. "Sol de mañana, vino de noche."
    description_short: string;         // 1-2 oraciones. Para preview expandida.
    description_long: string;          // 3-5 oraciones. Para ficha completa.
    
    // Momentos del día (narrativos)
    moments: {
      morning?: string;                // "Más bajo temprano. Mejor dejarlo para una pausa más tarde."
      afternoon?: string;              // "Buen momento para una copa lenta, algo simple y conversación."
      night?: string;                  // "Más social y producido. Mejor para una salida con energía."
    };
    
    // Señales para el usuario
    signals: {
      before_going?: string[];         // ["Ritmo social: sin apuro", "Precio: $$", "Reserva: recomendada"]
      best_for: string[];              // ["Primera cita", "Estar solo", "Impresionar"]
      not_for?: string[];              // ["Grupos grandes", "Trabajar con laptop", "Niños"]
    };
    
    // Metáfora / Mood en una frase
    mood_sentence?: string;            // "Como entrar a la biblioteca de un amigo que sabe de vinos."
    
    // Control editorial
    editorial_status: EditorialStatus; // "draft" | "review" | "published"
    editorial_confidence: number;      // 0-1
    written_by?: string;               // Editor ID
    last_editorial_update: Date;
  };
  
  // ═══════════════════════════════════════════
  // FOTOS
  // ═══════════════════════════════════════════
  
  photos: {
    hero: Photo;                       // Foto principal para card
    gallery: Photo[];                  // Resto de fotos
    scenes: {                          // Fotos por escena/momento
      exterior?: Photo;
      interior_general?: Photo;
      bar_area?: Photo;
      detail?: Photo;                  // Un detalle estético notable
      food_drink?: Photo;
      ambiance_night?: Photo;
      ambiance_day?: Photo;
    };
  };
  
  // ═══════════════════════════════════════════
  // LINKS EXTERNOS
  // ═══════════════════════════════════════════
  
  external: {
    google_maps_url?: string;
    google_place_id?: string;
    instagram_handle?: string;
    instagram_url?: string;
    website?: string;
    whatsapp?: string;
    reservation_url?: string;          // Link a Resy/OpenTable/TheFork si aplica
    menu_url?: string;
  };
  
  // ═══════════════════════════════════════════
  // METADATA Y SCORING
  // ═══════════════════════════════════════════
  
  metadata: {
    created_at: Date;
    updated_at: Date;
    published_at?: Date;
    
    // Fuentes de datos
    data_sources: DataSource[];        // ["editorial_visit", "google_reviews", "instagram_photos", "user_reports"]
    
    // Confianza del sistema
    confidence_score: number;          // 0-1 (promedio ponderado de completitud y frescura)
    completeness_score: number;        // 0-1 (% de campos llenos)
    freshness_score: number;           // 0-1 (basado en última actualización)
    
    // Evaluaciones
    evaluations: Evaluation[];         // Historial de visitas editoriales
    last_evaluation_date?: Date;
    evaluation_count: number;
    
    // Interacción de usuarios
    total_saves: number;
    total_profile_views: number;
    total_directions_clicks: number;
    save_rate_30d: number;             // saves / views últimos 30 días
    
    // Clasificación para el engine
    venue_vector: number[];            // 16-dim embedding para similaridad
    
    // Tags de sistema (no visibles al usuario)
    internal_tags?: string[];          // ["needs_re-evaluation", "seasonal_closure", "new_ownership"]
  };
}
```

---

### Tipos auxiliares:

```typescript
interface AtmosphereScores {
  volume: number;           // 0-5
  density: number;          // 0-5
  rotation_pressure: number; // 0-5
  luminosity: number;       // 0-5
  music_volume: number;     // 0-5
  conversation_ease: number; // 0-5
  energy_level: number;     // 0-5
}

interface MoodScores {
  calmo: number;            // 0-5
  intimo: number;           // 0-5
  social: number;           // 0-5
  energetico: number;       // 0-5
  refugio: number;          // 0-5
  contemplativo: number;    // 0-5
  productivo: number;       // 0-5
  celebratorio: number;     // 0-5
}

type OccasionType = 
  | "primera_cita"
  | "trabajar_solo"
  | "grupo_amigos"
  | "reunion_laboral"
  | "salida_nocturna"
  | "estar_solo"
  | "impresionar"
  | "desayuno_brunch"
  | "after_office"
  | "fecha_especial"
  | "familia";

interface Photo {
  url: string;
  alt: string;
  source: "editorial" | "instagram" | "google" | "user";
  dominant_colors?: string[];
  luminosity_score?: number;
  taken_at?: TimeSlot;      // "morning" | "night" etc.
}

interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

interface DaySchedule {
  open: string;             // "08:00"
  close: string;            // "23:00"
  is_closed: boolean;       // true si no abre ese día
  notes?: string;           // "Solo brunch hasta 14hs"
}

interface Evaluation {
  date: Date;
  evaluator_id: string;
  timeframe: TimeSlot;
  day_type: "weekday" | "weekend";
  scores: AtmosphereScores;
  moods_observed: MoodScores;
  notes: string;
  photos_taken: number;
}
```

---

## 2. Campos Obligatorios (Mínimo para publicar)

Un lugar NO se publica sin estos campos completos:

```
OBLIGATORIOS (gate de publicación):

├── Identidad
│   ├── name
│   ├── type
│   └── status = "active"
│
├── Ubicación
│   ├── city
│   ├── neighborhood
│   ├── address
│   └── coordinates (lat, lng)
│
├── Horarios
│   └── hours.regular (al menos L-D con horarios estimados)
│
├── Atmósfera (mínimo 1 franja)
│   └── atmosphere.by_timeframe[al_menos_una] (scores completos)
│
├── Moods (mínimo 1 franja)
│   ├── moods.by_timeframe[al_menos_una]
│   ├── moods.display_tags[al_menos_una] (mínimo 2 tags)
│   └── moods.primary_mood
│
├── Espacio
│   ├── space.scale
│   ├── space.configuration (al menos 1)
│   └── space.has_outdoor
│
├── Oferta
│   ├── offering.primary_category
│   └── offering.price_range
│
├── Editorial
│   ├── editorial.tagline
│   ├── editorial.description_short
│   └── editorial.editorial_status = "published"
│
├── Fotos
│   └── photos.hero (mínimo 1 foto de calidad)
│
├── Links
│   └── external.google_maps_url (para "cómo llegar")
│
└── Metadata
    ├── confidence_score (mínimo 0.5)
    └── completeness_score (calculado automáticamente)
```

**Total campos obligatorios: ~25**
**Tiempo estimado de carga mínima: 15-20 minutos por venue (con visita previa)**

---

## 3. Campos Opcionales (Enriquecen pero no bloquean)

```
OPCIONALES (mejoran la ficha pero no bloquean publicación):

├── Ubicación
│   ├── sub_neighborhood
│   ├── floor
│   ├── cross_streets
│   ├── access_notes
│   └── urban_context
│
├── Horarios
│   ├── exceptions
│   └── best_arrival_window
│
├── Atmósfera
│   └── weekday_variation (si es muy diferente L-V vs S-D)
│
├── Ocasiones
│   └── occasions (todas, con notes)
│
├── Espacio
│   ├── capacity_estimate
│   ├── floors
│   ├── outdoor_type
│   ├── has_private_area
│   └── table_spacing
│
├── Sensorial
│   ├── smell
│   ├── sound.notable_sounds
│   ├── lighting.notable
│   └── temperature.notable
│
├── Estética
│   ├── era_feel
│   ├── notable_design
│   └── color_palette
│
├── Servicio
│   ├── speed
│   ├── knowledge
│   ├── reservation_difficulty
│   └── wait_time_typical
│
├── Oferta
│   ├── highlights
│   ├── dietary_options
│   ├── cuisine_type
│   └── price_reference
│
├── Funcional
│   ├── wifi_password_needed
│   ├── phone_signal
│   ├── has_parking_nearby
│   └── accessibility
│
├── Demografía
│   ├── gender_balance
│   ├── vibe_tribe
│   └── local_vs_tourist
│
├── Editorial
│   ├── description_long
│   ├── moments (por franja)
│   ├── signals.not_for
│   └── mood_sentence
│
├── Fotos
│   ├── gallery (extras)
│   └── scenes (por contexto)
│
└── Links
    ├── instagram_handle
    ├── website
    ├── whatsapp
    ├── reservation_url
    └── menu_url
```

---

## 4. Campos Derivados por IA

Estos campos se generan automáticamente con procesamiento AI y se validan por humano:

```
GENERADOS POR AI:

├── DESDE REVIEWS EXTERNAS (NLP)
│   ├── atmosphere.by_timeframe (scores inferidos)
│   ├── moods.by_timeframe (moods inferidos)
│   ├── sensory.sound.volume_level (promedio de menciones)
│   ├── sensory.sound.music_type (tipo más mencionado)
│   ├── sensory.sound.conversation_ease (inferido de quejas/elogios)
│   ├── service.pressure_to_leave (inferido de menciones)
│   ├── service.attentiveness (inferido de menciones)
│   ├── demographics.typical_group_size (inferido de quiénes escriben)
│   ├── space.scale (inferido de menciones de "chico"/"grande")
│   └── occasions (inferidas de contextos mencionados)
│
├── DESDE FOTOS (Computer Vision)
│   ├── sensory.lighting.intensity (histograma de luminosidad)
│   ├── sensory.lighting.type (temperatura de color)
│   ├── aesthetics.color_palette (colores dominantes)
│   ├── aesthetics.dominant_materials (detección de texturas)
│   ├── aesthetics.design_level (complejidad visual)
│   ├── space.scale (estimación por profundidad)
│   ├── demographics.dress_code (ropa de personas en fotos)
│   └── photos.*.luminosity_score
│
├── GENERACIÓN DE CONTENIDO (LLM)
│   ├── editorial.tagline (draft, requiere validación)
│   ├── editorial.description_short (draft)
│   ├── editorial.description_long (draft)
│   ├── editorial.moments.* (drafts por franja)
│   ├── editorial.mood_sentence (draft)
│   └── editorial.signals.best_for (sugerencias)
│
├── VECTORES Y EMBEDDINGS
│   ├── metadata.venue_vector (16-dim, calculado de scores)
│   ├── name_normalized (normalización de texto)
│   └── slug (generado de nombre + barrio)
│
└── SCORES DERIVADOS
    ├── metadata.confidence_score (f(fuentes, concordancia, fecha))
    ├── metadata.completeness_score (% de campos obligatorios llenos)
    ├── metadata.freshness_score (decay desde última actualización)
    ├── moods.primary_mood (el mood con score más alto)
    └── moods.display_tags (top 2-4 moods por franja)
```

### Pipeline de AI:

```
FUENTE → PROCESAMIENTO → OUTPUT → VALIDACIÓN

Google Reviews → GPT extraction → atmosphere scores → Editor aprueba/ajusta
Instagram fotos → Vision API → lighting + aesthetics → Editor valida
Ficha editorial → GPT generation → tagline + descriptions → Editor reescribe
Scores finales → Cálculo vectorial → venue_vector → Automático
```

### Prompt de extracción de reviews (referencia):

```
Analizar las siguientes {N} reviews del lugar "{nombre}" y extraer:

1. VOLUMEN AMBIENTAL: ¿Mencionan ruido, silencio, música alta/baja?
   Score 0-5 con evidencia.

2. DENSIDAD: ¿Mencionan que está lleno, vacío, tranquilo, repleto?
   Score 0-5. Separar por día/hora si hay info.

3. ILUMINACIÓN: ¿Mencionan luz, oscuridad, velas, ventanas?
   Score 0-5 + tipo.

4. SERVICIO: ¿Mencionan que los apuran, que son atentos, lentos?
   Scores de attentiveness (0-5) y pressure (0-5).

5. MÚSICA: ¿Qué tipo? ¿Volumen?

6. OCASIONES: ¿Para qué fueron? (cita, amigos, trabajo, solo)

7. MOMENTO: ¿Mencionan hora o día? ¿Cambia la experiencia?

8. MOODS PERCIBIDOS: ¿Qué adjetivos emocionales usan?
   Mapear a: calmo, íntimo, social, energético, refugio, 
   contemplativo, productivo, celebratorio.

Responder SOLO con datos extraídos. Si no hay evidencia para un 
campo, responder "insuficiente". No inventar.
```

---

## 5. Campos Curados Manualmente (No automatizables)

Estos campos REQUIEREN visita in-situ y criterio editorial humano:

```
EXCLUSIVAMENTE MANUALES:

├── EVALUACIÓN PRESENCIAL
│   ├── atmosphere.by_timeframe (validación final después de AI draft)
│   ├── moods.by_timeframe (validación final)
│   ├── sensory.smell (imposible inferir remotamente)
│   ├── sensory.sound.music_curation (requiere criterio musical)
│   ├── space.seating_comfort (requiere sentarse)
│   ├── space.table_spacing (requiere estar ahí)
│   ├── service.friendliness (requiere interacción)
│   ├── service.knowledge (requiere preguntar)
│   ├── functional.wifi (requiere testear)
│   ├── functional.outlets (requiere mirar)
│   ├── functional.laptop_friendly (requiere observar norma social)
│   └── location.access_notes (requiere ir)
│
├── CRITERIO EDITORIAL
│   ├── editorial.tagline (versión final, tono de marca)
│   ├── editorial.description_long (versión final, voz Korantis)
│   ├── editorial.moments.* (versión final narrativa)
│   ├── editorial.mood_sentence (requiere creatividad + precisión)
│   ├── editorial.signals.best_for (juicio curatorial)
│   ├── editorial.signals.not_for (juicio curatorial)
│   └── occasions.*.notes (contexto específico)
│
├── DECISIONES DE PRODUCTO
│   ├── moods.display_tags (cuáles mostrar al usuario)
│   ├── photos.hero (selección de la mejor foto)
│   ├── photos.scenes (curación de galería)
│   ├── status (decisión de publicar o no)
│   └── offering.highlights (qué destacar)
│
└── CALIFICACIONES SUBJETIVAS ALTAS
    ├── aesthetics.design_level (requiere criterio estético)
    ├── aesthetics.style (requiere vocabulario de diseño)
    ├── aesthetics.era_feel (requiere cultura visual)
    ├── demographics.vibe_tribe (requiere observación social)
    └── offering.quality_perception (requiere probar)
```

**Regla:** Todo lo generado por AI se marca como `draft` hasta que un editor lo apruebe. El campo `editorial_status` controla qué se puede publicar.

---

## 6. Campos Inferibles desde Reviews

### Fuentes: Google Maps, TripAdvisor, Yelp, comentarios de Instagram

```
INFERIBLES DESDE REVIEWS (con alta confianza, N>30 reviews):

├── ALTA CONFIANZA (menciones frecuentes y consistentes)
│   ├── sensory.sound.volume_level
│   │   → Keywords: "ruidoso", "tranquilo", "no podíamos hablar", "silencioso"
│   │
│   ├── service.pressure_to_leave
│   │   → Keywords: "nos apuraron", "podés quedarte horas", "te miran"
│   │
│   ├── service.attentiveness
│   │   → Keywords: "atento", "tardaron", "se olvidaron", "impecable"
│   │
│   ├── service.reservation (si necesitás o no)
│   │   → Keywords: "sin reserva imposible", "llegamos sin reserva y entramos"
│   │
│   ├── demographics.typical_group_size
│   │   → Inferido de: "fuimos con mi pareja", "mesa para 6", "fui solo"
│   │
│   ├── offering.price_range
│   │   → Keywords: "caro", "accesible", "relación precio-calidad", montos mencionados
│   │
│   └── space.has_outdoor
│       → Keywords: "terraza", "patio", "mesas afuera", "vereda"
│
├── MEDIA CONFIANZA (requieren más reviews o son ambiguas)
│   ├── sensory.lighting.type
│   │   → Keywords: "oscuro", "luz de velas", "muy iluminado", "luz natural"
│   │
│   ├── sensory.sound.music_type
│   │   → Keywords: "jazz", "electrónica", "sin música", "playlist horrible"
│   │
│   ├── atmosphere.by_timeframe.density
│   │   → Requiere que mencionen hora: "viernes a las 22 lleno", "martes vacío"
│   │
│   ├── space.scale
│   │   → Keywords: "lugar chiquito", "enorme", "pocas mesas", "mucho espacio"
│   │
│   ├── occasions (inferidas de contexto mencionado)
│   │   → "Vinimos por nuestro aniversario" → fecha_especial
│   │   → "Traje la laptop y trabajé toda la tarde" → trabajar_solo
│   │   → "Primera cita y perfecto" → primera_cita
│   │
│   └── moods (inferidos de adjetivos emocionales)
│       → "Tranquilo", "relajado", "zen" → calmo
│       → "Divertido", "con onda", "buena energía" → social/energético
│       → "Romántico", "para dos" → íntimo
│
└── BAJA CONFIANZA (pocas menciones, alta varianza)
    ├── functional.wifi
    │   → Pocos reviews mencionan wifi. Solo si hay patrón.
    │
    ├── aesthetics.design_level
    │   → "Lindo lugar" no dice mucho. "Diseño increíble" sí.
    │
    └── demographics.dress_code
        → Raramente mencionado explícitamente.
```

### Regla de volumen para inferencia:

| Reviews disponibles | Confianza de inferencia | Acción |
|--------------------|-----------------------|--------|
| < 10 | No inferir | Solo datos manuales |
| 10-30 | Inferencia tentativa | Marcar como "estimated" |
| 30-100 | Inferencia confiable | Usar como draft para validación |
| > 100 | Inferencia robusta | Puede publicarse con flag "from_reviews" |

---

## 7. Campos Inferibles desde Imágenes

### Fuentes: Instagram del lugar, Google Maps fotos, fotos editoriales propias

```
INFERIBLES DESDE IMÁGENES (Computer Vision):

├── ALTA CONFIANZA (detección confiable)
│   │
│   ├── sensory.lighting.intensity
│   │   Método: Histograma de luminosidad (canal V en HSV)
│   │   Score: mean_brightness mappeado a 0-5
│   │   Precisión: ~85% con 5+ fotos interiores
│   │
│   ├── sensory.lighting.type (natural vs artificial, cálida vs fría)
│   │   Método: Temperatura de color dominante (Kelvin estimado)
│   │   < 3000K = cálida, 3000-5000K = neutra, > 5000K = fría
│   │   Precisión: ~80%
│   │
│   ├── aesthetics.color_palette
│   │   Método: K-means clustering sobre pixels dominantes
│   │   Output: Top 3-5 colores en hex
│   │   Precisión: ~90%
│   │
│   ├── aesthetics.dominant_materials
│   │   Método: Clasificador entrenado (madera, metal, concreto, ladrillo, plantas)
│   │   Precisión: ~75% con modelo fine-tuned
│   │
│   ├── space.has_outdoor
│   │   Método: Detección de cielo/vegetación/muebles exterior
│   │   Precisión: ~90%
│   │
│   └── photos.*.luminosity_score
│       Método: Cálculo directo sobre imagen
│       Uso: Seleccionar hero foto más representativa
│
├── MEDIA CONFIANZA (requieren múltiples imágenes)
│   │
│   ├── space.scale
│   │   Método: Estimación de profundidad + detección de mesas/sillas
│   │   Limitación: Fotos de Instagram suelen ser close-up
│   │
│   ├── aesthetics.design_level
│   │   Método: Complejidad visual (edge detection + color variance + object diversity)
│   │   Mínimalis = baja complejidad, Maximalist = alta
│   │   Precisión: ~65% (muy subjetivo)
│   │
│   ├── aesthetics.style
│   │   Método: CLIP embedding → clasificador de estilos
│   │   Entrenado con ejemplos: industrial, vintage, minimal, tropical, etc.
│   │   Precisión: ~70%
│   │
│   ├── demographics.dress_code
│   │   Método: Detección de personas + clasificación de vestimenta
│   │   Limitación: Pocas fotos muestran clientes
│   │   Precisión: ~55%
│   │
│   └── space.configuration
│       Método: Detección de barra, mesas, sillas, terraza
│       Precisión: ~75%
│
└── BAJA CONFIANZA (solo como señal complementaria)
    │
    ├── demographics.age_range
    │   Método: Estimación de edad en personas detectadas
    │   Problema: Ético + impreciso + pocas fotos con personas
    │
    ├── atmosphere.density
    │   Método: Conteo de personas en foto
    │   Problema: Una foto ≠ la realidad típica
    │
    └── sensory.sound.music_presence
        Método: NO inferible desde imagen
        (excepto si ves parlantes, DJ booth, instrumentos)
```

### Pipeline de procesamiento de imagen:

```python
def process_venue_photos(venue_id, photos):
    """
    Analiza fotos de un venue y extrae señales visuales.
    """
    results = {
        'lighting': [],
        'colors': [],
        'materials': [],
        'space': [],
        'style': []
    }
    
    for photo in photos:
        img = load_image(photo.url)
        
        # Luminosidad
        hsv = convert_to_hsv(img)
        brightness = mean(hsv[:,:,2])  # Canal V
        results['lighting'].append({
            'brightness': brightness / 255 * 5,  # Mapear a 0-5
            'color_temp': estimate_color_temperature(img)
        })
        
        # Colores dominantes
        colors = kmeans_colors(img, k=5)
        results['colors'].append(colors)
        
        # Materiales (modelo pre-entrenado)
        materials = material_classifier(img)
        results['materials'].append(materials)
        
        # Estilo (CLIP)
        style_embedding = clip_encode(img)
        style_label = classify_style(style_embedding)
        results['style'].append(style_label)
        
        # Escala espacial
        depth_map = estimate_depth(img)
        space_size = estimate_room_size(depth_map)
        results['space'].append(space_size)
    
    # Agregar resultados
    return {
        'lighting_intensity': median([r['brightness'] for r in results['lighting']]),
        'lighting_type': mode([r['color_temp'] for r in results['lighting']]),
        'color_palette': aggregate_colors(results['colors']),
        'dominant_materials': top_materials(results['materials']),
        'aesthetic_style': mode(results['style']),
        'estimated_scale': median(results['space']),
        'confidence': len(photos) / 10  # Más fotos = más confianza, cap 1.0
    }
```

---

## 8. Qué NO Deberíamos Guardar Todavía

### Cosas que son tentadoras pero prematuras:

```
NO GUARDAR (v1):

├── SOCIAL / USER GENERATED
│   ├── Reviews de usuarios de Korantis
│   │   → No somos Yelp. No queremos UGC todavía.
│   │
│   ├── Fotos subidas por usuarios
│   │   → Calidad impredecible. Contamina la estética.
│   │
│   ├── Correcciones de usuarios ("esto está mal")
│   │   → Necesita sistema de moderación. Mes 6+.
│   │
│   ├── Tips/comentarios
│   │   → Complejidad de moderación sin beneficio claro.
│   │
│   └── Check-ins / "Estuve aquí"
│       → Requiere gamification que no queremos.
│
├── MENÚ Y PRECIOS DETALLADOS
│   ├── Menú completo (items + precios)
│   │   → Se desactualiza semanalmente. No es nuestro core.
│   │   → Linkeá al menú externo si existe.
│   │
│   ├── Precio de cada item
│   │   → Mantenimiento imposible. Solo price_range general.
│   │
│   └── Ofertas / happy hour
│       → Cambia constantemente. No somos Groupon.
│
├── REAL-TIME DATA
│   ├── Ocupación en tiempo real
│   │   → Requiere integración con el venue o scraping continuo.
│   │   → Google Popular Times es suficiente como referencia.
│   │
│   ├── Tiempo de espera actual
│   │   → No tenemos cómo saberlo.
│   │
│   ├── Estado del clima actual
│   │   → Se consulta en runtime via API, no se guarda en venue.
│   │
│   └── Eventos en el venue
│       → Alta rotación, difícil mantener. Fase 3.
│
├── COMPARATIVOS Y RANKINGS
│   ├── "Mejor que" / "Similar a"
│   │   → Se calcula con venue_vector en runtime, no se guarda manualmente.
│   │
│   ├── Rankings numéricos ("Top 5 de Palermo")
│   │   → Contrario a la filosofía. No rankeamos, contextualizamos.
│   │
│   └── Premios / certificaciones
│       → Pueden mencionarse en editorial pero no como campo estructurado.
│
├── DATOS DEL NEGOCIO
│   ├── Nombre del dueño / chef
│   │   → No es relevante para el mood. Solo si es parte del atractivo.
│   │
│   ├── Año de apertura
│   │   → Nice to have, no accionable. Fase 3.
│   │
│   ├── Cadena / franquicia info
│   │   → No incluimos cadenas en v1.
│   │
│   └── Facturación / tamaño del negocio
│       → Irrelevante para el usuario.
│
├── DATOS DEMASIADO GRANULARES
│   ├── Score de cada mesa individual
│   │   → Overkill. Score general de seating basta.
│   │
│   ├── Variación por estación del año
│   │   → Válido pero prematuro. Requiere 12 meses de data.
│   │
│   ├── Calidad por plato/bebida
│   │   → No somos críticos gastronómicos.
│   │
│   └── Historial de cambios de carta
│       → No somos food critics.
│
└── INFRAESTRUCTURA PREMATURA
    ├── Sistema de reservas integrado
    │   → Solo link externo.
    │
    ├── Delivery / takeaway
    │   → Fuera de scope permanentemente.
    │
    ├── Loyalty / points
    │   → No.
    │
    └── Partnerships / venues verificados
        → Fase de monetización (mes 6+). No diseñar ahora.
```

---

## Resumen de Prioridades de Carga

### Para llegar a MVP con 50 lugares publicados:

| Prioridad | Qué cargar | Tiempo por venue | Fuente |
|-----------|-----------|-----------------|--------|
| **P0** | Identidad + Ubicación + Horarios | 5 min | Google Maps + verificación |
| **P0** | 1 foto hero de calidad | 5 min | Instagram / Google / propia |
| **P0** | Mood tags (mínimo 2 por franja) | 5 min | Evaluación rápida |
| **P0** | Tagline + descripción corta | 10 min | Editor escribe |
| **P0** | Price range + tipo de oferta | 2 min | Google Maps |
| **P1** | Scores atmosféricos (1 franja) | 10 min | Visita o inferencia |
| **P1** | Ocasiones (top 3) | 5 min | Criterio editorial |
| **P1** | Espacio: escala + configuración | 3 min | Fotos / visita |
| **P2** | Descripción larga + momentos del día | 15 min | Editor escribe |
| **P2** | 3-5 fotos adicionales | 10 min | Curación |
| **P2** | Scores atmosféricos (todas las franjas) | 15 min | Visita completa |
| **P3** | Sensorial detallado | 10 min | Visita |
| **P3** | Demografía completa | 5 min | Observación |
| **P3** | Links externos completos | 5 min | Research |

### Tiempo total por venue:

| Nivel | Campos | Tiempo | Calidad de ficha |
|-------|--------|--------|-----------------|
| Mínimo publicable | P0 | ~30 min | Ficha básica funcional |
| Ficha buena | P0 + P1 | ~50 min | Recomendable |
| Ficha completa | P0 + P1 + P2 | ~80 min | Experiencia rica |
| Ficha perfecta | Todos | ~120 min | Showcase |

### Objetivo MVP: 50 venues a nivel "Ficha buena" = ~42 horas de trabajo editorial.

---

## Checklist de Validación Pre-Publicación

```
ANTES DE PUBLICAR UN VENUE:

□ ¿El nombre está verificado y correcto?
□ ¿La dirección y coordenadas son precisas? (verificar en mapa)
□ ¿Los horarios tienen fuente? (Google, sitio web, llamada)
□ ¿Hay al menos 1 foto que comunica la atmósfera?
□ ¿Los mood tags son honestos? (no aspiracionales)
□ ¿La descripción corta NO es genérica?
□ ¿El price range está basado en data real?
□ ¿El link de "cómo llegar" funciona?
□ ¿La confidence_score es ≥ 0.5?
□ ¿Al menos 1 editor revisó la ficha?
□ ¿El lugar sigue abierto? (verificar actividad en Instagram/Google)
```
User: Analizá Korantis frente a Google Maps, Yelp, TripAdvisor, TikTok, Instagram, Time Out, The Infatuation y Spotify como referencia de mood discovery.

Quiero:
1. Tabla comparativa.
2. Qué hace cada uno mejor.
3. Qué espacio libre queda.
4. Qué debería copiar Korantis.
5. Qué debería evitar.
6. Qué propuesta única puede defender.
7. Cómo explicarlo en una frase para usuarios.
8. Cómo explicarlo en una frase para inversores.
Model: # Análisis Competitivo — Korantis vs. El Ecosistema

---

## 1. Tabla Comparativa

| Dimensión | Google Maps | Yelp | TripAdvisor | TikTok | Instagram | Time Out | The Infatuation | Spotify (ref) | **Korantis** |
|-----------|------------|------|-------------|--------|-----------|----------|-----------------|---------------|-------------|
| **Modelo de descubrimiento** | Búsqueda funcional | Reviews + búsqueda | Rankings + reviews | Algoritmo viral | Feed social | Editorial + listas | Editorial + voz autoral | Algoritmo de gusto | **Mood + contexto + editorial** |
| **Input del usuario** | "Qué" + "dónde" | "Qué" + "dónde" + filtros | "Qué" + "dónde" + ranking | Ninguno (pasivo) | Ninguno (pasivo) | Browse por categoría | Browse por ciudad/tipo | Escucha pasiva | **"Cómo me quiero sentir"** |
| **Criterio de orden** | Relevancia + distancia + ads | Rating + reviews + distancia | Popularidad + reviews | Viralidad + engagement | Engagement + recencia | Curaduría editorial | Opinión editorial | Similaridad + gusto | **Resonancia emocional contextual** |
| **Personalización** | Basada en historial de búsqueda | Mínima | Mínima | Altísima (por engagement) | Alta (por engagement) | Ninguna | Ninguna | Altísima (por gusto) | **Por mood + historial de guardado** |
| **Temporalidad** | Estática (horarios) | Estática | Estática | Efímera (feed infinito) | Efímera (stories 24h) | Semanal/mensual | Artículos estáticos | Tiempo real | **Contextual (hora + día + clima)** |
| **Confianza** | Volumen de reviews | Volumen de reviews | Volumen + ranking | Carisma del creador | Estética del post | Marca editorial | Voz editorial | Algoritmo invisible | **Curación editorial + consistencia** |
| **Voz** | Ninguna (neutral) | Miles de voces anónimas | Miles de voces turistas | Creadores individuales | Creadores/marcas | Periodística distante | Personal, con opinión | Sin voz (datos) | **Autoral, atmosférica, subjetiva** |
| **Emocionalidad** | Cero | Baja (transaccional) | Baja (informacional) | Alta (entretenimiento) | Alta (aspiracional) | Media (informativa) | Media-alta (opinión) | Alta (soundtrack personal) | **Máxima (es el core)** |
| **Momento del día** | No relevante | No relevante | No relevante | No relevante | No relevante | Parcial (listas "brunch") | Parcial | Sí (Daily Mix) | **Central (scoring por franja)** |
| **Tipo de usuario** | Todos | Buscador activo/quejoso | Turista planificador | Scroll pasivo, Gen Z | Inspiración visual | Urbanita planificador | Foodie/dater urbano | Cualquiera con oídos | **Urbano intencional con gusto** |
| **Monetización** | Ads + promoted | Ads + claimed profiles | Ads + booking | Creator fund + ads | Ads + shopping | Ads + ticketing | Branded content + Amex | Premium + ads | **Promoted contextual + premium** |
| **Mobile experience** | Excelente | Mediocre | Mediocre | Nativa perfecta | Nativa perfecta | Aceptable | Buena | Excelente | **Mobile-first (objetivo)** |
| **Debilidad principal** | Sin emoción ni contexto | Cultura tóxica de reviews | Turístico y desactualizado | Ruido, no intención | Efímero, no buscable | Genérico, no personal | Solo 5 ciudades, no escala | No aplica a venues | **Catálogo chico, marca nueva** |

---

## 2. Qué Hace Cada Uno Mejor

### Google Maps
**Lo mejor:** Información funcional completa e instantánea.
- Horarios en tiempo real, verificados.
- Popular Times (cuándo está lleno).
- Direcciones integradas con transporte.
- Fotos de usuarios en volumen masivo.
- Universal: todos lo tienen instalado.

**Su superpoder:** Es la respuesta a "¿dónde queda?" y "¿está abierto?". Infraestructura imbatible.

---

### Yelp
**Lo mejor:** Volumen de opinión estructurada.
- Reviews largas con contexto.
- Filtros funcionales (precio, hora, tipo).
- Fotos de usuarios del plato/espacio real.
- Sistema de "útil/divertida/cool" que surfacea buenas reviews.

**Su superpoder:** Cuando querés una opinión detallada de alguien que fue, Yelp tiene más texto por review que nadie.

---

### TripAdvisor
**Lo mejor:** Escala global y confianza por volumen.
- Millones de reviews, cubre hasta pueblos chicos.
- Rankings por categoría ("Top 10 de BA").
- Funciona como validación: "Si está en el top 50, no va a ser malo."

**Su superpoder:** Reducción de riesgo para turistas. "No voy a comer mal si elijo algo del top."

---

### TikTok
**Lo mejor:** Descubrimiento accidental de alta intensidad.
- Videos cortos que transmiten atmósfera real (sonido, movimiento, gente).
- Algoritmo que entrega contenido relevante sin que busques.
- Autenticidad percibida: "gente real, no publicidad."
- Viralidad: un lugar pasa de desconocido a lleno en 48 horas.

**Su superpoder:** Te muestra lugares que no sabías que existían, con la energía real capturada en video.

---

### Instagram
**Lo mejor:** Aspiración visual y curación estética.
- Fotos de alta calidad que comunican la "vibe" de un lugar.
- Stories como contenido efímero de "estoy acá ahora".
- Geotags y hashtags como discovery path.
- Saves y Collections como sistema de bookmarking personal.

**Su superpoder:** Define el deseo. Ves una foto de un bar con luz dorada y QUERÉS estar ahí.

---

### Time Out
**Lo mejor:** Curaduría editorial con cobertura urbana.
- Listas temáticas ("Best rooftops", "Where to eat alone").
- Actualización frecuente con contenido estacional.
- Credibilidad de marca periodística.
- Cobertura de ciudades globales.

**Su superpoder:** "Alguien con criterio ya hizo la selección por mí."

---

### The Infatuation
**Lo mejor:** Voz editorial con personalidad y utilidad.
- Reviews escritas como una persona te habla, no como un artículo.
- "Perfect For" tags (what it's perfect for: dates, groups, impressing someone).
- Sistema de rating simplificado (no 1-5 stars, sino categorías cualitativas).
- Newsletter como canal de retención.
- Integración con EATER y NY Mag (Vox Media).

**Su superpoder:** Voz humana con opinión que genera confianza. Sentís que un amigo con buen gusto te recomienda.

---

### Spotify (como referencia de mood discovery)
**Lo mejor:** Personalización emocional a escala.
- Mood playlists ("Chill", "Focus", "Party").
- Daily Mix personalizado que mejora con el uso.
- Discover Weekly: descubrimiento algorítmico que se siente mágico.
- Wrapped: tu personalidad musical reflejada en datos.
- No te pide que hagas nada: solo escuchá y mejora.

**Su superpoder:** Convirtió la personalización pasiva en una experiencia emocional. "Spotify me conoce mejor que mis amigos."

---

## 3. Qué Espacio Libre Queda

### El mapa de necesidades no cubiertas:

```
                    FUNCIONAL ←————————————→ EMOCIONAL
                         │                        │
         PERSONALIZADO   │                        │
              ↑          │                        │
              │     [Spotify]              [KORANTIS]
              │          │                    ↗
              │          │                  ↗
              │    [Google Maps]     [The Infatuation]
              │          │               │
              │          │          [Time Out]
              │          │               │
         GENÉRICO   [Yelp]         [Instagram]
              ↓     [TripAdvisor]    [TikTok]
                         │                │
                         │                │
```

### Los gaps específicos que nadie llena:

**Gap 1: Búsqueda por estado emocional**
- Nadie te deja buscar "quiero estar tranquilo" como input primario.
- Google: busca por categoría. Yelp: busca por categoría + filtros. Instagram: no busca, scrollea.
- **Korantis llena esto.**

**Gap 2: Relevancia temporal contextual**
- Nadie te dice "este lugar es mejor a las 19hs que a las 22hs".
- Google tiene Popular Times (ocupación) pero no atmósfera por hora.
- **Korantis llena esto.**

**Gap 3: Recomendación por ocasión/intención social**
- Nadie te pregunta "¿vas solo, en cita, con amigos?" como filtro primario.
- The Infatuation lo hace parcialmente con "Perfect For" tags, pero no es filtrable ni personalizado.
- **Korantis llena esto.**

**Gap 4: Personalización de gusto gastronómico/atmosférico**
- Spotify personalizó la música. Nadie personalizó el salir.
- Instagram te muestra lo popular para todos, no lo relevante para vos.
- **Korantis llena esto.**

**Gap 5: Información atmosférica estructurada**
- ¿Cómo suena? ¿Cómo huele? ¿Cómo se ilumina? ¿Qué tan cómodo es el asiento? → Nadie estructura esto como data consultable.
- Está disperso en reviews que nadie lee completas.
- **Korantis llena esto.**

**Gap 6: Curación editorial + personalización algorítmica**
- Time Out y The Infatuation curan pero no personalizan.
- TikTok e Instagram personalizan pero no curan.
- Nadie combina ambas.
- **Korantis puede llenar esto.**

---

## 4. Qué Debería Copiar Korantis

### De Spotify:

| Qué copiar | Cómo aplicarlo |
|------------|---------------|
| **Mood como categoría primaria** | Ya lo hacés. Pills de mood como entrada principal al feed. |
| **Personalización pasiva** | No pedir input explícito. Observar guardados, tiempo en ficha, filtros usados. Mejorar el feed silenciosamente. |
| **Daily Mix / Discover Weekly** | "Tu semana Korantis": 5 lugares nuevos que coinciden con tu perfil, entregados cada lunes. |
| **Wrapped** | "Tu año Korantis": cuántos lugares descubriste, tus moods predominantes, tus barrios. Compartible. |
| **Home contextual por hora** | "Buenos días" → cafés calmos. "Buenas noches" → bares con energía. Como Spotify cambia el saludo y los playlists sugeridos. |
| **Simpleza del input** | El usuario no trabaja. Solo usa. El sistema aprende. Cero configuración. |

### De The Infatuation:

| Qué copiar | Cómo aplicarlo |
|------------|---------------|
| **"Perfect For" tags** | Ya tenés ocasiones. Hacerlas más visibles: en la card, no solo en la ficha. |
| **Voz editorial con personalidad** | Ya lo hacés. Mantener el tono autoral. No volverse genérico. |
| **Sistema de rating no numérico** | Nunca pongas estrellas. Mood tags como "calificación emocional" es superior. |
| **Newsletter como retention** | Email semanal: "3 lugares nuevos para tu mood". Bajo esfuerzo, alto retorno. |

### De Instagram:

| Qué copiar | Cómo aplicarlo |
|------------|---------------|
| **Saves + Collections** | Sistema de guardado con colecciones nombradas. Es tu feature de retención #1. |
| **Full-screen imagery** | Fotos grandes y atmosféricas como primer elemento de cada card. La foto vende. |
| **Share to Stories** | Botón "Compartir en IG Stories" con template visual Korantis (branded). |
| **Geotag como discovery path** | Barrio como filtro navegable. "Ver más en Palermo" → feed filtrado. |

### De TikTok:

| Qué copiar | Cómo aplicarlo |
|------------|---------------|
| **Mostrar antes de explicar** | La primera experiencia es contenido, no onboarding. |
| **Contenido que transmite energía** | Las fotos deben capturar ATMÓSFERA, no solo estética. Gente moviéndose, luz real, escenas vivas. |
| **Serendipia** | Feed "Para vos" con descubrimiento inesperado. No solo lo que buscaste, también lo que no sabías que querías. |

### De Google Maps:

| Qué copiar | Cómo aplicarlo |
|------------|---------------|
| **"Cómo llegar" en 1 tap** | Deeplink directo a Google/Apple Maps. Sin fricción. |
| **Verificación de horarios** | Priorizar precisión de horarios. Nada frustra más que ir y encontrar cerrado. |
| **Velocidad de carga** | La ficha debe abrir instantáneamente. Pre-load de imágenes. Performance obsession. |

---

## 5. Qué Debería Evitar Korantis

### De Google Maps — NO copiar:

| Qué evitar | Por qué |
|------------|---------|
| Ratings numéricos (4.3 estrellas) | Reducen un lugar a un número sin contexto. Tu valor es el contexto. |
| Mostrar TODO lo cercano | El volumen sin filtro es ruido. Korantis muestra poco pero relevante. |
| Dejar que cualquiera suba fotos | Mata la calidad estética. Las fotos son curadas. |
| Ads como primer resultado | Destruye confianza. Si monetizás con placement, que sea orgánico y transparente. |

### De Yelp — NO copiar:

| Qué evitar | Por qué |
|------------|---------|
| Reviews de usuarios | Cultura de quejas. Varianza enorme de calidad. Moderación pesadilla. |
| Rating crowd-sourced | Un 3.5 no dice nada. 1000 opiniones ≠ 1 buena curación. |
| Tonos de guerra (dueños vs reviewers) | Tóxico. Korantis es editorial, no democrático. |
| UGC como contenido primario | Pierde el control de tono y calidad. |
| Elite Squad / gamification | Incentiva comportamiento performático, no auténtico. |

### De TripAdvisor — NO copiar:

| Qué evitar | Por qué |
|------------|---------|
| Rankings ("Top 10") | Crea jerarquías estáticas. Un lugar no es "mejor" que otro, es mejor PARA ALGO. |
| Diseño para turistas | Tu core user es el local. El turista es bienvenido pero no diseñás para él. |
| Certificados / badges de premio | Se siente corporativo y dated. |
| Booking integrado | Complejidad innecesaria. Link externo basta. |

### De TikTok — NO copiar:

| Qué evitar | Por qué |
|------------|---------|
| Viralidad como métrica | Lo viral ≠ lo bueno para vos. Un bar que explota en TikTok probablemente está lleno y arruinado. |
| Contenido efímero | Tu data es permanente y consultable. No desaparece en 24hs. |
| Optimización por tiempo en pantalla | Korantis optimiza por DECISIÓN (guardó + fue), no por adicción (scrolleó 30 minutos). |
| Creators como fuente editorial | Pierde control de voz. La voz es Korantis, no un influencer. |

### De Instagram — NO copiar:

| Qué evitar | Por qué |
|------------|---------|
| Feed cronológico/social | No sos red social. No hay follows entre usuarios. |
| Contenido del venue como marketing | Los venues no postean en Korantis. No es una plataforma para ellos. |
| Likes públicos | Sin vanity metrics. |
| DMs / interacción social | No. Es una herramienta personal, no una comunidad. |

### De Time Out — NO copiar:

| Qué evitar | Por qué |
|------------|---------|
| Listas genéricas ("Best 50") | Es contenido SEO, no discovery personal. |
| Tono periodístico neutral | Time Out es informativo. Korantis es atmosférico. Diferente registro. |
| Cobertura de "todo" (eventos, teatro, museos) | Focus: cafés, bares, restaurantes. Nada más. |
| Display advertising intrusiva | Destruye la experiencia premium. |

---

## 6. Qué Propuesta Única Puede Defender Korantis

### El posicionamiento defensible:

> **Korantis es la única plataforma que recomienda lugares gastronómicos por resonancia emocional personal y contextual.**

### Desglose de la defensa:

**¿Por qué es difícil de copiar?**

| Componente | Dificultad de réplica | Por qué |
|-----------|----------------------|---------|
| Taxonomía emocional (8 moods × 3 franjas × N lugares) | Alta | Requiere evaluación in-situ y criterio editorial que no se automatiza completamente. Es work, no tech. |
| Scoring atmosférico por hora del día | Alta | Nadie tiene esta data estructurada. Google tiene Popular Times (ocupación) pero no atmósfera. |
| Voz editorial con tono propio | Media-alta | Contratable pero difícil de replicar sin alma. La voz se construye, no se compra. |
| Perfil de gusto pasivo | Media | Spotify lo hace para música. Nadie lo hace bien para venues. First-mover advantage. |
| Catálogo curado (no exhaustivo) | Media | La restricción ES el valor. Copiar el modelo requiere aceptar no cubrir todo, que es contra-intuitivo para big tech. |
| Ranking por resonancia (no popularidad) | Media | Google, Yelp y TripAdvisor están atados a su modelo de ratings. Cambiarlo canibaliza su producto. No lo van a hacer. |

**¿Qué competidor podría copiarte y por qué probablemente no lo hará?**

| Competidor | ¿Podría copiar? | ¿Lo hará? | Por qué no |
|-----------|----------------|-----------|-----------|
| Google Maps | Sí (tiene la data y el reach) | No | Su modelo es universalidad. Curación subjetiva contradice su ADN de "toda la información para todos". |
| Yelp | Parcialmente | No | Está atado a reviews de usuarios. Eliminar UGC mataría su engagement. |
| Instagram | Podría agregar mood tags | Improbable | Es una plataforma de creators, no de curación editorial. No controlan la voz. |
| TikTok | Podría agregar discovery estructurado | No | Su modelo es video viral. Buscar por mood es un UX pattern que contradice el scroll pasivo. |
| The Infatuation | Es el competidor más cercano | Parcialmente | Tienen la voz editorial pero no la personalización, no el mood-first, no la app. Están integrados en Vox Media y su modelo es contenido, no producto. |
| Time Out | Podría | Improbable | Son demasiado grandes y genéricos. Agregar personalización requiere cambiar todo su stack. |
| Spotify | Podría extender su modelo a venues | Quizás eventualmente | Pero venues no son su core business. Si lo hacen, serás el caso de estudio que valida la categoría (y podrías ser adquirido). |

### Los 3 fosos defensibles:

1. **Data propietaria:** El scoring emocional por franja horaria no existe en ningún otro dataset. Es tuyo. Crece con cada evaluación.

2. **Gusto acumulado:** Cada usuario que guarda lugares construye un perfil que mejora el servicio. Más uso → mejores recomendaciones → más uso. Flywheel.

3. **Voz editorial como marca:** La personalidad de Korantis no se puede replicar con AI genérica. Es un tono que se cultiva. Como The New Yorker tiene una voz que nadie puede copiar aunque el contenido sea similar.

---

## 7. Cómo Explicarlo en Una Frase para Usuarios

### Opciones rankeadas por claridad:

**Para el app store / onboarding:**

> "Encontrá el lugar perfecto para cómo te sentís ahora."

**Para la home:**

> "Lugares para cómo querés sentirte." ← (ya la tenés, funciona)

**Para explicar en 10 segundos a un amigo:**

> "Es como Spotify pero para bares y cafés: te recomienda por mood, no por rating."

**Para Instagram bio / share card:**

> "Descubrí bares, cafés y restaurantes por mood, momento y energía."

**Para WhatsApp cuando alguien pregunta "¿qué es?":**

> "Una app que te dice adónde ir según cómo te querés sentir. Le decís 'quiero un lugar calmo para estar solo un rato' y te da opciones perfectas."

### La frase ganadora (por claridad + memorabilidad + diferenciación):

> **"Korantis te dice adónde ir según cómo te querés sentir."**

12 palabras. Cubre: qué hace (te dice adónde ir), cómo lo hace (según cómo te querés sentir), por qué es diferente (nadie más usa mood como input).

---

## 8. Cómo Explicarlo en Una Frase para Inversores

### Opciones por tipo de inversor:

**Para VC generalista (pitch rápido, elevator):**

> "Somos el Spotify del descubrimiento urbano: recomendamos bares, cafés y restaurantes por mood y contexto emocional, no por ratings ni popularidad."

**Para VC con thesis en consumer + AI:**

> "Construimos un recommendation engine emocional para gastronomía: clasificamos cada lugar por atmósfera, momento del día y ocasión, y personalizamos el descubrimiento como Spotify personalizó la música."

**Para VC con thesis en marketplaces:**

> "Monetizamos el momento de decisión más valioso en gastronomía: cuando alguien sabe que quiere salir pero no sabe adónde. Nuestro placement contextual vale 10x más que un ad en Google porque la intención de compra es total y el filtro es emocional."

**Para angel investor (más narrativo):**

> "Hoy, 100 millones de personas se preguntan 'adónde voy esta noche' y la respuesta es un chat de WhatsApp o scroll infinito en Instagram. Korantis reemplaza eso con recomendaciones personalizadas por mood: un marketplace emocional donde cada lugar está clasificado por cómo te hace sentir, no por cuántas estrellas tiene."

**Para inversor escéptico (por qué ahora, por qué vos):**

> "Tres cosas convergen: (1) la gente odia elegir entre 200 opciones iguales en Google Maps, (2) los LLMs permiten por primera vez clasificar miles de venues por atmósfera procesando reviews + fotos automáticamente, (3) los venues necesitan un canal de adquisición que no sea Instagram ads ni Rappi. Nosotros conectamos los tres."

### La frase ganadora:

> **"Somos el recommendation engine emocional para gastronomía: Spotify personalizó la música por mood, nosotros personalizamos la ciudad."**

**Por qué funciona para inversores:**
- "Recommendation engine" → tech, defensible, mejora con data.
- "Emocional" → diferenciación clara vs. incumbents funcionales.
- "Gastronomía" → mercado enorme, monetizable.
- "Spotify personalizó la música" → modelo mental instantáneo, validado.
- "Nosotros personalizamos la ciudad" → ambición grande, extensible.

---

## Síntesis Visual: El Terreno Competitivo

```
         NADIE TE AYUDA          ALGUIEN TE AYUDA
         A DECIDIR               A DECIDIR
              │                        │
              │                        │
   POPULAR    │  Instagram             │  Google Maps
              │  TikTok               │  Yelp
              │                        │  TripAdvisor
              │                        │
   ──────────────────────────────────────────────────
              │                        │
              │                        │  Time Out
   CURADO     │                        │  The Infatuation
              │                        │
              │                        │  ★ KORANTIS ★
              │                        │  (curado + personal
   PERSONAL   │  Spotify               │   + contextual)
              │  (pero no venues)      │
              │                        │
```

**Korantis ocupa el único cuadrante vacío: curado + personal + que ayuda a decidir.**

Instagram y TikTok son personales pero no ayudan a decidir (entretienen).
Google y Yelp ayudan a decidir pero no son personales ni curados (son volumen).
Time Out y The Infatuation son curados pero no personales (son editoriales broadcast).

**Korantis es el primer producto que combina los tres: curación editorial + personalización algorítmica + acción de decisión.**

Ese es el espacio. Ese es el pitch. Ese es el producto.
User: Diseñá la arquitectura UX completa de Korantis mobile-first. El producto tiene tres áreas principales:
- Explore: descubrimiento visual de lugares.
- Atlas: mapa espacial de lugares guardados y cercanos.
- Taste: perfil de gustos, swipes y memoria del usuario.

Necesito:
1. Navegación principal.
2. Flujo de onboarding.
3. Home inicial.
4. Search experience.
5. Venue detail.
6. Save flow.
7. Taste profile.
8. Empty states.
9. Qué pantallas sobran.
10. Qué deberíamos construir primero para MVP.
Model: # Arquitectura UX Completa — Korantis Mobile-First

---

## 1. Navegación Principal

### Bottom Tab Bar (Fija, siempre visible)

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   ◎ Explore      ◎ Atlas      ◎ Saved     ◎ You │
│   Explorar       Atlas       Guardados     Vos   │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Justificación de 4 tabs (no 3):

| Tab | Función | Por qué existe |
|-----|---------|---------------|
| **Explore** | Feed de descubrimiento. Entry point principal. | Es el core: descubrir lugares nuevos. |
| **Atlas** | Mapa. Descubrimiento geográfico. | Complementa Explore con capa espacial. |
| **Saved** | Lugares guardados + colecciones. | Sin esto no hay retención. Es la memoria del usuario. |
| **You** | Perfil de gusto + settings. | Concentra lo personal sin contaminar el feed. |

### Por qué no "Taste" como tab:

El nombre "Taste" es poético pero no funcional. "Vos" o "You" es más claro para un tab que contiene perfil de gustos, configuración y lo personal. Además, separar "Guardados" de "Perfil" permite:
- Acceso directo a guardados (alta frecuencia de uso).
- Perfil como destino secundario (baja frecuencia, alto valor percibido).

### Íconos:

```
Explore:  ◎ (brújula simplificada o spark/estrella)
Atlas:    ◎ (mapa/pin)
Saved:    ◎ (bookmark)
You:      ◎ (círculo usuario)
```

### Comportamiento:

- Tab activo: ícono + label en dorado.
- Tabs inactivos: ícono en gris/blanco tenue, sin label o label dim.
- Tap en tab activo: scroll to top.
- Badge en Saved: solo cuando hay un nuevo lugar recomendado que coincide con perfil (máximo 1x por semana).

---

### Header (Fijo, contextual por pantalla)

```
EXPLORE:
┌─────────────────────────────────────┐
│ ✦ KORANTIS         Buenos Aires ▼  │
└─────────────────────────────────────┘

ATLAS:
┌─────────────────────────────────────┐
│ ← Atlas            Buenos Aires ▼  │
└─────────────────────────────────────┘

SAVED:
┌─────────────────────────────────────┐
│ Guardados                    [+ ⋮] │
└─────────────────────────────────────┘

YOU:
┌─────────────────────────────────────┐
│ Tu gusto                      [⚙]  │
└─────────────────────────────────────┘
```

### Navegación secundaria (dentro de pantallas):

- **Venue Detail**: pantalla completa con back button (←). No es un tab, es push navigation.
- **Search**: modal fullscreen que se abre sobre Explore.
- **Collection detail**: push desde Saved.
- **Settings**: push desde You.

---

## 2. Flujo de Onboarding

### Principio: Mínimo viable, máximo valor inmediato.

No existe "onboarding largo". El usuario debe ver contenido real en menos de 30 segundos desde que abre la app. Toda calibración es posterior al primer valor entregado.

### Flujo:

```
INSTALACIÓN → APERTURA

┌─────────────────────────────────────┐
│         PANTALLA 1 / 3              │
│                                     │
│    ✦ KORANTIS                       │
│                                     │
│    Lugares para cómo               │
│    querés sentirte.                 │
│                                     │
│    Descubrí bares, cafés y         │
│    restaurantes por mood,          │
│    momento y energía.              │
│                                     │
│         [Empezar →]                 │
│                                     │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│         PANTALLA 2 / 3              │
│                                     │
│    ¿Dónde estás?                   │
│                                     │
│    ┌─────────────────────────┐     │
│    │  ◉ Buenos Aires         │     │
│    └─────────────────────────┘     │
│    ┌─────────────────────────┐     │
│    │  ○ New York             │     │
│    └─────────────────────────┘     │
│                                     │
│    [Usar mi ubicación]              │
│                                     │
│         [Continuar →]               │
│                                     │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│         PANTALLA 3 / 3              │
│                                     │
│    ¿Qué te atrae más?             │
│    Elegí 2 o más.                  │
│                                     │
│    ┌──────┐ ┌──────┐ ┌──────┐     │
│    │Calmo │ │Íntimo│ │Social│     │
│    └──────┘ └──────┘ └──────┘     │
│    ┌──────────┐ ┌─────────┐       │
│    │Energético│ │ Refugio │       │
│    └──────────┘ └─────────┘       │
│    ┌────────────┐ ┌───────────┐   │
│    │Contemplat. │ │Productivo │   │
│    └────────────┘ └───────────┘   │
│                                     │
│    (mínimo 2 seleccionados)        │
│                                     │
│         [Explorar →]                │
│                                     │
└─────────────────────────────────────┘
          │
          ▼
     HOME / EXPLORE
     (feed personalizado con los moods elegidos como peso inicial)
```

### Decisiones clave:

1. **3 pantallas máximo.** No más. Cada pantalla extra pierde 20-30% de usuarios.
2. **No pedir email/registro todavía.** Dejá que explore. Pedí registro cuando quiera guardar su primer lugar.
3. **La selección de moods no es obligatoria.** "Saltar" como opción (texto small debajo del botón). Si salta, feed general sin personalización.
4. **La selección de moods alimenta el feed inicial** pero NO es definitiva. Cambia con el uso.
5. **Permiso de ubicación:** Pedirlo en pantalla 2 con contexto ("para mostrarte lugares cerca"). Si rechaza, funciona con ciudad seleccionada manualmente.

### Qué NO incluir en onboarding:

- ❌ Crear cuenta / login
- ❌ Explicación de cómo funciona el algoritmo
- ❌ Tour de features
- ❌ Selección de barrios favoritos
- ❌ Swipe de lugares (eso es retención, no onboarding)
- ❌ Pedir notificaciones (pedir en momento contextual posterior)

---

## 3. Home Inicial (Explore)

### Estructura completa:

```
┌─────────────────────────────────────┐
│ HEADER FIJO                         │
│ ✦ KORANTIS         Buenos Aires ▼  │
├─────────────────────────────────────┤
│ SEARCH BAR (tappable, no editable)  │
│ 🔍 Buscar lugar, mood, barrio...   │
├─────────────────────────────────────┤
│ MOOD PILLS (scroll horizontal)      │
│ [Calmo] [Íntimo] [Social]          │
│ [Energético] [Refugio] [Todos]     │
├─────────────────────────────────────┤
│                                     │
│ ▸ SECCIÓN 1: CONTEXTUAL            │
│ "Para esta noche" (19-02)          │
│ o "Tu mañana" (7-12)              │
│ o "Tu tarde" (12-19)              │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ │ img  │ │ img  │ │ img  │        │
│ │nombre│ │nombre│ │nombre│        │
│ │tags  │ │tags  │ │tags  │        │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ ▸ SECCIÓN 2: EDITORIAL CURADA      │
│ "Recién sumados" o "Lo nuevo"      │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ [FOTO GRANDE ATMOSFÉRICA]     │  │
│ │                               │  │
│ │ Nombre del lugar         [♡]  │  │
│ │ Barrio · Tipo                 │  │
│ │ "Una línea evocadora."        │  │
│ │ [Calmo] [Dorado] [Noche]     │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ [FOTO GRANDE ATMOSFÉRICA]     │  │
│ │ ...                           │  │
│ └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ ▸ SECCIÓN 3: TEMÁTICA              │
│ "Para estar solo"                   │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ ▸ SECCIÓN 4: TEMÁTICA              │
│ "Citas sin ruido"                   │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ ▸ SECCIÓN 5: POR BARRIO            │
│ "Explorá por zona"                  │
│                                     │
│ [Palermo] [San Telmo] [Recoleta]   │
│ [V. Crespo] [Belgrano] [Centro]   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ ▸ SECCIÓN 6: MÁS DESCUBRIMIENTO   │
│ "Donde nadie te apura"             │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
├─────────────────────────────────────┤
│         [Fin del feed]              │
│  "Nuevos lugares cada semana."      │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ◎ Explore  ◎ Atlas  ◎ Saved  ◎ You│
└─────────────────────────────────────┘
```

### Detalle de componentes:

#### Search Bar:
- **No es editable inline.** Es un botón que al tappear abre Search fullscreen.
- Placeholder rotativo: "café tranquilo…" → "bar para cita…" → "terraza con vista…"
- Visual: input con fondo sutil, ícono de lupa, borde redondeado.

#### Mood Pills:
- Scroll horizontal. 6-8 pills visibles.
- Estados: default (borde sutil) → selected (fondo dorado, texto oscuro).
- **Comportamiento al seleccionar un pill:** El feed debajo se filtra instantáneamente (no recarga de página, no loading screen). Las secciones se reordenan mostrando solo lugares que matchean el mood seleccionado.
- "Todos" como último pill: resetea filtro.
- Múltiple selección: sí. Puedo tap "Calmo" + "Íntimo" y ver la intersección.

#### Cards — Carrusel horizontal (compactas):
```
┌─────────────┐
│ [Foto]      │  140x180px aprox
│             │
│ Nombre      │  Bold, 14px
│ Barrio      │  Light, 12px, gris
│ [tag] [tag] │  Pills mini, 10px
└─────────────┘
```
- Tap → abre Venue Detail.
- No tiene botón de guardar visible (para mantener limpieza). Guardar es desde la ficha o long-press.

#### Cards — Full-width (editoriales):
```
┌───────────────────────────────────────┐
│ [FOTO ATMOSFÉRICA - 100% ancho]      │
│ [aspect ratio 16:9 o 3:2]            │
│                                       │
│                              [♡]      │  ← Bookmark icon, esquina
│                                       │
│ Nombre del lugar                      │  Bold, 18px
│ San Telmo · Bar · $$                  │  Light, 13px
│                                       │
│ "Un murmullo dorado donde el          │  Italic, 14px, 1-2 líneas max
│  tiempo no existe."                   │
│                                       │
│ [Calmo] [Íntimo] [Noche]            │  Mood pills, 11px
└───────────────────────────────────────┘
```
- Tap en foto o nombre → Venue Detail.
- Tap en [♡] → Guardar con feedback (ver Save Flow).
- La descripción es EL TAGLINE del lugar (max 80 chars).

#### Secciones temáticas:
Son carruseles horizontales con título editorial. Ejemplos:

| Título | Criterio real | Cambia? |
|--------|--------------|---------|
| "Para esta noche" | Mood alto para franja actual + abierto + cerca | Cada 6 horas |
| "Recién sumados" | Últimos 14 días de publicación | Semanal |
| "Para estar solo" | Occasion: estar_solo score ≥ 4 | Fijo (curado) |
| "Citas sin ruido" | Occasion: primera_cita + conversation_ease ≥ 4 | Fijo |
| "Donde nadie te apura" | rotation_pressure ≤ 1 | Fijo |
| "Rincones escondidos" | permeability ≤ 2 + scale: small | Fijo |
| "Energía de viernes" | mood: energético/social + noche | Solo jueves-sábado |

**Regla de rotación:** Las secciones fijas rotan posición cada semana. Las contextuales aparecen solo cuando son relevantes (hora, día).

---

### Variación de la Home por hora:

| Hora | Sección 1 | Sección 2 | Tono |
|------|-----------|-----------|------|
| 7-10 | "Tu mañana" (cafés calmos) | "Para arrancar" (productivos) | Suave, luz |
| 10-14 | "Un mediodía" (brunch, almuerzos) | "Trabajar afuera" | Funcional, amable |
| 14-18 | "Tu tarde" (cafés, meriendas) | "Copa tranquila" | Relajado |
| 18-21 | "Para esta noche" (after office, cenas) | "Before dinner" | Transición |
| 21-02 | "Tu noche" (bares, cenas late) | "Salir de verdad" | Energético, oscuro |

---

## 4. Search Experience

### Apertura:

Tap en search bar → modal fullscreen con transición suave (slide up).

### Pantalla de búsqueda:

```
┌─────────────────────────────────────┐
│ [←]  [________________🔍]  [Cancel] │
│       input activo, keyboard up      │
├─────────────────────────────────────┤
│                                     │
│ BÚSQUEDAS RECIENTES                │
│ ├── café tranquilo palermo          │
│ ├── bar para cita                   │
│ └── Florería Atlántico              │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ SUGERENCIAS DE MOOD                 │
│ ├── ☁ "Necesito silencio"          │
│ ├── 🔥 "Algo con energía"          │
│ ├── 🌙 "Lugar íntimo para dos"     │
│ ├── ☀ "Terraza con sol"            │
│ └── 💻 "Trabajar con wifi"         │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ CATEGORÍAS                          │
│ [Café] [Bar] [Restaurante]         │
│ [Drinks] [Brunch] [Natural wine]   │
│                                     │
└─────────────────────────────────────┘
```

### Comportamiento de búsqueda:

**Input del usuario → Interpretación:**

```
"café tranquilo" 
→ type: café + mood: calmo
→ Muestra cafés con calmo ≥ 3

"bar para cita en san telmo"
→ type: bar + occasion: primera_cita + zona: san telmo
→ Muestra bares íntimos en San Telmo

"terraza"
→ space: has_outdoor = true
→ Muestra todos los lugares con exterior

"Florería"
→ Búsqueda por nombre (exact match parcial)
→ Muestra Florería Atlántico directamente

"algo tranquilo para leer"
→ mood: calmo + occasion: estar_solo + productivo
→ Muestra cafés calmos con baja rotación
```

**Pipeline de búsqueda:**

```
Input texto → NLP parser:
  1. ¿Es un nombre de lugar? → Exact match → Mostrar directo
  2. ¿Tiene keywords de mood? → Mapear a mood scores
  3. ¿Tiene keywords de tipo? → Filtrar por type
  4. ¿Tiene keywords de zona? → Filtrar por neighborhood
  5. ¿Tiene keywords de ocasión? → Mapear a occasion
  6. ¿Tiene keywords funcionales? → Filtrar (wifi, terraza, etc.)
  
→ Combinar filtros → Pasar al ranking engine → Mostrar resultados
```

### Pantalla de resultados:

```
┌─────────────────────────────────────┐
│ [←]  [café tranquilo_____🔍]       │
│                                     │
│ FILTROS APLICADOS:                  │
│ [☕ Café ×] [☁ Calmo ×]  [+ Filtro]│
│                                     │
├─────────────────────────────────────┤
│                                     │
│ 12 lugares                          │
│                                     │
│ [Vista: Cards ☐ | Mapa ☐]         │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ [Foto]  Cuervo Café      [♡] │  │
│ │         Palermo · Café · $    │  │
│ │         [Calmo] [Productivo]  │  │
│ │         ≈ 800m                │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ [Foto]  LAB Café         [♡] │  │
│ │         ...                   │  │
│ └───────────────────────────────┘  │
│                                     │
│ ... (scroll infinito)              │
│                                     │
└─────────────────────────────────────┘
```

### Filtros expandibles:

Al tappear [+ Filtro]:

```
┌─────────────────────────────────────┐
│ FILTROS                     [Reset] │
├─────────────────────────────────────┤
│                                     │
│ MOOD                                │
│ [Calmo●] [Íntimo] [Social]         │
│ [Energético] [Refugio] [Productivo] │
│                                     │
│ TIPO                                │
│ [Café●] [Bar] [Restaurante]        │
│                                     │
│ MOMENTO                             │
│ [Ahora●] [Mañana] [Tarde] [Noche] │
│                                     │
│ PRECIO                              │
│ [$] [$$] [$$$] [$$$$]              │
│                                     │
│ ZONA                                │
│ [Palermo] [San Telmo] [Recoleta]   │
│ [V. Crespo] [Belgrano] [Centro]   │
│                                     │
│ PARA                                │
│ [Solo] [Cita] [Amigos] [Trabajar]  │
│                                     │
│         [Aplicar filtros]           │
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Venue Detail

### Estructura de la ficha completa:

```
┌─────────────────────────────────────┐
│ [←]                           [⋮]  │
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────────────────────┐  │
│ │                               │  │
│ │    [FOTO HERO - FULL WIDTH]   │  │
│ │    [Aspect ratio 3:2]        │  │
│ │                               │  │
│ │    ← scroll horizontal →     │  │
│ │    (galería de fotos)        │  │
│ │                               │  │
│ └───────────────────────────────┘  │
│                                     │
│ TIPO (label pequeño)               │
│ Nombre del Lugar                    │  ← H1, serif, grande
│ Dirección completa                  │  ← body, gris
│ Barrio · Momento actual             │  
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [♡ Guardar]    [➤ Cómo llegar] ││  ← 2 CTAs principales
│ └─────────────────────────────────┘│
│                                     │
├─────────────── MOOD TAGS ───────────┤
│                                     │
│ [Calmo] [Íntimo] [Dorado]         │
│ [Silencioso] [Social] [Noche]     │
│                                     │
├─────────────── EDITORIAL ───────────┤
│                                     │
│ "Bajás por una florería que ya     │
│  cerró. Al fondo, una escalera.    │
│  Abajo, un mundo de penumbra       │
│  dorada..."                         │
│                                     │
│                  [Leer más ▼]       │
│                                     │
├─────────── MOMENTOS DEL DÍA ───────┤
│                                     │
│ MAÑANA           (si aplica)       │
│ ┌─────────────────────────────┐    │
│ │ No abre por la mañana.      │    │
│ └─────────────────────────────┘    │
│                                     │
│ TARDE                               │
│ ┌─────────────────────────────┐    │
│ │ Buen momento para una copa   │    │
│ │ lenta y hablar en voz baja. │    │
│ └─────────────────────────────┘    │
│                                     │
│ NOCHE ←────── (destacado si es     │
│ ┌─────────────────────────────┐ la  │
│ │ Más social y producido.     │hora │
│ │ Mejor para una salida con   │actu)│
│ │ energía.                    │    │
│ └─────────────────────────────┘    │
│                                     │
├──────────── MEJOR PARA ─────────────┤
│                                     │
│ ✓ Primera cita                      │
│ ✓ Impresionar a alguien            │
│ ✓ Estar solo en la barra           │
│ ✗ Grupo grande (más de 6)          │
│ ✗ Trabajar con laptop              │
│                                     │
├──────────── ESCENAS ────────────────┤
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │foto  │ │foto  │ │foto  │ →→→    │
│ │scene │ │scene │ │scene │        │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
├──────────── ANTES DE IR ────────────┤
│                                     │
│ 💰 Precio: $$$                      │
│ 📅 Reserva: recomendada            │
│ ⏰ Horario: Mar-Dom 18:00 - 02:00  │
│ 🎵 Música: Jazz + ambient          │
│ 📶 Wifi: No                         │
│ 💳 Pago: Tarjeta + efectivo        │
│                                     │
├──────────── UBICACIÓN ──────────────┤
│                                     │
│ ┌───────────────────────────────┐  │
│ │     [MAPA - Mapbox]           │  │
│ │         📍                     │  │
│ │                               │  │
│ └───────────────────────────────┘  │
│                                     │
│ Arce 872, San Telmo                 │
│ [Abrir en Maps]                     │
│                                     │
├──────────── SIMILARES ──────────────┤
│                                     │
│ "Si te gusta esto, también:"       │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ │lugar │ │lugar │ │lugar │        │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
└─────────────────────────────────────┘
```

### Jerarquía de información (orden por importancia):

| Prioridad | Sección | Por qué ahí |
|-----------|---------|-------------|
| 1 | Fotos | Lo primero es la atmósfera visual. Decide si seguís leyendo. |
| 2 | Nombre + ubicación | Contexto básico instantáneo. |
| 3 | CTAs (Guardar + Cómo llegar) | Las 2 acciones posibles. Siempre accesibles. |
| 4 | Mood tags | Confirmación rápida de que el lugar matchea tu búsqueda. |
| 5 | Editorial | El diferencial. La historia que nadie más cuenta. |
| 6 | Momentos del día | Info contextual única de Korantis. |
| 7 | Mejor para | Confirmación de ocasión. |
| 8 | Antes de ir | Info práctica para decidir. |
| 9 | Mapa | Para planificar. |
| 10 | Similares | Descubrimiento continuo. |

### CTAs flotantes (opcional para V2):

Si el usuario scrollea mucho, los CTAs desaparecen. Opción: sticky bottom bar en la ficha:

```
┌─────────────────────────────────────┐
│  [♡ Guardar]         [➤ Cómo llegar]│
└─────────────────────────────────────┘
```

Esto asegura que en cualquier punto de la ficha, la acción está a 1 tap.

---

## 6. Save Flow

### Trigger 1: Tap en bookmark [♡] desde card del feed

```
Estado 0: [♡] (contorno, vacío)
     │
     ▼ (tap)
Estado 1: [♥] (lleno, dorado) + micro-animación (pulse)
     │
     ▼ (inmediato, <300ms)
Toast notification (bottom):
┌─────────────────────────────────────┐
│ ♥ Guardado         [Agregar a lista]│
└─────────────────────────────────────┘
     │
     ├── (si tap en "Agregar a lista") → Sheet de colecciones
     ├── (si ignora) → Toast desaparece en 3s, se guarda en "Todos"
     └── (si tap en ♥ de nuevo) → Desguardar, vuelve a [♡]
```

### Trigger 2: Tap en [♡ Guardar] desde Venue Detail

```
Mismo flujo que arriba pero el botón cambia:
  [♡ Guardar] → [♥ Guardado ✓] (con check y cambio de color)
```

### Trigger 3: Long-press en card del feed

```
Long press (haptic feedback) → Quick action sheet:
┌─────────────────────────────────────┐
│  Florería Atlántico                 │
│                                     │
│  [♥ Guardar]                        │
│  [📁 Guardar en lista...]           │
│  [➤ Cómo llegar]                    │
│  [↗ Compartir]                      │
│                                     │
│  [Cancelar]                         │
└─────────────────────────────────────┘
```

### Sheet de colecciones:

```
┌─────────────────────────────────────┐
│ Guardar en...               [×]    │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐│
│ │ + Crear nueva lista             ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ♥ Todos (default)         12 ◎ ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 📁 Citas Palermo           4 ◎ ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 📁 Para trabajar            6 ◎ ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 📁 NYC trip                 3 ◎ ││
│ └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

### Crear nueva lista:

```
┌─────────────────────────────────────┐
│ Nueva lista                 [×]    │
├─────────────────────────────────────┤
│                                     │
│ Nombre:                             │
│ [_________________________]         │
│                                     │
│ Emoji (opcional):                   │
│ [🌙] [☀️] [🍷] [💻] [❤️] [🎵]    │
│                                     │
│        [Crear y guardar]            │
│                                     │
└─────────────────────────────────────┘
```

### Restricción importante: Registro para guardar

Si el usuario NO está registrado y tappea guardar:

```
┌─────────────────────────────────────┐
│                                     │
│    Guardá tus lugares              │
│    favoritos                        │
│                                     │
│    Creá una cuenta para no         │
│    perder tus descubrimientos.     │
│                                     │
│    [Crear cuenta con email]         │
│    [Continuar con Google]           │
│    [Continuar con Apple]            │
│                                     │
│    Después                          │
│                                     │
└─────────────────────────────────────┘
```

"Después" = dismissea el modal. NO puede guardar sin cuenta. Esto es el trigger de registro natural: el deseo de guardar algo que te gustó.

---

## 7. Taste Profile (Tab: You)

### Estructura de la pantalla "Vos":

```
┌─────────────────────────────────────┐
│ Tu gusto                      [⚙]  │
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────────────────────┐  │
│ │        [Avatar / Inicial]      │  │
│ │         usuario@email.com     │  │
│ │         Buenos Aires          │  │
│ └───────────────────────────────┘  │
│                                     │
├──────── TU PERFIL DE MOOD ──────────┤
│                                     │
│ (Aparece SOLO si tiene ≥10          │
│  interacciones. Si no, ver          │
│  empty state abajo)                 │
│                                     │
│ ┌───────────────────────────────┐  │
│ │    [RADAR CHART]              │  │
│ │     Calmo ████████░░ 4.2      │  │
│ │     Íntimo ██████░░░░ 3.1     │  │
│ │     Social ████░░░░░░ 2.0     │  │
│ │     Productivo ███████░░ 3.8  │  │
│ │     ...                       │  │
│ └───────────────────────────────┘  │
│                                     │
│ "Te atraen espacios calmos con     │
│  luz baja y ritmo pausado.         │
│  Tus mejores descubrimientos       │
│  son de noche."                     │
│                                     │
├──────── TUS MOMENTOS ───────────────┤
│                                     │
│ Cuándo explorás más:               │
│ ┌───────────────────────────────┐  │
│ │ Mañana ████░░░░░░ 35%         │  │
│ │ Tarde  ██░░░░░░░░ 15%         │  │
│ │ Noche  ████████░░ 50%         │  │
│ └───────────────────────────────┘  │
│                                     │
├──────── ESTADÍSTICAS ───────────────┤
│                                     │
│ 23 lugares guardados               │
│ 4 colecciones                       │
│ 12 barrios explorados              │
│ Desde: marzo 2025                   │
│                                     │
├──────── AJUSTAR GUSTOS ─────────────┤
│                                     │
│ [Cambiar moods preferidos →]        │
│ [Cambiar ciudad →]                  │
│                                     │
├──────── SETTINGS ───────────────────┤
│                                     │
│ [Notificaciones →]                  │
│ [Idioma: Español →]                 │
│ [Cerrar sesión]                     │
│ [Eliminar cuenta]                   │
│                                     │
└─────────────────────────────────────┘
```

### Reglas del Taste Profile:

1. **El perfil se construye pasivamente.** El usuario nunca lo "configura" manualmente (excepto los moods iniciales del onboarding que son seed).

2. **Se muestra solo con data suficiente:**
   - < 5 guardados: no mostrar perfil, mostrar invitación a explorar.
   - 5-10 guardados: mostrar perfil básico (barras, sin radar).
   - > 10 guardados: perfil completo con radar + texto descriptivo.

3. **El texto descriptivo se genera con LLM** basándose en los patrones de guardado. Se regenera cada vez que hay cambio significativo (nuevo guardado que altere el perfil).

4. **El radar chart muestra los 8 moods** con scores de 0-5 basados en el promedio de los moods de los lugares guardados.

5. **No tiene "Oráculo" ni swipes en MVP.** El perfil se construye con uso real, no con un quiz. (El oráculo vuelve en V2 como feature de refinamiento opcional.)

---

## 8. Empty States

### Principio: Cada empty state es una invitación a actuar, no una pantalla vacía.

---

### Empty State: Guardados (0 lugares guardados)

```
┌─────────────────────────────────────┐
│ Guardados                           │
├─────────────────────────────────────┤
│                                     │
│            [♡]                      │
│                                     │
│    Tu colección empieza            │
│    con un lugar.                    │
│                                     │
│    Guardá cafés, bares y           │
│    restaurantes que resuenen       │
│    con vos para volver             │
│    después.                         │
│                                     │
│    [Explorar lugares →]             │
│                                     │
└─────────────────────────────────────┘
```

---

### Empty State: Perfil de gusto (< 5 interacciones)

```
┌─────────────────────────────────────┐
│ Tu gusto                            │
├─────────────────────────────────────┤
│                                     │
│            [◎]                      │
│                                     │
│    Korantis aprende con vos.       │
│                                     │
│    A medida que guardás y          │
│    explorás, tu perfil de          │
│    gusto se construye solo.        │
│                                     │
│    Guardá 5 lugares más para       │
│    ver tu perfil.                  │
│                                     │
│    ████████░░░░░░░ 3/10            │
│                                     │
│    [Seguir explorando →]            │
│                                     │
└─────────────────────────────────────┘
```

---

### Empty State: Resultados de búsqueda vacíos

```
┌─────────────────────────────────────┐
│ 🔍 "bar vegano silencioso"         │
├─────────────────────────────────────┤
│                                     │
│    No encontramos nada             │
│    para esa búsqueda.              │
│                                     │
│    Probá con:                       │
│    • Menos filtros                  │
│    • Otra zona                      │
│    • Un mood diferente             │
│                                     │
│    Sugerencias cercanas:            │
│    ┌──────┐ ┌──────┐ ┌──────┐     │
│    │alt 1 │ │alt 2 │ │alt 3 │     │
│    └──────┘ └──────┘ └──────┘     │
│                                     │
└─────────────────────────────────────┘
```

---

### Empty State: Atlas sin ubicación

```
┌─────────────────────────────────────┐
│ Atlas                               │
├─────────────────────────────────────┤
│                                     │
│    ┌───────────────────────────┐   │
│    │  [Mapa borroso/tenue]     │   │
│    │                           │   │
│    │        📍                  │   │
│    │                           │   │
│    └───────────────────────────┘   │
│                                     │
│    Activá la ubicación para        │
│    ver lugares cerca tuyo.         │
│                                     │
│    [Activar ubicación]              │
│                                     │
│    O explorá por barrio:           │
│    [Palermo] [San Telmo]           │
│    [Recoleta] [V. Crespo]         │
│                                     │
└─────────────────────────────────────┘
```

---

### Empty State: Colección vacía (recién creada)

```
┌─────────────────────────────────────┐
│ ← 🌙 Citas Palermo                 │
├─────────────────────────────────────┤
│                                     │
│    Esta lista está vacía.          │
│                                     │
│    Guardá lugares desde el         │
│    feed o desde su ficha.          │
│                                     │
│    [Explorar lugares →]             │
│                                     │
└─────────────────────────────────────┘
```

---

### Empty State: Feed filtrado sin resultados

```
┌─────────────────────────────────────┐
│ [Calmo●] [Íntimo●] aplicados       │
├─────────────────────────────────────┤
│                                     │
│    No hay lugares calmos e         │
│    íntimos abiertos ahora          │
│    cerca tuyo.                      │
│                                     │
│    ¿Querés ver para más tarde?     │
│    [Ver para esta noche →]          │
│                                     │
│    O probá otro mood:              │
│    [Calmo] [Refugio] [Solo calmo]  │
│                                     │
└─────────────────────────────────────┘
```

---

## 9. Qué Pantallas Sobran

### Comparando con el producto actual:

| Pantalla/Sección actual | Veredicto | Razón |
|------------------------|-----------|-------|
| **El Oráculo (calibración por swipe)** | ELIMINAR en MVP | No hay data para que funcione. Es feature de retención mes 3+. No de día 1. |
| **Lecturas de gusto textuales** | ELIMINAR en MVP | Sin historial suenan a horóscopo. Vuelven cuando hay ≥10 guardados. |
| **Radar de perfil con % de compatibilidad** | ELIMINAR en MVP | Necesita ≥20 interacciones para ser creíble. Mostrar vacío es peor que no mostrar. |
| **"Afinidades circadianas"** | ELIMINAR | Reemplazar por "Tus momentos" (barras simples de hora). |
| **"Índice del Atlas: 0 guardados"** | ELIMINAR | Métricas en 0 son deprimentes. Solo mostrar cuando N > 0. |
| **Selector de idioma en pantalla principal** | MOVER a Settings | Es configuración, no contenido. |
| **"Descubrimientos pico"** | POSPONER | Solo tiene sentido con historial de uso prolongado. |
| **Hero editorial en Home** | REEMPLAZAR por feed directo | Ya argumentado extensamente. |
| **Texto largo en cards del feed** | REDUCIR | 1 línea (tagline) + tags. La prosa va adentro de la ficha. |

### Pantallas que NO existen pero deberían:

| Pantalla faltante | Prioridad | Por qué es necesaria |
|-------------------|-----------|---------------------|
| **Pantalla de Guardados/Colecciones** | P0 — MVP | Sin esto no hay retención. |
| **Bottom tab bar** | P0 — MVP | Sin nav persistente no es una app real. |
| **Pantalla de Search fullscreen** | P0 — MVP | La búsqueda es el segundo entry point. |
| **Empty states diseñados** | P0 — MVP | Estados vacíos sin diseño se sienten a error. |
| **Sheet de guardar en colección** | P1 — Semana 3 | Mejora engagement de guardado. |
| **Registro/Login** | P1 — Semana 2 | Gate para guardar. Sin esto pierdes data de usuario. |
| **Perfil básico (sin radar)** | P2 — Mes 2 | Feedback al usuario de que la app "le aprende". |
| **Share card** | P2 — Mes 2 | Distribución orgánica. |
| **Notificaciones settings** | P2 — Mes 2 | Control de push. |

---

## 10. Qué Construir Primero para MVP

### Sprint 1: Días 1-7 — Core navegable

| Item | Descripción | Esfuerzo |
|------|-------------|----------|
| Bottom tab bar | 4 tabs con íconos + labels | 2h |
| Home/Explore: estructura base | Header + search bar (no funcional, placeholder) + mood pills (visual, sin filtrado real) + feed de cards full-width | 8h |
| Cards full-width | Componente: foto + nombre + barrio + tipo + tagline + mood tags + bookmark icon | 4h |
| Venue Detail | Pantalla completa con: fotos, nombre, dirección, CTAs, mood tags, editorial, momentos del día, mejor para, antes de ir, mapa, similares | 12h |
| Navegación básica | Tap card → push a detail. Back button. Tab switching. | 3h |
| Data: 30 venues cargados | Con campos obligatorios completos | 15h editorial |

**Total sprint 1: ~44h dev + 15h editorial**

**Al final de sprint 1:** Una app navegable donde puedo ver un feed de lugares, tappear uno y ver su ficha completa. No guarda, no busca, no filtra. Pero se siente como app real.

---

### Sprint 2: Días 8-14 — Funcionalidad core

| Item | Descripción | Esfuerzo |
|------|-------------|----------|
| Mood pills funcionales | Tap en pill → filtra feed instantáneamente (client-side filtering) | 4h |
| Search fullscreen | Modal con input + sugerencias estáticas + búsqueda por nombre (exact match) | 6h |
| Save flow básico | Tap bookmark → guarda (requiere login) + toast + animación | 4h |
| Registro/Login | Email + Google + Apple. Flujo mínimo. | 8h |
| Pantalla Guardados | Lista simple de venues guardados. Sin colecciones. | 4h |
| Atlas básico | Mapa con pins de todos los venues. Tap pin → preview card. | 6h |
| Data: +20 venues | Total: 50 venues | 10h editorial |
| Empty states | Guardados vacío, perfil vacío, búsqueda sin resultados | 3h |

**Total sprint 2: ~45h dev + 10h editorial**

**Al final de sprint 2:** App funcional donde puedo filtrar por mood, buscar un lugar, ver su ficha, guardarlo, verlo en mi lista de guardados, y verlo en un mapa.

---

### Sprint 3: Días 15-28 — Pulido + retención

| Item | Descripción | Esfuerzo |
|------|-------------|----------|
| Carruseles horizontales en Home | Sección contextual (por hora) + temáticas editoriales | 6h |
| Search con NLP básico | "café tranquilo" → interpreta mood + type | 8h |
| Filtros expandibles | Sheet de filtros (mood, tipo, precio, zona) | 6h |
| Colecciones | Crear lista, nombrar, agregar venues a listas | 8h |
| Sección contextual dinámica | "Para esta noche" cambia según hora real | 4h |
| Onboarding 3 pasos | Ciudad + moods + enter | 4h |
| Share venue | Generar link + Open Graph preview para WhatsApp/IG | 5h |
| Perfil básico (You) | Stats simples: X guardados, X barrios, desde cuándo | 3h |
| Data: +30 venues | Total: 80 venues | 15h editorial |
| Performance pass | Lazy loading de imágenes, caching, optimización de scroll | 4h |

**Total sprint 3: ~63h dev + 15h editorial**

---

### Sprint 4: Días 29-60 — Personalización + growth

| Item | Descripción | Esfuerzo |
|------|-------------|----------|
| Ranking engine v0.1 | Mood match + distancia + time fit (scoring básico) | 12h |
| Feed personalizado | Ordenar home basado en moods preferidos del usuario | 6h |
| Taste profile con radar | Mostrar a usuarios con ≥10 guardados | 6h |
| "Similares" en venue detail | Basado en venue_vector similarity | 4h |
| Push notifications | "3 nuevos lugares para tu mood esta semana" (1x/semana máx) | 6h |
| Newsletter setup | Email semanal con 3 nuevos lugares | 4h |
| Atlas: "Tu Atlas" vs "Atlas espacial" | Mapa filtrado por guardados propios | 4h |
| Venue detail v2 | Galería scrollable, sticky CTAs, galería de escenas | 6h |
| Data: +40 venues | Total: 120 venues con buena cobertura de BA | 20h editorial |
| Analytics | Tracking de: saves, opens, directions, time on page, filter usage | 6h |
| Bug fixes + polish | Animaciones, transiciones, edge cases | 10h |

**Total sprint 4: ~84h dev + 20h editorial**

---

### Resumen de Timeline:

| Día | Milestone | Estado del producto |
|-----|-----------|-------------------|
| 7 | Core navegable | Feed + Detail. Se ve bien, no hace mucho. |
| 14 | **MVP funcional** | Filtrado + Búsqueda + Guardado + Mapa. Producto usable. |
| 28 | Producto pulido | Contexto, colecciones, onboarding, compartir. Se siente real. |
| 60 | Producto con retención | Personalización, push, newsletter, 120 venues. Growth mode. |

---

### Lo que NO se construye en 60 días:

| Feature | Cuándo | Por qué después |
|---------|--------|-----------------|
| El Oráculo (swipe calibration) | Mes 3-4 | Necesita data de usuario para funcionar |
| Taste profile con texto generado | Mes 3 | Necesita volumen de guardados |
| Promoted placement (monetización) | Mes 4+ | Necesita usuarios primero |
| NYC como segunda ciudad | Mes 3+ | Primero densidad en BA |
| Social features (compartir listas con amigos) | Mes 4+ | Nice to have, no core |
| A/B testing de ranking | Mes 4+ | Necesita volumen de tráfico |
| Integración con reviews externas (NLP) | Mes 3 | Mejora scoring pero no es visible al usuario |
| Computer vision pipeline | Mes 4+ | Mejora data pero no es urgente |
| Dark/light mode toggle | Nunca en MVP | Es dark by design |
| Multi-idioma real (i18n completo) | Mes 3 | Español primero, inglés después para NYC |

---

## Diagrama de Flujo Completo

```
                    ┌──────────────┐
                    │   INSTALL    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  ONBOARDING  │
                    │  (3 pasos)   │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │                         │
              │      HOME / EXPLORE     │◄─────────────────┐
              │                         │                  │
              └───┬─────┬─────┬────────┘                  │
                  │     │     │                            │
         ┌────────┘     │     └────────┐                  │
         │              │              │                  │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐            │
    │ SEARCH  │   │VENUE CARD │  │  MOOD   │            │
    │(fullscr)│   │   (tap)   │  │  PILL   │            │
    └────┬────┘   └─────┬─────┘  └────┬────┘            │
         │              │              │                  │
         │         ┌────▼─────┐        │                  │
         │         │  VENUE   │        │ (filtra feed)   │
         │         │  DETAIL  │        │                  │
         └────────►│          │◄───────┘                  │
                   │          │                           │
                   └──┬───┬───┘                           │
                      │   │                               │
              ┌───────┘   └───────┐                       │
              │                   │                       │
         ┌────▼────┐        ┌────▼────┐                  │
         │  SAVE   │        │CÓMO LLEG│                  │
         │  FLOW   │        │(Maps ext│                  │
         └────┬────┘        └─────────┘                  │
              │                                           │
              ├── (no registrado) ──► LOGIN ──► SAVE     │
              │                                           │
              └── (registrado) ──► TOAST ──► SAVED TAB   │
                                                          │
                                                          │
    ┌─────────────────────────────────────────────────┐  │
    │                  TAB BAR                          │  │
    ├───────────┬───────────┬───────────┬─────────────┤  │
    │  EXPLORE  │   ATLAS   │   SAVED   │     YOU     │  │
    │    (↑)    │           │           │             │  │
    └───────────┼───────────┼───────────┼─────────────┘  │
                │           │           │                  │
          ┌─────▼─────┐ ┌──▼──┐  ┌─────▼─────┐          │
          │   MAPA    │ │LISTA│  │  PROFILE  │          │
          │ + pins    │ │GUARD│  │  + stats  │          │
          │ + cluster │ │ADOS │  │  + radar  │          │
          │           │ │     │  │  + config │          │
          └─────┬─────┘ └──┬──┘  └───────────┘          │
                │          │                              │
                │     ┌────▼────┐                         │
                │     │COLECCION│                         │
                │     │ DETAIL  │                         │
                │     └────┬────┘                         │
                │          │                              │
                └──────────┴──────────────────────────────┘
                       (tap venue → VENUE DETAIL)
```

---

## Principios UX Rectores

| Principio | Implementación |
|-----------|---------------|
| **Contenido primero, explicación nunca** | La home muestra lugares, no explica qué es la app. |
| **1 tap = 1 acción** | Guardar, llegar, filtrar: todo en 1 tap máximo. |
| **Nunca pantalla vacía** | Todo empty state invita a una acción siguiente. |
| **El tiempo del usuario es sagrado** | Nada de loading screens sin contenido. Skeleton screens + lazy load. |
| **Lo oscuro es el canvas, lo dorado es la acción** | El color guía: dorado = interactivo, blanco = contenido, gris = secundario. |
| **Menos es más, pero nunca vacío** | Mostrar lo justo para decidir. Ni sobrecargado ni desierto. |
| **La app mejora sola** | Cuanto más usás, mejor es el feed. Sin pedir esfuerzo. |
| **Cada pantalla tiene UN objetivo** | Explore: descubrir. Detail: decidir. Saved: recordar. You: reflejar. |
User: Korantis necesita aprender el gusto del usuario, pero no quiero un onboarding largo. Quiero que se sienta como descubrir, no como llenar un formulario.

Diseñá un onboarding invisible/progresivo para aprender:
- barrios preferidos
- tipo de planes
- estética
- ruido/energía
- presupuesto
- horarios
- compañía habitual
- gustos gastronómicos
- lugares guardados

Dame una propuesta en 3 niveles:
1. Sin login.
2. Con usuario nuevo.
3. Con usuario recurrente.
Model: # Onboarding Invisible — Sistema de Aprendizaje Progresivo

## Filosofía Central

> **El mejor onboarding es el que el usuario no sabe que está haciendo.**

Korantis no pregunta. Observa, infiere y mejora. Como un bartender que después de 3 visitas ya sabe qué te gusta sin que se lo digas.

### Principios:

1. **Nunca preguntar lo que podés observar.** Si puedo ver que guardás lugares en Palermo, no te pregunto "¿qué barrio preferís?".
2. **Nunca bloquear valor con configuración.** El feed funciona bien desde el segundo 0, mejora con el uso.
3. **El esfuerzo explícito es opcional y recompensado.** Si querés decirnos algo, podés. Pero nunca es obligatorio.
4. **Cada interacción es una señal.** Tap, scroll, tiempo, guardado, dirección: todo comunica preferencia.

---

## Mapa de Señales por Variable

| Variable a aprender | Señal implícita | Señal explícita (opcional) | Cuándo se activa |
|---------------------|-----------------|---------------------------|------------------|
| **Barrios preferidos** | Ubicación GPS + barrios de lugares guardados + barrios de fichas abiertas | Filtro de zona usado en búsqueda | Desde sesión 1 |
| **Tipo de planes** | Ocasiones de lugares guardados + hora de uso de la app | Filtro "Para" en búsqueda | Sesión 2+ |
| **Estética** | Design level + style de lugares guardados + tiempo en fotos | Nunca se pregunta directamente | Sesión 3+ (necesita volumen) |
| **Ruido/energía** | Volume + energy scores de guardados + moods filtrados | Mood pills seleccionados | Sesión 1+ |
| **Presupuesto** | Price range de lugares guardados + fichas abiertas | Filtro de precio en búsqueda | Sesión 2+ |
| **Horarios** | Hora de apertura de la app + franja de búsquedas + franja de guardados | Filtro "Momento" | Sesión 1+ |
| **Compañía habitual** | Ocasiones de guardados (solo, cita, amigos, grupo) | Filtro "Para" | Sesión 3+ |
| **Gustos gastronómicos** | Tipos de venues guardados (café, bar, restaurante) + offering categories | Filtro de tipo | Sesión 2+ |
| **Lugares guardados** | Acción directa | Acción directa | Sesión 1+ |

---

## Nivel 1: Sin Login (Usuario Anónimo)

### Qué sabemos: Nada personal. Solo comportamiento de sesión.

### Qué podemos aprender:

```
SEÑALES DISPONIBLES SIN CUENTA:

├── Ubicación (si dio permiso GPS)
│   → Ciudad confirmada
│   → Barrio actual
│   → Distancia a venues que mira
│
├── Hora de uso
│   → Franja horaria de la sesión
│   → Día de la semana
│
├── Interacciones en sesión
│   ├── Mood pills seleccionados
│   ├── Cards visibles en viewport (>2 segundos)
│   ├── Cards tappeadas (abrió ficha)
│   ├── Tiempo en cada ficha (>15s = interés real)
│   ├── Scroll depth en la ficha
│   ├── Fotos vistas (swipe en galería)
│   ├── Búsquedas realizadas (texto ingresado)
│   └── Filtros aplicados
│
└── Lo que NO podemos hacer
    ├── Guardar (requiere cuenta)
    ├── Persistir entre sesiones (sin cookie/device ID)
    └── Personalizar feed entre visitas
```

### Experiencia del usuario anónimo:

```
SESIÓN 1 (anónimo):

Minuto 0:00 — Abre app
├── Ve: Home con feed general (no personalizado)
├── Contextualizado solo por: hora del día + ciudad
└── Sección 1: "Para esta noche" (si son las 21hs)

Minuto 0:30 — Tappea pill "Calmo"
├── Feed se filtra instantáneamente
├── SEÑAL CAPTURADA: preferencia por calmo
└── La sesión actual ya sabe algo

Minuto 1:00 — Abre ficha de un café
├── SEÑAL: interés en cafés (no bares)
├── SEÑAL: barrio del café = posible zona de interés
└── Ve la ficha completa, scrollea hasta "Momentos"

Minuto 1:30 — Vuelve al feed, abre otro lugar
├── SEÑAL: segundo lugar calmo + café + mismo barrio
└── Patrón emergente: calmo + café + Palermo

Minuto 2:00 — Intenta guardar
├── TRIGGER: modal de registro
├── "Guardá tus lugares favoritos"
├── [Crear cuenta] [Google] [Apple]
└── Si cancela: sigue navegando sin guardar

RESULTADO DE SESIÓN ANÓNIMA:
- No hay persistencia personal
- Pero la sesión actual usa las señales para:
  → Reordenar sutilmente el feed restante
  → Mostrar "Más como esto" basado en lo que abrió
  → Pre-filtrar resultados de búsqueda
```

### Personalización en sesión (sin cuenta):

```python
def session_personalization(session_signals):
    """
    Personalización efímera basada en señales de sesión actual.
    No persiste. Se usa solo para mejorar el feed AHORA.
    """
    
    # Inferir mood de interés
    moods_interacted = extract_moods_from_opened_venues(session_signals)
    if moods_interacted:
        boost_mood_in_feed(moods_interacted, weight=0.3)
    
    # Inferir tipo de interés
    types_opened = [v.type for v in session_signals.opened_venues]
    if len(types_opened) >= 2:
        dominant_type = mode(types_opened)
        boost_type_in_feed(dominant_type, weight=0.2)
    
    # Inferir zona de interés
    neighborhoods_opened = [v.neighborhood for v in session_signals.opened_venues]
    if len(neighborhoods_opened) >= 2:
        # Mostrar más del mismo barrio en "Más para explorar"
        add_section("Más en " + mode(neighborhoods_opened))
    
    return adjusted_feed
```

### Lo que NO hacemos sin login:

- ❌ No pedimos email ni datos.
- ❌ No mostramos pop-ups de registro (excepto al intentar guardar).
- ❌ No bloqueamos contenido.
- ❌ No limitamos búsquedas.
- ❌ No mostramos "perfil vacío" (no hay perfil).

---

## Nivel 2: Usuario Nuevo (Con cuenta, < 30 días)

### Qué sabemos: Email/ID + todo lo que hace desde que creó la cuenta.

### El momento del registro:

El registro ocurre SOLO cuando el usuario intenta guardar su primer lugar. En ese momento ya tenemos:
- Al menos 1 lugar que le gustó lo suficiente como para querer guardarlo.
- Señales de la sesión previa (moods, tipos, barrios).
- Hora preferida de uso.

### Señales que capturamos:

```
SEÑALES NIVEL 2 (primeros 30 días):

├── ACCIONES DE ALTA SEÑAL (peso 3x)
│   ├── Lugares guardados (acción deliberada)
│   ├── "Cómo llegar" taps (intención de visita)
│   └── Compartir un lugar (validación social)
│
├── ACCIONES DE MEDIA SEÑAL (peso 1.5x)
│   ├── Fichas abiertas con >15s de lectura
│   ├── Fotos scrolleadas (vio galería completa)
│   ├── Búsquedas con resultado clickeado
│   └── Mood pills usados en Explore
│
├── ACCIONES DE BAJA SEÑAL (peso 1x)
│   ├── Cards visibles >3s en feed sin tap
│   ├── Scroll depth en Home
│   ├── Fichas abiertas <5s (rebote = negativa suave)
│   └── Filtros aplicados pero sin acción posterior
│
├── SEÑALES CONTEXTUALES (peso variable)
│   ├── Hora de apertura de app (patrón de uso temporal)
│   ├── Día de la semana de uso
│   ├── Ubicación GPS al momento de uso
│   ├── Frecuencia de uso (diaria, semanal, esporádica)
│   └── Tiempo total por sesión
│
└── SEÑALES NEGATIVAS (peso -1x)
    ├── Ficha abierta <3s → cerrada (no le interesó)
    ├── Venue des-guardado (cambió de opinión)
    ├── Búsqueda sin clicks (resultados no relevantes)
    └── Mood pill deseleccionado rápido
```

### Construcción progresiva del perfil:

```
SEMANA 1: SEED PHASE
├── Input explícito: moods del onboarding (2-3 seleccionados)
├── Input implícito: primeros 3-5 guardados
├── Resultado: perfil primitivo con 2-3 moods dominantes
└── Feed: mejora sutil (boost de moods preferidos en ranking)

SEMANA 2: PATTERN PHASE  
├── Input: 5-10 guardados acumulados + patrones de hora/día
├── Se calculan:
│   ├── Vector de gusto (16 dimensiones)
│   ├── Barrios dominantes
│   ├── Franja horaria preferida
│   └── Price range promedio de guardados
├── Feed: notablemente mejor. "Para vos" empieza a tener sentido.
└── Se desbloquea: sección "Porque guardaste [mood]" en Home

SEMANA 3-4: REFINEMENT PHASE
├── Input: 10-20 guardados + señales de sesiones múltiples
├── Se calculan:
│   ├── Occasions preferidas (solo, cita, amigos)
│   ├── Estética preferida (design level, materiales)
│   ├── Tolerancia al ruido (volume/energy promedio)
│   └── Tipo gastronómico (café vs bar vs restaurante)
├── Feed: altamente personalizado. Ranking engine usa taste_memory.
└── Se desbloquea: Perfil de gusto visible en tab "You"
```

### Micro-momentos de aprendizaje explícito (no obligatorios):

En vez de un onboarding largo, insertamos micro-preguntas CONTEXTUALES en momentos naturales:

```
MICRO-MOMENTO 1: Después del 3er guardado
┌─────────────────────────────────────┐
│                                     │
│ 3 lugares guardados 🎉             │
│                                     │
│ ¿Con quién salís más seguido?      │
│                                     │
│ [Solo/a] [En pareja] [Con amigos]  │
│ [Depende]                           │
│                                     │
│              Saltar                  │
└─────────────────────────────────────┘
Aparece como bottom sheet sutil, 1 vez, descartable.
Si responde: se usa como señal (peso 2x).
Si no: se infiere de los guardados igualmente.
```

```
MICRO-MOMENTO 2: Después del 5to guardado
┌─────────────────────────────────────┐
│                                     │
│ Tu gusto se está formando 🌱       │
│                                     │
│ ¿Preferís lugares...               │
│                                     │
│ [Silenciosos ←——●——→ Bulliciosos]  │
│                                     │
│              Saltar                  │
└─────────────────────────────────────┘
Un slider simple. 1 pregunta. 3 segundos.
```

```
MICRO-MOMENTO 3: Después del 8vo guardado
┌─────────────────────────────────────┐
│                                     │
│ Una más y listo:                    │
│                                     │
│ ¿Cuánto gastás normalmente         │
│  por salida?                        │
│                                     │
│ [$] [$$] [$$$] [$$$$] [No importa] │
│                                     │
│              Saltar                  │
└─────────────────────────────────────┘
```

### Reglas de los micro-momentos:

1. **Máximo 1 por sesión.** Nunca dos preguntas seguidas.
2. **Solo aparecen después de un logro** (guardado, milestone). No interrumpen uso.
3. **Siempre descartables.** "Saltar" visible y sin culpa.
4. **Se almacenan como señal explícita** pero no override las señales implícitas.
5. **Nunca se repiten.** Si saltaste, no vuelve.
6. **Máximo 3-4 en total en los primeros 30 días.** Después, nunca más.

### Tabla de micro-momentos:

| Trigger | Pregunta | Dato que captura | Peso |
|---------|----------|-----------------|------|
| 3 guardados | ¿Con quién salís? | Compañía habitual | 2x |
| 5 guardados | Slider silencioso/bullicioso | Tolerancia al ruido | 2x |
| 8 guardados | ¿Cuánto gastás? | Presupuesto | 2x |
| 12 guardados | ¿Querés descubrir barrios nuevos o quedarte en los tuyos? | Apertura geográfica | 1.5x |

**Después del 4to micro-momento: NUNCA MÁS.** Todo se infiere.

---

### Feedback visible de que la app aprende:

El usuario nuevo necesita sentir que su comportamiento tiene efecto. No explícitamente ("estamos analizando tu perfil") sino orgánicamente:

```
FEEDBACK SUTIL DE APRENDIZAJE:

Semana 1:
- Sección "Para vos ahora" aparece en home (antes era genérica "Para esta noche")
- Diferencia percibida: "Hmm, esto se siente más relevante"

Semana 2:
- Aparece en home: "Porque guardaste lugares calmos"
  [carrusel de 3-4 lugares calmos nuevos]
- El usuario piensa: "Ah, me está recomendando basado en lo que guardé"

Semana 3:
- Notificación push (si aceptó): 
  "2 nuevos cafés tranquilos en Palermo esta semana"
- Personalizada con su mood + barrio + tipo favorito

Semana 4:
- Tab "You" muestra:
  "Tu gusto se está formando. Guardá 3 más para ver tu perfil completo."
  [barra de progreso: 7/10]
```

---

## Nivel 3: Usuario Recurrente (> 30 días, > 10 guardados)

### Qué sabemos: Perfil rico, patrones estables, historial extenso.

### El perfil completo del usuario recurrente:

```typescript
interface UserTasteProfile {
  
  // Moods (calculados de guardados + interacciones)
  mood_affinity: {
    calmo: number;         // 0-5 (promedio ponderado)
    intimo: number;
    social: number;
    energetico: number;
    refugio: number;
    contemplativo: number;
    productivo: number;
    celebratorio: number;
  };
  
  // Temporal
  preferred_timeframes: {
    morning: number;       // 0-1 (% de uso/guardados en esta franja)
    afternoon: number;
    night: number;
    late_night: number;
  };
  
  preferred_days: {
    weekday: number;       // 0-1
    weekend: number;
  };
  
  // Geográfico
  home_neighborhoods: string[];        // Top 3 barrios por guardados
  exploration_radius: number;          // km promedio de distancia a guardados
  geographic_openness: number;         // 0-1 (¿guarda solo cerca o explora lejos?)
  
  // Tipo
  venue_type_preference: {
    cafe: number;          // 0-1
    bar: number;
    restaurante: number;
  };
  
  // Estética
  design_preference: number;           // 0-5 (promedio de design_level de guardados)
  style_affinity: string[];            // ["minimal", "industrial"] (top 2 estilos)
  lighting_preference: number;         // 0-5 (luminosidad promedio preferida)
  
  // Sensorial
  noise_tolerance: number;             // 0-5 (volumen promedio de guardados)
  energy_preference: number;           // 0-5
  music_preference: string;            // "ambient" | "jazz" | "none" | "varied"
  
  // Social
  typical_occasion: string[];          // ["estar_solo", "primera_cita"] (top 2)
  group_size_typical: string;          // "solo" | "pareja" | "grupo_chico"
  
  // Económico
  price_range_typical: number;         // 1-4 (promedio)
  price_range_max: number;             // máximo observado en guardados
  
  // Funcional
  values_wifi: boolean;                // true si >30% de guardados tienen wifi
  values_outdoor: boolean;             // true si >30% de guardados tienen exterior
  values_no_rush: boolean;             // true si promedio de rotation_pressure < 2
  
  // Meta
  profile_confidence: number;          // 0-1 (basado en volumen de data)
  last_updated: Date;
  total_saves: number;
  total_sessions: number;
  days_active: number;
  
  // Vector para ranking engine
  taste_vector: number[];              // 16-dim embedding
}
```

### Cómo se calcula (actualización continua):

```python
def update_user_profile(user, new_signal):
    """
    Se ejecuta cada vez que hay una nueva señal significativa:
    - Nuevo guardado
    - Nuevo "cómo llegar"
    - Nuevo filtro usado
    - Nueva sesión con patrón diferente
    """
    
    # Peso por tipo de señal
    WEIGHTS = {
        'saved': 3.0,
        'directions': 2.5,
        'shared': 2.0,
        'opened_15s+': 1.5,
        'opened_gallery': 1.2,
        'visible_3s+': 0.5,
        'opened_<5s': -0.3,  # señal negativa suave
        'unsaved': -2.0,     # señal negativa fuerte
    }
    
    weight = WEIGHTS[new_signal.type]
    venue = new_signal.venue
    time_slot = get_time_slot(new_signal.timestamp)
    
    # Actualizar mood affinity
    for mood, score in venue.moods[time_slot].items():
        # Exponential moving average
        alpha = 0.1 * abs(weight)  # señales fuertes mueven más
        if weight > 0:
            user.mood_affinity[mood] = (
                user.mood_affinity[mood] * (1 - alpha) + 
                (score / 5.0) * alpha
            )
        else:
            # Señal negativa: alejar del mood del venue
            user.mood_affinity[mood] = (
                user.mood_affinity[mood] * (1 - alpha * 0.3) +
                (1 - score / 5.0) * alpha * 0.3
            )
    
    # Actualizar preferencia temporal
    user.preferred_timeframes[time_slot] += 0.05 * weight
    normalize(user.preferred_timeframes)  # que sume 1
    
    # Actualizar preferencia geográfica
    if weight > 0:
        hood = venue.neighborhood
        if hood not in user.home_neighborhoods:
            user.home_neighborhoods.append(hood)
        # Mantener solo top 5
        user.home_neighborhoods = top_n_by_frequency(user.home_neighborhoods, 5)
    
    # Actualizar vector de gusto
    venue_vector = venue.get_vector(time_slot)
    user.taste_vector = exponential_moving_average(
        user.taste_vector, 
        venue_vector, 
        alpha=0.08 * abs(weight)
    )
    
    # Actualizar confianza del perfil
    user.profile_confidence = min(1.0, user.total_saves / 30)
    # Confidence llega a 1.0 con 30 guardados
    
    user.last_updated = now()
    save(user)
```

### Personalización para usuario recurrente:

```
EXPERIENCIA DEL USUARIO RECURRENTE:

HOME / EXPLORE:
┌─────────────────────────────────────┐
│ ✦ KORANTIS         Buenos Aires ▼  │
├─────────────────────────────────────┤
│ 🔍 Buscar lugar, mood, barrio...   │
├─────────────────────────────────────┤
│ [Calmo●] [Íntimo] [Social] ...     │
│  ↑ Pre-seleccionado si el usuario  │
│    siempre filtra por calmo         │
├─────────────────────────────────────┤
│                                     │
│ "Para vos esta noche"              │
│ (rankeado por taste_vector match)   │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ │ HIGH │ │ HIGH │ │ MED  │        │
│ │MATCH │ │MATCH │ │MATCH │        │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
│ "Nuevos que te van a gustar"       │
│ (novelty HIGH + taste match HIGH)   │
│ ┌───────────────────────────────┐  │
│ │ [NUEVO] + [MATCH]             │  │
│ └───────────────────────────────┘  │
│                                     │
│ "Barrios que no exploraste"        │
│ (geographic_openness > 0.5 = yes)   │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
│ "Porque guardaste [Florería]"      │
│ (similarity to specific saved venue)│
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
└─────────────────────────────────────┘
```

### Secciones dinámicas para usuarios recurrentes:

| Sección | Condición para aparecer | Contenido |
|---------|------------------------|-----------|
| "Para vos [momento]" | Siempre (es la contextual personalizada) | Top 5 venues por ranking engine |
| "Nuevos que te van a gustar" | Hay venues nuevos (< 14 días) con match > 0.7 | Venues nuevos con alta compatibilidad |
| "Porque guardaste [Lugar X]" | Usuario tiene > 5 guardados | Venues similares a uno guardado específico |
| "Explorá [Barrio Y]" | geographic_openness > 0.5 + barrio con venues no vistos | Venues en barrios fuera de su zona habitual |
| "Tu mood del momento" | Hora + patrón histórico sugiere un mood | Venues del mood predicho por hora + historial |
| "Volvé a visitar" | Guardó hace > 30 días y no hizo "cómo llegar" | Reminder sutil de guardados old |
| "[Amigo/nombre] compartió" | Alguien le compartió un link Korantis | Social discovery |

### El perfil visible (Tab "You") para usuario recurrente:

```
┌─────────────────────────────────────┐
│ Tu gusto                      [⚙]  │
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────────────────────┐  │
│ │      [RADAR CHART]            │  │
│ │                               │  │
│ │  Calmo ●●●●○ 4.2             │  │
│ │  Íntimo ●●●○○ 3.1            │  │
│ │  Productivo ●●●●○ 3.8        │  │
│ │  Social ●●○○○ 2.0            │  │
│ │  ...                          │  │
│ └───────────────────────────────┘  │
│                                     │
│ "Te atraen refugios de luz baja    │
│  donde el ruido no llega.          │
│  Descubrís mejor de noche y       │
│  preferís estar solo o en          │
│  compañía mínima."                 │
│                                     │
├──────── TU MAPA DE GUSTO ──────────┤
│                                     │
│ Tus barrios:                        │
│ [Palermo ●●●] [San Telmo ●●]      │
│ [V. Crespo ●]                      │
│                                     │
│ Tus momentos:                       │
│ Noche ████████░░ 50%               │
│ Mañana ████░░░░░░ 30%              │
│ Tarde ██░░░░░░░░ 20%              │
│                                     │
│ Tu presupuesto típico: $$          │
│ Tu compañía: Solo > Pareja         │
│                                     │
├──────── STATS ──────────────────────┤
│                                     │
│ 23 lugares guardados               │
│ 4 listas creadas                    │
│ 8 barrios explorados               │
│ Usando Korantis desde marzo 2025   │
│                                     │
├──────── TUS DESCUBRIMIENTOS ────────┤
│                                     │
│ Último guardado: Lúcuma (hace 2d)  │
│ Lugar más revisitado: Cuervo Café  │
│ Mood más buscado: Calmo            │
│                                     │
└─────────────────────────────────────┘
```

### El texto descriptivo del perfil:

Generado con LLM, actualizado cada vez que hay un cambio significativo (nuevo guardado que altere el perfil):

```python
def generate_taste_description(user_profile):
    """
    Genera un texto corto (2-3 oraciones) que describe
    el gusto del usuario de forma evocadora, no técnica.
    """
    
    prompt = f"""
    Basándote en este perfil de gusto de un usuario de Korantis 
    (app de descubrimiento de cafés, bares y restaurantes por mood):
    
    Moods dominantes: {top_3_moods(user_profile)}
    Momento preferido: {dominant_timeframe(user_profile)}
    Compañía usual: {user_profile.group_size_typical}
    Noise tolerance: {user_profile.noise_tolerance}/5
    Design preference: {user_profile.design_preference}/5
    Tipo favorito: {dominant_venue_type(user_profile)}
    
    Escribí 2-3 oraciones que describan su gusto como si fueras 
    un amigo que lo conoce bien. Tono: cálido, perceptivo, no 
    técnico. No uses palabras como "algoritmo", "perfil", "datos".
    Hablá de lo que le gusta como si lo conocieras.
    
    Ejemplos de tono correcto:
    - "Te atraen los rincones donde el tiempo se detiene."
    - "Buscás atmósferas que no pidan nada de vos."
    - "Tu ciudad es otra después de las 22hs."
    """
    
    return llm_generate(prompt, max_tokens=100)
```

**Ejemplos de output:**

Para usuario calmo + nocturno + solo:
> "Te atraen refugios de luz baja donde el ruido no llega. Descubrís mejor de noche y preferís que el silencio sea parte de la experiencia."

Para usuario social + energético + grupos:
> "Tu energía pide lugares que se llenen, que suenen, que vibren. Salís para encontrarte con otros y preferís que el volumen suba con la noche."

Para usuario productivo + mañanero + cafés:
> "Tus mañanas tienen un ritual: un café con buena luz, wifi que no falle, y la tranquilidad de que nadie te va a apurar. Tu oficina favorita no tiene jefe."

---

## Sistema de Señales — Tabla Maestra

### Todas las señales, su peso y cuándo se capturan:

```
╔══════════════════════════════════════════════════════════════════════╗
║  SEÑAL                    │ PESO │ NIVEL │ QUÉ INFIERE              ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ── ACCIONES PRIMARIAS ──────────────────────────────────────────── ║
║                                                                      ║
║  Guardar venue             │ 3.0  │ 2+   │ Todo (mood, tipo, barrio,║
║                            │      │      │ precio, estética, hora)  ║
║                            │      │      │                          ║
║  "Cómo llegar" tap         │ 2.5  │ 2+   │ Intención real. Valida  ║
║                            │      │      │ interés + barrio target  ║
║                            │      │      │                          ║
║  Compartir venue           │ 2.0  │ 2+   │ Validación social.      ║
║                            │      │      │ Lo recomienda a otros.   ║
║                            │      │      │                          ║
║  Des-guardar venue         │ -2.0 │ 2+   │ Señal negativa fuerte.  ║
║                            │      │      │ Resta del mood/tipo.     ║
║                            │      │      │                          ║
║  ── ACCIONES SECUNDARIAS ─────────────────────────────────────────  ║
║                                                                      ║
║  Abrir ficha + >15s        │ 1.5  │ 1+   │ Interés real aunque no  ║
║                            │      │      │ guardó. Mood + tipo +    ║
║                            │      │      │ barrio.                  ║
║                            │      │      │                          ║
║  Scroll completo de ficha  │ 1.3  │ 1+   │ Leyó todo. Alto interés.║
║                            │      │      │                          ║
║  Ver galería completa      │ 1.2  │ 1+   │ Interés visual/estético.║
║                            │      │      │                          ║
║  Buscar + click resultado  │ 1.0  │ 1+   │ Búsqueda intencional    ║
║                            │      │      │ confirmada.              ║
║                            │      │      │                          ║
║  ── SEÑALES PASIVAS ──────────────────────────────────────────────  ║
║                                                                      ║
║  Card visible >3s (feed)   │ 0.5  │ 1+   │ Exposición sin rechazo. ║
║                            │      │      │ Señal débil positiva.    ║
║                            │      │      │                          ║
║  Mood pill seleccionado    │ 0.8  │ 1+   │ Preferencia explícita   ║
║                            │      │      │ de mood.                 ║
║                            │      │      │                          ║
║  Filtro aplicado           │ 0.7  │ 1+   │ Preferencia de tipo,    ║
║                            │      │      │ precio, zona, ocasión.   ║
║                            │      │      │                          ║
║  Hora de apertura de app   │ 0.3  │ 2+   │ Franja preferida.       ║
║                            │      │      │                          ║
║  Ubicación GPS             │ 0.3  │ 1+   │ Barrio actual/habitual. ║
║                            │      │      │                          ║
║  ── SEÑALES NEGATIVAS ────────────────────────────────────────────  ║
║                                                                      ║
║  Abrir ficha <3s + cerrar  │ -0.3 │ 1+   │ No le interesó. Resta  ║
║                            │      │      │ leve del mood/tipo.      ║
║                            │      │      │                          ║
║  Búsqueda sin clicks       │ -0.2 │ 1+   │ Resultados no relevantes║
║                            │      │      │ (problema de ranking).   ║
║                            │      │      │                          ║
║  Scroll rápido sin taps    │ -0.1 │ 1+   │ Feed no engancha.       ║
║                            │      │      │ (señal de relevancia).   ║
║                            │      │      │                          ║
║  ── SEÑALES EXPLÍCITAS (micro-momentos) ──────────────────────────  ║
║                                                                      ║
║  Respuesta a "¿con quién?" │ 2.0  │ 2+   │ Compañía habitual.      ║
║                            │      │      │                          ║
║  Slider ruido              │ 2.0  │ 2+   │ Noise tolerance.        ║
║                            │      │      │                          ║
║  Respuesta a presupuesto   │ 2.0  │ 2+   │ Price range.            ║
║                            │      │      │                          ║
║  Moods del onboarding      │ 1.5  │ 2    │ Seed inicial del perfil.║
║                            │      │      │ Decae con uso real.      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Progresión Visual del Aprendizaje

### Lo que el usuario experimenta en cada milestone:

```
MILESTONE: 0 GUARDADOS (anónimo o nuevo)
┌─────────────────────────────────────┐
│ Feed: Genérico por hora + ciudad    │
│ Home: Secciones estándar            │
│ Tab You: "Creá cuenta para..."      │
│ Nivel de personalización: 0%        │
└─────────────────────────────────────┘
              │
              ▼
MILESTONE: 1er GUARDADO (registro)
┌─────────────────────────────────────┐
│ Feed: Seed con moods del onboarding │
│ Home: Igual + "Tu primer guardado"  │
│ Tab You: Barra de progreso 1/10     │
│ Nivel de personalización: 10%       │
└─────────────────────────────────────┘
              │
              ▼
MILESTONE: 3 GUARDADOS
┌─────────────────────────────────────┐
│ Feed: Boost sutil de moods favoritos│
│ Home: Aparece sección "Más como     │
│       [lugar guardado]"             │
│ Tab You: Progreso 3/10             │
│ Micro-momento: "¿Con quién salís?" │
│ Nivel de personalización: 25%       │
└─────────────────────────────────────┘
              │
              ▼
MILESTONE: 5 GUARDADOS
┌─────────────────────────────────────┐
│ Feed: "Para vos" notablemente mejor │
│ Home: Aparece "Porque te gusta      │
│       [mood]" como sección          │
│ Tab You: Perfil básico visible      │
│       (barras de mood, sin radar)   │
│ Micro-momento: Slider ruido         │
│ Nivel de personalización: 40%       │
└─────────────────────────────────────┘
              │
              ▼
MILESTONE: 10 GUARDADOS
┌─────────────────────────────────────┐
│ Feed: Altamente personalizado       │
│ Home: Secciones dinámicas basadas   │
│       en perfil real                │
│ Tab You: Perfil completo:           │
│       radar + texto + stats         │
│ Push: Primera notificación          │
│       personalizada                 │
│ Nivel de personalización: 70%       │
└─────────────────────────────────────┘
              │
              ▼
MILESTONE: 20+ GUARDADOS
┌─────────────────────────────────────┐
│ Feed: Refinado y diversificado      │
│ Home: "Tu semana Korantis"          │
│       (5 recomendaciones semanales) │
│ Tab You: Texto descriptivo generado │
│       + stats ricos + trends        │
│ Motor: taste_memory peso sube a 0.20│
│ Nivel de personalización: 90%       │
└─────────────────────────────────────┘
              │
              ▼
MILESTONE: 50+ GUARDADOS (power user)
┌─────────────────────────────────────┐
│ Feed: "Discover" mode - más novelty │
│ Home: Secciones de exploración      │
│       de zonas/moods nuevos         │
│ Tab You: Korantis Wrapped candidate │
│ Motor: Anti-burbuja activo          │
│ Nivel de personalización: 95%       │
│ + diversificación anti-monotonía    │
└─────────────────────────────────────┘
```

---

## Anti-Burbuja: Evitar el Overfitting

### Problema: Si solo muestro lo que coincide con el perfil, el usuario se aburre.

### Solución: Balance exploración vs. explotación

```python
def calculate_exploration_ratio(user):
    """
    Cuánto contenido "fuera de perfil" mostrar.
    Más historial → más exploration para evitar monotonía.
    """
    
    saves = user.total_saves
    
    if saves < 5:
        return 0.0   # Solo explotación (no hay perfil confiable)
    elif saves < 15:
        return 0.10  # 10% exploración
    elif saves < 30:
        return 0.15  # 15% exploración
    elif saves < 50:
        return 0.20  # 20% exploración
    else:
        return 0.25  # 25% exploración (power users need more novelty)


def build_feed(user, context):
    """
    Construye el feed mezclando recomendaciones personalizadas
    con descubrimiento fuera de perfil.
    """
    
    exploration_ratio = calculate_exploration_ratio(user)
    
    # Venues altamente compatibles
    exploitation_venues = rank_by_taste_match(user, context, limit=15)
    
    # Venues fuera de perfil pero interesantes
    # (alto editorial_quality + novelty, bajo taste_match)
    exploration_venues = rank_by_novelty_and_quality(
        user, context, 
        exclude_high_match=True,
        limit=5
    )
    
    # Mezclar
    feed = interleave(
        exploitation_venues, 
        exploration_venues, 
        ratio=exploration_ratio
    )
    # Resultado: cada 5-6 venues "para vos", 1 "descubrimiento nuevo"
    
    return feed
```

### Señales de que necesita más exploración:

| Señal | Interpretación | Acción |
|-------|---------------|--------|
| No guardó nada en 2 semanas | Feed no le sorprende | Aumentar novelty weight |
| Abre app pero scroll < 5 cards | No encuentra nada interesante | Inyectar venues fuera de perfil |
| Solo guarda del mismo barrio | Burbuja geográfica | Sección "Más allá de [barrio]" |
| Solo guarda mismo mood | Burbuja emocional | Sección "¿Y si probás [mood opuesto]?" |
| D7 retention bajando | Está perdiendo interés | Push con venue sorpresa |

---

## Resumen del Sistema en 3 Frases

1. **Sin login:** La app funciona bien genericamente, personalizándose sutilmente dentro de cada sesión por las señales observadas.

2. **Usuario nuevo:** Cada guardado mejora el feed. Micro-momentos opcionales aceleran el aprendizaje. El perfil se construye solo en 2-3 semanas de uso normal.

3. **Usuario recurrente:** El feed es una experiencia personal que mejora continuamente, con balance entre confirmación de gusto y descubrimiento de lo nuevo. El perfil visible es un espejo satisfactorio del gusto propio.

**El resultado:** El usuario nunca siente que "configuró" nada. Solo usó la app, y la app se volvió progresivamente más suya.
User: Diseñá modelos de monetización para Korantis sin destruir la confianza del usuario. La app recomienda bares, cafés y restaurantes por mood. Quiero evitar que parezca una guía pagada o publicidad disfrazada.

Analizá:
1. Sponsorships.
2. Featured venues.
3. Reservas.
4. SaaS para locales.
5. Analytics para venues.
6. Eventos y experiencias.
7. Membership premium.
8. Qué monetización NO conviene al principio.
9. Cuándo monetizar.
10. Cómo mantener independencia editorial.
Model: # Modelos de Monetización — Korantis

## Sin Destruir la Confianza

---

## Principio Fundacional

> **La confianza editorial ES el producto. Sin confianza, no hay diferencial. Sin diferencial, no hay monetización posible.**

Korantis no vende lugares. Korantis vende criterio. El día que un usuario sienta que un lugar aparece porque pagó y no porque es bueno para él, el producto muere. No es una exageración — es exactamente lo que pasó con Yelp, donde la percepción de "pagan para aparecer arriba" destruyó la credibilidad.

### La regla de oro:

**El usuario nunca debe dudar de por qué un lugar aparece en su feed.**

Si aparece, es porque matchea su mood, su momento, su gusto. Punto. El dinero no puede comprar relevancia. Solo puede comprar visibilidad adicional en contextos donde la relevancia ya existe.

---

## 1. Sponsorships (Patrocinios de marca)

### Modelo:

Marcas (no venues individuales) patrocinan secciones temáticas, listas curadas o experiencias dentro de la app.

### Cómo funciona:

```
EJEMPLO 1: Marca de gin patrocina sección
┌─────────────────────────────────────┐
│                                     │
│ "Nocturnos con carácter"           │
│  Presentado por Hendrick's          │
│                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐  →→→  │
│ │bar 1 │ │bar 2 │ │bar 3 │        │
│ └──────┘ └──────┘ └──────┘        │
│                                     │
└─────────────────────────────────────┘

Los lugares NO son elegidos por Hendrick's.
Korantis elige los lugares editorialmente.
Hendrick's paga por la asociación de marca con la sección.
```

```
EJEMPLO 2: Tarjeta de crédito patrocina lista
┌─────────────────────────────────────┐
│                                     │
│ "5 lugares para impresionar"       │
│  Una selección AMEX × Korantis     │
│                                     │
│ [Lista completa →]                  │
│                                     │
└─────────────────────────────────────┘

Los lugares son curados por Korantis.
AMEX paga por el co-branding.
Opcional: beneficio para holders (un cóctel de bienvenida).
```

### Pricing estimado:

| Formato | Duración | Precio sugerido (con 50K MAU) |
|---------|----------|-------------------------------|
| Sección patrocinada en Home | 1 mes | $3,000 - $8,000 USD |
| Lista curada co-branded | 3 meses | $5,000 - $15,000 USD |
| Newsletter semanal patrocinada | 4 envíos | $2,000 - $5,000 USD |
| Experiencia co-branded (evento) | 1 evento | $5,000 - $20,000 USD |

### Por qué no destruye confianza:

- El sponsor es una MARCA, no un venue.
- Los venues dentro de la sección son elegidos por Korantis.
- Está claramente etiquetado ("Presentado por X").
- El usuario entiende que es publicidad de marca, no influencia sobre la recomendación.
- Análogo: Spotify tiene playlists patrocinadas pero nadie duda de que las canciones son buenas.

### Riesgo:

| Riesgo | Mitigación |
|--------|-----------|
| Sponsor quiere elegir los venues | Contrato claro: independencia editorial total. El sponsor patrocina la temática, no el contenido. |
| Exceso de secciones patrocinadas | Máximo 1 sección patrocinada visible por sesión. Nunca más de 2 en toda la home. |
| Sponsor pide exclusividad | No. Nunca excluir un competidor de un sponsor. Si Hendrick's patrocina, Tanqueray puede estar en la misma lista si el bar lo merece. |

### Timeline: Mes 6-9 (necesitás audiencia primero)

---

## 2. Featured Venues (Placement contextual pagado)

### Modelo:

Un venue paga para tener mayor visibilidad SOLO cuando su perfil coincide con lo que el usuario busca. No es un ad. Es un boost de posición condicional.

### La diferencia crítica vs. publicidad:

```
PUBLICIDAD TRADICIONAL (lo que NO hacemos):
- Venue paga → aparece primero SIEMPRE
- No importa si matchea con el usuario
- Se siente como spam
- Destruye confianza

PLACEMENT CONTEXTUAL KORANTIS (lo que sí hacemos):
- Venue paga → aparece primero SOLO SI matchea
- Si el mood, momento y gusto del usuario coinciden
- Se siente como una recomendación más relevante
- No destruye confianza porque ES relevante
```

### Cómo funciona técnicamente:

```python
def apply_featured_boost(venue, user, context):
    """
    Un venue "featured" solo recibe boost si PASA 
    el threshold mínimo de relevancia.
    """
    
    # Calcular score normal (sin boost)
    base_score = calculate_normal_score(venue, user, context)
    
    # GATE: Si el score base es < 0.4, NO BOOST.
    # No importa cuánto pague. Si no es relevante, no aparece.
    if base_score < 0.40:
        return base_score  # Sin cambio
    
    # Si pasa el gate, aplicar boost
    FEATURED_BOOST = 0.12  # Máximo 12% de boost
    
    boosted_score = base_score + FEATURED_BOOST
    
    # Cap: nunca puede superar el score máximo orgánico × 1.15
    max_allowed = base_score * 1.15
    boosted_score = min(boosted_score, max_allowed)
    
    return boosted_score
```

### Lo que ve el usuario:

```
┌───────────────────────────────────────┐
│ [FOTO ATMOSFÉRICA]                    │
│                                       │
│ Backroom Bar                    [♡]   │
│ Recoleta · Bar · $$                   │
│ "Una puerta discreta..."              │
│ [Íntimo] [Dorado] [Noche]  DESTACADO │
│                                 ↑      │
│                            Label sutil │
│                            en dorado   │
└───────────────────────────────────────┘
```

**"DESTACADO"** — label pequeño, sutil, transparente. No invasivo. No parece una ad, parece un badge.

### Reglas estrictas:

| Regla | Por qué |
|-------|---------|
| Máximo 1 venue featured por cada 10 orgánicos | No contaminar el feed |
| Solo aparece si mood match > 0.4 | Relevancia primero |
| Nunca en posición #1 | La primera recomendación siempre es puramente orgánica |
| El label "Destacado" siempre visible | Transparencia total |
| Un venue no puede pagar más para tener más boost | Evita pay-to-win |
| Si el usuario lo oculta/reporta, no vuelve a aparecer featured | Respeto al rechazo |
| La ficha del venue es IDÉNTICA a cualquier otra | No tiene contenido "de más" por pagar |

### Pricing:

| Modelo | Precio sugerido |
|--------|----------------|
| Pay-per-view de ficha (CPV) | $0.50 - $2.00 USD por vista de ficha desde featured |
| Pay-per-save (CPS) | $3.00 - $8.00 USD por guardado |
| Pay-per-directions (CPD) | $5.00 - $15.00 USD por tap en "cómo llegar" |
| Flat mensual (pyme) | $100 - $300 USD/mes con cap de impresiones |

### Por qué funciona sin destruir confianza:

1. **El venue ya era relevante.** Solo sube 1-2 posiciones, no aparece de la nada.
2. **Está etiquetado.** El usuario sabe que es destacado.
3. **La curación editorial no cambia.** La ficha dice la verdad. Si el lugar es ruidoso, dice ruidoso. Si es caro, dice caro. Pagar no compra una buena review.
4. **El threshold de relevancia es inquebrantable.** Si tu bar es energético y el usuario busca "calmo", no aparecés. Aunque pagues.

### Timeline: Mes 9-12 (necesitás volumen de usuarios + venues suficientes)

---

## 3. Reservas (Comisión por booking)

### Modelo:

Korantis no gestiona reservas. Korantis facilita el link a reserva y cobra comisión si se concreta.

### Opciones:

**Opción A: Deeplink a plataforma externa (Resy, OpenTable, TheFork)**

```
Venue Detail:
┌─────────────────────────────────────┐
│ ⏰ Reserva: Recomendada             │
│                                     │
│ [Reservar mesa →]                   │
│  Vía TheFork                        │
└─────────────────────────────────────┘

Korantis recibe comisión de afiliado por cada reserva completada.
Típico: $1-3 USD por reserva confirmada.
```

**Opción B: Integración directa (V3+)**

```
Venue Detail:
┌─────────────────────────────────────┐
│ ⏰ Reservar en Backroom Bar         │
│                                     │
│ Fecha: [Hoy ▼] Hora: [21:00 ▼]    │
│ Personas: [2 ▼]                     │
│                                     │
│ [Confirmar reserva]                 │
└─────────────────────────────────────┘

Korantis gestiona la reserva + cobra comisión.
Típico: $3-5 USD por comensal confirmado.
```

### Evaluación:

| Opción | Esfuerzo | Revenue | Timeline |
|--------|----------|---------|----------|
| A: Afiliados | Bajo (solo integrar links) | Bajo ($1-3/reserva) | Mes 3-4 |
| B: Integración propia | Alto (sistema de reservas) | Medio ($3-5/comensal) | Mes 9-12 |

### Por qué no destruye confianza:

- La reserva es un **servicio al usuario**, no una presión.
- Korantis no recomienda lugares que requieren reserva por encima de otros PORQUE se lleva comisión.
- El botón de reserva es útil y opcional.
- La comisión la paga el venue o la plataforma, no el usuario.

### Riesgo:

| Riesgo | Mitigación |
|--------|-----------|
| Sesgar hacia venues con reserva (porque generan revenue) | Regla: el ranking NUNCA considera si un venue tiene reserva o no. Cero influencia. |
| Parecer que empujás a reservar | El CTA es secundario. Los CTAs principales son "Guardar" y "Cómo llegar". Reserva es terciario. |

### Recomendación: Empezar con Opción A (afiliados) como revenue pasivo desde mes 3. No es la monetización principal, es complemento.

---

## 4. SaaS para Locales (Dashboard de Venue)

### Modelo:

Los venues pagan una suscripción mensual por acceso a un dashboard donde pueden:
- Ver métricas de su ficha (vistas, guardados, "cómo llegar").
- Actualizar información operativa (horarios, eventos, menú).
- Recibir feedback anónimo de cómo los clasifica el sistema.
- Acceder a insights de audiencia (qué tipo de usuarios los miran).

### Tiers:

```
TIER GRATUITO (todos los venues):
├── Ficha en Korantis (curada editorialmente)
├── Métricas básicas: vistas/mes
└── Notificación si la ficha se actualiza

TIER "PULSE" ($49-99 USD/mes):
├── Dashboard completo de métricas
│   ├── Vistas diarias/semanales
│   ├── Guardados totales y tendencia
│   ├── Taps en "cómo llegar"
│   ├── Búsquedas que los encuentran
│   └── Comparación con venues similares
├── Insights de audiencia
│   ├── Moods más buscados por quienes los visitan
│   ├── Franjas horarias de mayor interés
│   ├── Edad/perfil de usuarios interesados
│   └── Ocasiones más asociadas
├── Actualización de horarios y datos operativos
├── Solicitar re-evaluación editorial (1x por trimestre)
└── Badge "Verificado por el venue" en la ficha

TIER "SIGNAL" ($199-349 USD/mes):
├── Todo lo de Pulse +
├── Featured placement contextual incluido
│   (N impresiones/mes con reglas de relevancia)
├── Acceso a insights de competencia
│   (cómo se comparan vs otros del barrio/tipo)
├── Alertas de tendencia
│   ("El interés por tu mood 'íntimo' creció 30% este mes")
├── Prioridad en re-evaluación editorial
├── Respuesta a "¿Por qué no aparezco para X mood?"
│   (feedback de scoring con sugerencias)
└── 1 foto profesional/trimestre (Korantis envía fotógrafo)
```

### Dashboard mockup:

```
┌─────────────────────────────────────────────────┐
│ KORANTIS VENUE DASHBOARD                         │
│ Backroom Bar · Recoleta                          │
├─────────────────────────────────────────────────┤
│                                                   │
│ ESTE MES                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ 847     │ │ 62      │ │ 31      │            │
│ │ Vistas  │ │Guardados│ │Direccion│            │
│ │ +12% ▲  │ │ +8% ▲   │ │ +22% ▲  │            │
│ └─────────┘ └─────────┘ └─────────┘            │
│                                                   │
│ QUIÉN TE BUSCA                                   │
│ ├── Mood más asociado: Íntimo (78%)             │
│ ├── Franja de interés: Noche (85%)              │
│ ├── Ocasión top: Primera cita (42%)             │
│ └── Perfil: 25-35, pareja, $$-$$$              │
│                                                   │
│ TU SCORING ACTUAL                                │
│ ├── Mood "Íntimo" noche: 4.5/5                  │
│ ├── Mood "Social" noche: 2.1/5                  │
│ ├── Confidence score: 0.89                       │
│ └── Última evaluación: 15/01/2025               │
│                                                   │
│ BÚSQUEDAS QUE TE ENCUENTRAN                     │
│ ├── "bar íntimo recoleta" (23 veces)            │
│ ├── "lugar para cita" (18 veces)                │
│ ├── "speakeasy buenos aires" (12 veces)         │
│ └── "bar calmo" (9 veces)                       │
│                                                   │
│ SUGERENCIA KORANTIS                              │
│ "Tu terraza no está reflejada en las fotos.     │
│  Agregar fotos de exterior podría aumentar       │
│  tu visibilidad para búsquedas de 'terraza'."   │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Por qué no destruye confianza:

- **El venue NO puede editar su ficha editorial.** Solo datos operativos (horarios, teléfono).
- **El scoring NO cambia por pagar.** Pulse y Signal dan insights, no ranking.
- **La re-evaluación editorial puede resultar en scores MÁS BAJOS.** Es honesta.
- **El dashboard es un espejo, no un control.** Le dice al venue cómo lo ve el sistema, no le deja manipularlo.

### Revenue proyectado:

| Escenario | Venues activos | Conversión a pago | ARPU | MRR |
|-----------|---------------|-------------------|------|-----|
| Mes 6 (100 venues) | 100 | 10% (10 pagos) | $75 | $750 |
| Mes 12 (300 venues) | 300 | 15% (45 pagos) | $120 | $5,400 |
| Mes 18 (500 venues) | 500 | 18% (90 pagos) | $150 | $13,500 |
| Mes 24 (1000 venues, 2 ciudades) | 1000 | 20% (200 pagos) | $175 | $35,000 |

### Timeline: Mes 6-9 (necesitás métricas que mostrar)

---

## 5. Analytics para Venues (Data Intelligence)

### Modelo:

Vender insights agregados (no individuales) sobre comportamiento de consumidores urbanos a:
- Grupos gastronómicos (multi-venue).
- Real estate (dónde abrir un nuevo local).
- Marcas de bebidas/alimentos (dónde está su audiencia).
- Consultoras de hospitalidad.

### Productos:

```
PRODUCTO 1: "Mood Map Report" (trimestral)
├── Informe de tendencias de mood por barrio/ciudad
├── Qué busca la gente este trimestre vs anterior
├── Franjas horarias con mayor demanda insatisfecha
├── Barrios emergentes por tipo de búsqueda
└── Precio: $2,000 - $10,000 USD por reporte

PRODUCTO 2: "Location Intelligence"
├── Para un punto específico (dirección):
│   ├── Qué moods buscan los usuarios en esa zona
│   ├── Qué vacancy de oferta hay (mood buscado pero sin venues)
│   ├── Perfil demográfico de buscadores en la zona
│   └── Competencia: venues existentes y sus scores
└── Precio: $5,000 - $15,000 USD por análisis

PRODUCTO 3: "Brand Audience Match"
├── Para una marca de bebidas:
│   ├── En qué venues su audiencia target está más activa
│   ├── Qué moods asocian a su categoría
│   ├── Oportunidades de activación por franja/barrio
│   └── Overlap con competidores
└── Precio: $8,000 - $25,000 USD por estudio
```

### Por qué no destruye confianza:

- **Los datos son agregados y anónimos.** Nunca se vende info individual de un usuario.
- **No afecta el producto del usuario.** El feed, las recomendaciones, nada cambia.
- **El usuario nunca sabe ni le importa** que Korantis vende reportes B2B.
- Es un revenue stream completamente invisible para el usuario final.

### Riesgo:

| Riesgo | Mitigación |
|--------|-----------|
| Percepción de "venden mis datos" | Política de privacidad clara. Nunca data individual. Solo agregados anónimos de 1000+ usuarios. |
| Venue que paga por analytics quiere influir en su scoring | Cero relación. Analytics es un producto aparte. El equipo editorial no sabe quién compra reportes. |

### Timeline: Mes 12-18 (necesitás volumen de data significativo)

---

## 6. Eventos y Experiencias

### Modelo:

Korantis organiza o co-organiza eventos curados que extienden la experiencia del producto al mundo real. Monetiza por tickets o sponsorship.

### Formatos:

```
FORMATO 1: "Korantis Nights" (recurrente, mensual)
├── Qué: Una noche curada en un venue seleccionado
├── Propuesta: "Experimentá un mood en persona"
├── Ejemplo: "Noche de Refugio" en un speakeasy
│   - Cóctel de bienvenida incluido
│   - Playlist curada por Korantis
│   - Grupo limitado (30 personas)
│   - Sin teléfonos (opcional, por mood)
├── Ticket: $25-50 USD por persona
├── Revenue split: 60% Korantis / 40% venue (consumo)
└── Capacidad: 30-50 personas

FORMATO 2: "Recorrido de Mood" (semanal o quincenal)
├── Qué: Recorrido por 3-4 venues de un mismo mood
├── Propuesta: "Una ruta emocional por la ciudad"
├── Ejemplo: "Ruta Calma" - 4 cafés de Palermo, 3 horas
│   - Un café/bebida en cada parada
│   - Guía Korantis (persona del equipo o partner)
│   - Grupo íntimo (8-12 personas)
├── Ticket: $40-80 USD por persona
└── Revenue: Ticket completo para Korantis (venues ganan consumo extra)

FORMATO 3: "Korantis × [Marca]" (esporádico, pagado por marca)
├── Qué: Evento co-branded para lanzamiento de producto
├── Ejemplo: "Korantis × [Gin brand]: Noche Contemplativa"
│   - Cócteles con el producto de la marca
│   - Venue seleccionado por match con mood de la marca
│   - Asistentes curados (invitaciones a users del mood)
├── Paga: La marca ($5,000-20,000 por evento)
├── Korantis aporta: curación + audiencia + venue selection
└── El usuario: invitación gratuita o ticket reducido

FORMATO 4: "Mesa Korantis" (exclusivo, V3+)
├── Qué: Reserva de mesa curada para ocasión especial
├── Propuesta: "Decinos la ocasión, armamos la noche"
├── Ejemplo: "Aniversario para 2 - íntimo - presupuesto $$$"
│   - Korantis elige el venue + mesa + horario óptimo
│   - Puede incluir: recomendación de qué pedir, playlist sugerida
├── Fee: $15-30 USD por servicio de curación
└── Upsell: partner con florería, sommelier, etc.
```

### Por qué no destruye confianza:

- Los eventos son una **extensión del producto**, no una distorsión.
- Los venues participan por ser buenos para el mood, no por pagar.
- El usuario que asiste tiene una experiencia que VALIDA la promesa de la app.
- Es el único canal donde la experiencia Korantis se vuelve tangible.

### Riesgo:

| Riesgo | Mitigación |
|--------|-----------|
| Venues paguen por ser "sede" de evento | Nunca. Korantis elige sede por fit con el mood del evento. Punto. |
| Eventos que no matchean la marca | Curación estricta. Si un evento no sale bien, deja de existir. |
| Escalar eventos = operación pesada | Limitar a 2-4 por mes. Es branding + revenue, no el core business. |

### Timeline: Mes 6-9 (bajo costo de ejecución, alto valor de marca)

---

## 7. Membership Premium (Suscripción de usuario)

### Modelo:

Versión gratuita completa + versión premium con personalización avanzada y features exclusivos.

### Lo que es GRATIS (siempre):

```
GRATIS PARA SIEMPRE:
├── Feed completo de lugares
├── Búsqueda y filtros
├── Venue detail completo
├── Guardar lugares (ilimitado)
├── Crear hasta 3 colecciones
├── Atlas (mapa) completo
├── 1 mood pill activo a la vez
└── Perfil de gusto básico
```

### Lo que es PREMIUM:

```
KORANTIS PREMIUM: $4.99 - $7.99 USD/mes (o $49.99/año)

├── PERSONALIZACIÓN AVANZADA
│   ├── "Tu Semana Korantis": 5 recomendaciones personalizadas
│   │   entregadas cada lunes (push + in-app)
│   ├── Feed completamente personalizado con taste_memory
│   ├── Multi-mood filtering (combinar 2+ moods simultáneos)
│   └── Perfil de gusto completo con texto generado
│
├── COLECCIONES ILIMITADAS
│   ├── Colecciones sin límite
│   ├── Colecciones compartibles por link
│   ├── Colecciones colaborativas (invitar amigos)
│   └── Auto-colecciones por mood ("Tus calmos", "Tus nocturnos")
│
├── ACCESO ANTICIPADO
│   ├── Venues nuevos 48hs antes que free users
│   ├── Listas curadas exclusivas (1-2/mes)
│   ├── Nuevas ciudades antes del launch público
│   └── Beta features
│
├── CONTEXTO EXPANDIDO
│   ├── Venue detail con "Behind the scenes"
│   │   (historia del lugar, quién lo diseñó, por qué funciona)
│   ├── Recomendación de "qué pedir" por venue
│   ├── "Mejor mesa" tips (dónde sentarse en cada lugar)
│   └── Horarios óptimos precisos ("llegá a las 19:30")
│
├── EXPERIENCE
│   ├── Acceso prioritario a eventos Korantis
│   ├── Descuento en Recorridos de Mood
│   ├── 1 "Mesa Korantis" incluida por año
│   └── Korantis Wrapped al final del año
│
└── CERO ADS
    └── Sin venues "Destacados" en el feed
        (opción de feed 100% orgánico)
```

### Evaluación de conversión:

| Métrica | Benchmark apps premium | Target Korantis |
|---------|----------------------|-----------------|
| Free → Trial | 15-25% | 20% |
| Trial → Paid | 30-50% | 35% |
| Free → Paid (directo) | 3-7% | 5% |
| Churn mensual | 5-10% | 7% |
| LTV (12 meses) | $40-70 | $50 |

### Revenue proyectado:

| Escenario | MAU | Conversión | Subscribers | MRR |
|-----------|-----|-----------|-------------|-----|
| Mes 6 | 10K | 3% | 300 | $1,800 |
| Mes 12 | 50K | 5% | 2,500 | $15,000 |
| Mes 18 | 100K | 6% | 6,000 | $36,000 |
| Mes 24 | 200K | 7% | 14,000 | $84,000 |

### La línea entre free y premium:

**Principio:** Free debe ser un producto COMPLETO y satisfactorio. Premium es para power users que quieren más profundidad. Nunca degradar free para vender premium.

| ✅ Aceptable para paywall | ❌ Inaceptable para paywall |
|--------------------------|----------------------------|
| Colecciones ilimitadas | Filtrar por mood |
| Recomendaciones semanales personalizadas | Ver la ficha completa |
| Contenido "behind the scenes" | Guardar lugares |
| Eventos prioritarios | Buscar |
| Feed sin destacados | Ver el mapa |
| Compartir colecciones | Acceder a cualquier venue |

### Timeline: Mes 9-12 (necesitás features suficientes que justifiquen pagar)

---

## 8. Qué Monetización NO Conviene al Principio

### ❌ NO hacer en los primeros 6 meses:

| Modelo | Por qué no ahora |
|--------|------------------|
| **Display advertising (banners)** | Destruye la estética premium. Incompatible con la identidad visual. Nunca, no solo "no ahora". |
| **Featured venues pagados** | Sin volumen de usuarios, no tiene valor para el venue. Y sin confianza establecida, se siente como spam. |
| **SaaS para locales** | Sin métricas que mostrar (necesitás tráfico), el dashboard está vacío. Nadie paga por métricas en 0. |
| **Comisiones de reserva** | Sin volumen de clicks en "reservar", el revenue es insignificante y la integración cuesta más que lo que genera. |
| **Membership premium** | Sin features suficientes que diferencien free de paid, nadie paga. Y la percepción de "ya me están cobrando" tan temprano es negativa. |
| **Venta de datos/analytics** | Sin volumen de data (necesitás 50K+ sesiones/mes), los insights no son estadísticamente significativos. |
| **Influencer partnerships pagados** | Venues pagando a Korantis para que influencers visiten y posteen = conflicto de interés directo con la curación editorial. |
| **Listings pagados** | "Pagá $50/mes para estar en Korantis" = somos un directorio, no un curador. Mata el posicionamiento. |

### ❌ NO hacer NUNCA:

| Modelo | Por qué nunca |
|--------|--------------|
| **Banners / display ads** | Muerte estética y de confianza. |
| **Pay-to-be-listed** | Venues deben estar por mérito editorial, nunca por pago. |
| **Ratings comprables** | Zero ratings, zero reviews, zero corrupción posible. |
| **Venue puede editar su copy editorial** | La curación es nuestra. Si el venue puede cambiar "ruidoso" por "animado", perdemos credibilidad. |
| **Data individual de usuarios vendida** | Ético + legal + reputacional. Nunca. |
| **Exclusividad geográfica** | "Sos el único bar en esta zona que aparece si pagás" = extorsión, no curación. |
| **Penalizar venues que no pagan** | Si un venue es bueno, aparece. Si deja de pagar, NO baja de ranking. Solo pierde el boost featured. |

---

## 9. Cuándo Monetizar

### Timeline de monetización:

```
MES 0-3: CERO MONETIZACIÓN
├── Foco: Producto + contenido + primeros 1000 usuarios
├── Revenue: $0
├── Inversión: Tiempo del equipo + hosting
└── Objetivo: Product-market fit cualitativo

MES 3-6: MONETIZACIÓN PASIVA MÍNIMA
├── Activar: Links de afiliado a reservas (TheFork, Resy)
├── Activar: Tip jar / Ko-fi si hay comunidad early
├── Revenue esperado: $100-500/mes
├── NO activar: Nada que requiera vender a venues
└── Objetivo: Validar que usuarios llegan a "reservar"

MES 6-9: PRIMER REVENUE REAL
├── Activar: Eventos Korantis (bajo costo, alto branding)
├── Activar: Newsletter patrocinada (1 sponsor sutil)
├── Explorar: Conversaciones con marcas (gin, vino, cerveza)
├── Revenue esperado: $2,000-5,000/mes
├── NO activar: SaaS para venues (todavía no hay métricas)
└── Objetivo: Break-even de costos operativos

MES 9-12: MODELO DUAL (B2C + B2B)
├── Activar: Membership premium (con suficientes features)
├── Activar: SaaS para venues tier básico ("Pulse")
├── Activar: Featured placement (con reglas estrictas)
├── Activar: Sponsorships de marca (1-2 activos)
├── Revenue esperado: $10,000-25,000/mes
└── Objetivo: Revenue recurrente predecible

MES 12-18: ESCALA
├── Activar: SaaS tier avanzado ("Signal")
├── Activar: Analytics B2B (primer reporte trimestral)
├── Activar: Mesa Korantis (servicio premium de curación)
├── Optimizar: Conversión free → premium
├── Revenue esperado: $30,000-80,000/mes
└── Objetivo: Path to profitability visible

MES 18-24: DIVERSIFICACIÓN
├── Activar: API de datos para partners (hoteles, dating apps)
├── Activar: White-label para hospitality brands
├── Activar: Experiencias recurrentes con monetización propia
├── Revenue esperado: $80,000-200,000/mes
└── Objetivo: Revenue diversificado, no dependiente de 1 fuente
```

### La regla de cuándo activar cada canal:

| Canal | Prerequisito para activar |
|-------|--------------------------|
| Afiliados de reserva | ≥100 clicks en "reservar" por mes |
| Eventos | ≥500 seguidores en alguna red + equipo con tiempo |
| Newsletter patrocinada | ≥5,000 suscriptores de email |
| Membership premium | ≥5 features exclusivos desarrollados + ≥10K MAU |
| SaaS venues | ≥30 días de métricas por venue + ≥20K MAU |
| Featured placement | ≥50K MAU + reglas de transparencia implementadas |
| Sponsorships de marca | ≥50K MAU + identidad de marca fuerte |
| Analytics B2B | ≥50K sesiones/mes + 6 meses de data histórica |

---

## 10. Cómo Mantener Independencia Editorial

### Estructura organizacional:

```
┌─────────────────────────────────────────────────┐
│            CEO / PRODUCT                         │
│                                                   │
│  ┌──────────────┐         ┌──────────────┐      │
│  │  EDITORIAL   │         │  COMMERCIAL  │      │
│  │              │         │              │      │
│  │ • Curación   │         │ • Ventas B2B │      │
│  │ • Scoring    │  MURO   │ • Sponsors   │      │
│  │ • Evaluación │◄═══════►│ • SaaS       │      │
│  │ • Contenido  │ ÉTICO   │ • Ads        │      │
│  │              │         │ • Revenue    │      │
│  └──────────────┘         └──────────────┘      │
│                                                   │
│  El equipo editorial NO sabe quién paga.         │
│  El equipo comercial NO influye en scoring.      │
│                                                   │
└─────────────────────────────────────────────────┘
```

### 10 Reglas de Independencia Editorial:

**Regla 1: Separación de iglesia y estado.**
El equipo que escribe fichas y asigna scores NO tiene acceso a la información de qué venues son clientes pagos. Punto.

**Regla 2: El scoring es ciego al revenue.**
La función de ranking no tiene un parámetro "is_paying_customer". El featured boost es un multiplier POST-scoring que solo aplica si el score base supera el threshold.

**Regla 3: Pagar no garantiza inclusión.**
Un venue puede pagar por SaaS y no estar publicado en la app si no pasa el filtro editorial de calidad mínima.

**Regla 4: Pagar no previene verdad incómoda.**
Si un venue paga por Signal ($349/mes) y su ficha dice "ruidoso, difícil hablar", la ficha sigue diciendo eso. Pagar no compra una mejor review.

**Regla 5: Dejar de pagar no penaliza.**
Si un venue cancela su suscripción, su ficha y ranking NO bajan. Solo pierde las herramientas de dashboard y el boost featured.

**Regla 6: El usuario tiene opt-out de comercial.**
Premium users pueden elegir "feed sin destacados" = cero featured placements.

**Regla 7: Transparencia con el usuario.**
Todo contenido con componente comercial tiene label visible: "Destacado", "Presentado por X", "Partner". Sin excepciones.

**Regla 8: Máximo comercial por sesión.**
Nunca más de:
- 1 venue featured por cada 10 orgánicos
- 1 sección patrocinada por sesión
- 0 intersticiales o pop-ups comerciales

**Regla 9: Auditoría trimestral.**
Cada trimestre, revisar: ¿los venues que pagan tienen scores más altos que los que no? Si la respuesta es sí por sesgo (no por coincidencia), hay un problema.

**Regla 10: El CEO tiene veto editorial.**
Si alguna vez hay presión comercial para cambiar un score, el CEO puede vetar. Y si el CEO no vetaría eso, hay un problema de cultura.

### Política pública (en la app, accesible):

```
┌─────────────────────────────────────────────────┐
│ CÓMO FUNCIONA KORANTIS                           │
│                                                   │
│ 1. Nuestras recomendaciones son editoriales.     │
│    Ningún lugar paga por aparecer.               │
│                                                   │
│ 2. Los lugares marcados "Destacado" tienen       │
│    un acuerdo comercial, pero SOLO aparecen      │
│    si son relevantes para tu mood y momento.     │
│                                                   │
│ 3. Nuestros scores no se venden ni se negocian.  │
│                                                   │
│ 4. Si un lugar es bueno para vos, aparece.       │
│    Si no lo es, no aparece. Pague o no.          │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## Modelo de Revenue Consolidado (Mes 12-18)

### Revenue mix objetivo:

```
┌─────────────────────────────────────────────────┐
│ REVENUE MIX TARGET (Mes 18)                      │
│                                                   │
│ ████████████████░░░░ 40% SaaS Venues             │
│ ██████████░░░░░░░░░░ 25% Premium Membership      │
│ ██████░░░░░░░░░░░░░░ 15% Sponsorships            │
│ ████░░░░░░░░░░░░░░░░ 10% Featured Placement      │
│ ██░░░░░░░░░░░░░░░░░░  5% Eventos                 │
│ ██░░░░░░░░░░░░░░░░░░  5% Afiliados + Otros       │
│                                                   │
│ TOTAL TARGET: $50,000 - $80,000 MRR              │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Por qué este mix:

| Fuente | % | Por qué este peso |
|--------|---|-------------------|
| SaaS Venues | 40% | Revenue más predecible. Churn bajo si dashboard es útil. Escala con catálogo. |
| Premium Membership | 25% | Revenue directo de usuarios. Alinea incentivos (mejor producto = más premium). |
| Sponsorships | 15% | High-margin, bajo esfuerzo operativo una vez establecido. |
| Featured | 10% | Limitado intencionalmente para preservar confianza. |
| Eventos | 5% | Alto valor de marca, bajo volumen. Complemento, no core. |
| Otros | 5% | Afiliados, APIs, proyectos especiales. |

### Alineación de incentivos:

```
PREGUNTA CLAVE: ¿Nuestro modelo de monetización nos incentiva 
a hacer mejor el producto?

SaaS Venues: SÍ
├── Más usuarios = más métricas para venues = más valor del SaaS
└── Incentivo: crecer audiencia

Premium Membership: SÍ
├── Mejor producto = más conversión a premium
└── Incentivo: mejorar features y personalización

Sponsorships: NEUTRO
├── Más alcance = más valor para sponsors
├── Pero no cambia el producto del usuario
└── Riesgo controlable con reglas de límite

Featured Placement: CUIDADO
├── Más venues featured = más revenue
├── PERO también = más ruido en el feed
└── Contrarrestar con cap estricto (10% del feed máximo)

Eventos: SÍ
├── Buenos eventos = mejor percepción de marca
└── Incentivo: curar bien, no maximizar tickets

CONCLUSIÓN: El mix está alineado. El mayor riesgo (featured) 
está limitado al 10% del revenue. El 90% viene de hacer 
mejor producto + más audiencia.
```

---

## Resumen: Prioridad de Implementación

| Prioridad | Canal | Mes de inicio | Complejidad | Revenue potencial M18 |
|-----------|-------|--------------|-------------|----------------------|
| 1 | Afiliados de reserva | 3 | Baja | $500/mes |
| 2 | Eventos Korantis | 6 | Media | $3,000/mes |
| 3 | Newsletter patrocinada | 6 | Baja | $2,000/mes |
| 4 | SaaS Venues (Pulse) | 9 | Alta | $15,000/mes |
| 5 | Premium Membership | 9 | Alta | $12,000/mes |
| 6 | Sponsorships de marca | 9 | Media | $8,000/mes |
| 7 | Featured Placement | 12 | Media | $5,000/mes |
| 8 | SaaS Venues (Signal) | 12 | Media (incremental) | $10,000/mes |
| 9 | Analytics B2B | 15 | Alta | $8,000/mes |
| 10 | API / White-label | 18 | Alta | Variable |

---

## La Frase Final

> **Korantis monetiza la confianza, no la traiciona. El día que un usuario sienta que una recomendación fue comprada, perdemos más de lo que cualquier venue podría pagarnos.**

El revenue sigue al trust. No al revés.
User: Korantis quiere lanzar en paralelo en Buenos Aires y New York. Analizá si tiene sentido estratégico. Considerá:
- contraste cultural
- densidad gastronómica
- dificultad de data
- marca global
- costos
- contenido
- usuarios iniciales
- posibilidad de expansión posterior a Londres, México, São Paulo y París

Dame:
1. Argumento a favor.
2. Argumento en contra.
3. MVP recomendado.
4. Qué ciudad usar como laboratorio.
5. Qué ciudad usar como prueba de ambición global.
6. Plan de lanzamiento de 60 días.
Model: # Estrategia Bi-Ciudad — Buenos Aires × New York

---

## Contexto Estratégico

Lanzar en dos ciudades simultáneamente es una decisión que parece ambiciosa pero tiene implicaciones profundas en recursos, foco, contenido, marca y velocidad de iteración. No es una decisión de marketing — es una decisión de producto.

---

## 1. Argumento a Favor (Lanzar en paralelo)

### El caso para BA + NYC simultáneo:

**A) Posicionamiento de marca global desde día 1**

Korantis no es una "app argentina de gastronomía". Es una plataforma global de descubrimiento emocional que EMPIEZA en dos ciudades. La diferencia de percepción es enorme:

- "App de Buenos Aires que también está en NY" → local intentando ser global.
- "App de BA y NYC" → global desde el origen, con identidad bicultural.

Para inversores, prensa, early adopters y partners, la narrativa de dos ciudades comunica ambición y viabilidad internacional. Es la diferencia entre "otra app argentina" y "un producto con futuro en 20 ciudades".

**B) Buenos Aires y New York son complementos perfectos**

| Dimensión | Buenos Aires | New York | Complementariedad |
|-----------|-------------|----------|-------------------|
| Idioma | Español | Inglés | Obliga a construir i18n desde día 1 (necesario para escalar) |
| Competencia | Baja (nadie hace esto aquí) | Alta (pero nadie hace ESTO) | BA valida sin ruido, NYC valida contra los mejores |
| Densidad gastro | Alta pero manejable (~3,000 relevantes) | Extrema (~25,000+ relevantes) | BA es cubierta con 100 venues, NYC requiere curaduría más estricta |
| Cultura de salida | Altísima, social, nocturna | Altísima, diversa, 24/7 | Ambas ciudades VIVEN afuera. El producto tiene sentido en ambas. |
| Early adopters | Creativos, foodies, tech-savvy porteños | Millennials urbanos, exhaustos de opciones | Dos audiencias diferentes que validan el mismo concepto |
| Costo de contenido | Bajo (equipo local, acceso directo) | Alto (requiere equipo/freelancers allá) | BA financia el contenido con recursos propios, NYC requiere inversión |
| Press/PR | Relevante en ecosistema latam | Relevante globalmente | Una nota en NYC multiplica 10x la de BA |

**C) Fuerza i18n y multi-ciudad desde la arquitectura**

Si construís solo para BA, es fácil hardcodear cosas: una timezone, un idioma, pesos argentinos, barrios porteños. Después migrar a multi-ciudad es un refactor doloroso.

Si arrancás con dos ciudades, la arquitectura NACE multi-idioma, multi-moneda, multi-zona. Eso es una ventaja enorme para ciudad 3, 4 y 5.

**D) NYC como signal de credibilidad**

Para un usuario en México, São Paulo o Londres, que Korantis "esté en Buenos Aires" no dice nada. Que "esté en New York" dice todo. NYC es la credencial universal de que un producto gastronómico/urbano funciona en el mercado más exigente.

**E) Diversificación de riesgo de mercado**

Argentina tiene inestabilidad económica, cambio de hábitos de consumo y riesgo regulatorio. NYC es mercado estable, con poder adquisitivo predecible y ecosistema de inversión cercano.

---

## 2. Argumento en Contra (No lanzar en paralelo)

### El caso para UNA ciudad primero:

**A) Densidad > Cobertura**

El producto se siente real cuando hay MUCHOS lugares, no cuando hay pocos en dos ciudades. 50 venues en BA + 50 en NYC = dos experiencias mediocres. 100 venues en BA = una experiencia densa y satisfactoria.

El usuario no piensa "qué cool que estén en dos ciudades". Piensa "¿por qué hay tan pocos lugares cerca mío?". La densidad local es lo que determina si el producto es útil o no.

```
PERCEPCIÓN DEL USUARIO:

50 venues en su ciudad:
"Busco 'bar calmo San Telmo' → 2 resultados"
= "Esto no tiene nada. Desinstalo."

150 venues en su ciudad:
"Busco 'bar calmo San Telmo' → 8 resultados"
= "Esto sí me sirve. Guardo 3."
```

**B) Cada ciudad es un producto diferente**

No es "la misma app con diferentes datos". Son contextos operativos completamente distintos:

| Dimensión | Buenos Aires | New York | Implicación |
|-----------|-------------|----------|-------------|
| Barrios relevantes | ~15 (Palermo a San Telmo) | ~40+ (Manhattan, Brooklyn, Queens...) | Taxonomía geográfica 3x más compleja |
| Precio referencia | $5,000 ARS un café | $6 USD un café | Dos sistemas de price_range incomparables |
| Idioma de reviews | Español | Inglés | NLP pipelines duplicados |
| Cultura de reserva | Baja (se llega sin reserva) | Alta (Resy culture) | Features diferentes necesarios |
| Momento de salida | Cena 21-22hs, bar post-midnight | Cena 19-20hs, bar 22-midnight | Franjas horarias distintas |
| Competencia por atención | Baja (pocas apps de discovery) | Brutal (Infatuation, Eater, NYMag, Resy) | Necesitás más diferenciación en NYC |
| Redes sociales | Instagram dominante | TikTok + Instagram | Estrategia de distribución distinta |
| Estacionalidad | Suave (clima templado) | Fuerte (invierno brutal cambia todo) | Scoring estacional necesario en NYC |

**C) El contenido de NYC es 5x más caro y difícil**

- En BA tenés acceso personal a los lugares. Conocés la ciudad. Podés evaluar 3-5 venues por día caminando.
- En NYC necesitás: equipo local O viajes frecuentes O freelancers editoriales con el tono correcto. Cada evaluación cuesta más en tiempo, transporte y acceso.
- Las fotos editoriales propias en NYC requieren fotógrafo local.
- La validación de horarios en NYC es más compleja (seasonal closures, pop-ups).

**D) El feedback loop se diluye**

Con 500 usuarios en BA y 500 en NYC, tardás el doble en aprender:
- ¿Los mood pills funcionan? (Necesitás volumen en UNA ciudad para saber.)
- ¿El ranking engine acierta? (Necesitás clics en UNA ciudad para medir.)
- ¿Los usuarios guardan? (Necesitás densidad para que encuentren algo que guardar.)

Con 1000 usuarios en UNA ciudad, aprendés 2x más rápido sobre el producto.

**E) El equipo se fragmenta**

Si son 2-3 personas, mantener contenido fresco en dos ciudades significa que ninguna ciudad recibe la atención que merece. El contenido se siente desactualizado más rápido, hay más venues por verificar, más horarios que confirmar, más fotos que actualizar.

**F) La marca no necesita NYC para validarse inicialmente**

Spotify arrancó en Suecia. Rappi en Colombia. MercadoLibre en Argentina. Waze en Israel. Ninguno necesitó "estar en NYC" para demostrar product-market fit. Lo que necesitaron fue densidad local y retención en UN mercado antes de expandir.

---

## 3. MVP Recomendado

### Veredicto: Buenos Aires primero, NYC a 60-90 días.

No es "solo BA". Es "BA con profundidad, NYC preparada para lanzar cuando BA demuestre retención".

### Estructura del MVP:

```
DÍA 1-60: BUENOS AIRES
├── 100-150 venues con fichas completas
├── Cobertura: Palermo, San Telmo, Recoleta, Villa Crespo,
│             Belgrano, Colegiales, Chacarita, Centro, Núñez
├── Producto completo: feed + search + save + atlas
├── Métricas: D1, D7, D30 retention + save rate
├── Usuarios target: 1,000-3,000 MAU
└── Resultado esperado: product-market fit cualitativo

DÍA 45-90: PREPARACIÓN NYC
├── Pipeline de contenido: 30-50 venues curados (draft)
├── Equipo/freelancers editoriales NYC identificados
├── Arquitectura multi-ciudad ya funcionando (desde BA)
├── Barrios seleccionados para lanzamiento: 
│   Manhattan (LES, West Village, SoHo, East Village)
│   Brooklyn (Williamsburg, Greenpoint, Cobble Hill)
├── Landing page "NYC coming soon" capturando emails
└── Resultado: contenido listo para publicar

DÍA 60-90: LANZAMIENTO NYC (SOFT)
├── 50-80 venues publicados
├── Usuarios: waitlist convertida + distribución orgánica
├── Producto: mismo que BA, localizado
├── Sin marketing paid — validación orgánica
└── Resultado: señal de que funciona cross-culturalmente
```

### Por qué este orden:

1. **BA primero = laboratorio barato.** Iterás el producto con acceso directo, costo bajo, y usuarios que podés entrevistar en persona.
2. **NYC segundo = prueba de escala.** Si el concepto funciona en BA pero NO en NYC, sabés que es un producto local. Si funciona en ambas, sabés que es global.
3. **El desfase de 60 días no mata la narrativa global.** Para inversores: "Lanzamos en BA, validamos en 60 días, y lanzamos en NYC." Es más creíble que "lanzamos en dos ciudades sin validar en ninguna".

---

## 4. Buenos Aires como Laboratorio

### Por qué BA es el laboratorio ideal:

**Acceso:**
- Podés visitar 5 venues por día personalmente.
- Conocés la ciudad, los barrios, los códigos culturales.
- Tenés red de contactos gastronómicos.
- El costo operativo es bajo (no necesitás equipo externo).

**Tamaño manejable:**
- ~15 barrios relevantes para gastro nocturna/café.
- ~3,000 venues totales relevantes, de los cuales ~500 son "Korantis material".
- Con 100-150 venues cubrís bien los barrios principales.
- Un usuario en Palermo tiene suficiente densidad con 40-50 venues.

**Audiencia receptiva:**
- Buenos Aires tiene cultura de salida extremadamente fuerte.
- Los porteños son opinados sobre lugares — les importa DÓNDE van.
- Hay una comunidad foodie activa (Instagram, blogs, grupos de WhatsApp).
- La competencia es débil: no hay un "The Infatuation" local.

**Velocidad de iteración:**
- Podés hablar con early users en persona.
- Podés llevar amigos a testear el flujo en contexto real.
- Los usuarios están en tu timezone.
- El feedback es inmediato y cultural (entendés las quejas).

### Lo que validás en BA:

| Hipótesis | Cómo se valida | Métrica |
|-----------|---------------|---------|
| Los usuarios buscan por mood | % de sesiones que usan mood pills | >40% |
| Los usuarios guardan lugares | Save rate (saves/opens) | >15% |
| Los usuarios vuelven | D7 retention | >20% |
| El contenido emocional diferencia | Tiempo en ficha vs benchmark | >45s promedio |
| La búsqueda por contexto funciona | Resultados clickeados post-filtro | >30% CTR |
| El mapa/Atlas se usa | % sesiones que abren Atlas | >15% |

### Lo que NO podés validar solo en BA:

- Si el concepto funciona en inglés y otra cultura.
- Si la marca premium/oscura atrae en un mercado más saturado.
- Si competís contra Infatuation/Eater/Resy stack.
- Si el pricing de premium/SaaS funciona en USD.
- Si el contenido escala con equipo externo (no fundadores).

→ Para eso necesitás NYC.

---

## 5. New York como Prueba de Ambición Global

### Por qué NYC valida globalidad:

**Si funciona en NYC, funciona en cualquier ciudad del mundo.**

NYC es:
- El mercado gastronómico más competitivo del planeta.
- La ciudad con más opciones y más decision fatigue.
- El mercado donde The Infatuation, Eater, NYMag, Time Out, Resy, y mil influencers ya compiten por la atención.
- El mercado donde los usuarios son más exigentes, tienen menos paciencia y más alternativas.

**Si Korantis retiene usuarios en NYC, la expansión a Londres/París/CDMX es cuestión de contenido, no de producto.**

### Lo que validás en NYC:

| Hipótesis | Cómo se valida | Por qué importa |
|-----------|---------------|-----------------|
| El concepto es cross-cultural | Usuarios angloparlantes lo usan igual | Expansión global viable |
| La marca funciona en mercado saturado | Retención comparable a BA | No es solo novedad local |
| El contenido escala con equipo externo | Fichas NYC son tan buenas como BA | Modelo de expansión replicable |
| La estética premium no aliena | Signup + retention en NYC | La identidad visual es universal |
| La monetización USD funciona | Willingness to pay en premium | Unit economics reales |
| El pitch para inversores US se sostiene | Traction en su propio mercado | Fundraising posible |

### Diferencias operativas para NYC:

```
BUENOS AIRES:                    NEW YORK:
├── Equipo core evalúa           ├── Freelancers editoriales locales
├── 1 timezone                   ├── Mismo timezone (EST ≈ ART-1)
├── Español                      ├── Inglés
├── Pesos → price_range relativo ├── USD → price_range absoluto
├── Reserva rara                 ├── Reserva cultura (Resy)
├── Barrios: 15 relevantes       ├── Barrios: 40+ relevantes
├── Hora de salida: 21-03        ├── Hora de salida: 18-01
├── Fotos: equipo propio         ├── Fotos: freelancer + curación IG
└── Data: Google + visita        └── Data: Google + Yelp + Resy + visita
```

### Barrios prioritarios para NYC launch (50-80 venues):

| Barrio | Por qué primero | Venues estimados |
|--------|----------------|-----------------|
| West Village | Densidad de calidad + audience match (30s professionals) | 15 |
| East Village / LES | Diversidad de moods + nightlife + cafés | 15 |
| Williamsburg | Cultura foodie + early adopters | 12 |
| SoHo / Nolita | Estética alta + density | 8 |
| Greenpoint | Emerging + calmo + productivo | 5 |
| Cobble Hill / Carroll Gardens | Íntimo + neighborhood feel | 5 |
| Chelsea | Midpoint accesible | 5 |

**Total para soft launch: ~65 venues** cubriendo 7 barrios con alta densidad de target audience.

---

## 6. Plan de Lanzamiento de 60 Días

### Overview:

```
SEMANA 1-2:  BA — Producto funcional + contenido base
SEMANA 3-4:  BA — Lanzamiento soft + primeros usuarios + iteración
SEMANA 5-6:  BA — Growth orgánico + NYC prep editorial
SEMANA 7-8:  BA — Retención + NYC soft launch
SEMANA 9:    AMBAS — BA optimización + NYC live
```

---

### SEMANA 1-2: Fundación (BA focus)

**Producto:**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 1-3 | Bottom tab bar + Home structure + Card component | Dev |
| 3-5 | Venue Detail completo | Dev |
| 5-7 | Mood pills funcionales + filtrado client-side | Dev |
| 7-9 | Search fullscreen + búsqueda por nombre | Dev |
| 9-11 | Save flow + registro (Google/Apple/email) | Dev |
| 11-14 | Pantalla Guardados + Atlas básico + empty states | Dev |

**Contenido:**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 1-14 | 50 venues BA evaluados + publicados | Editorial |
| 1-14 | Fotos curadas (hero + 2-3 por venue) | Editorial/Foto |
| 1-7 | Pipeline de contenido definido (templates, prompts, QA) | Editorial |
| 7-14 | Copywriting de app (empty states, onboarding, labels) | Editorial |

**Arquitectura:**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 1-3 | Schema de DB multi-ciudad implementado | Dev |
| 3-5 | i18n básico (español/inglés) en UI | Dev |
| 5-7 | City selector funcional | Dev |
| 7-14 | Deploy pipeline (CI/CD, staging, producción) | Dev |

**NYC prep (en paralelo, baja prioridad):**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 7-14 | Shortlist de 80 venues NYC para evaluar | Editorial |
| 7-14 | 2-3 freelancers editoriales NYC identificados | Founder |
| 10-14 | Landing page "NYC coming soon" con email capture | Dev (1h) |

---

### SEMANA 3-4: Launch BA (Soft)

**Producto:**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 15-17 | Onboarding 3 pasos | Dev |
| 17-19 | Carruseles horizontales en Home | Dev |
| 19-21 | Share venue (link + Open Graph) | Dev |
| 21-24 | Filtros expandibles (mood + tipo + zona + precio) | Dev |
| 24-28 | Bug fixes + performance pass | Dev |

**Contenido:**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 15-28 | 30 venues más → total 80 BA | Editorial |
| 15-21 | Secciones temáticas curadas (5 listas editoriales) | Editorial |
| 21-28 | Descripciones largas + momentos del día para top 30 venues | Editorial |

**Distribución BA:**

| Día | Acción | Canal | Target |
|-----|--------|-------|--------|
| 15 | Invitar 50 amigos/conocidos cercanos como beta | WhatsApp personal | 50 users |
| 17 | Post en Instagram personal + stories | IG | 100 views |
| 19 | Compartir en 3-5 grupos de gastro/foodie | WhatsApp/Telegram | 200-500 reach |
| 21 | Email a lista de interesados (si hay) | Email | Variable |
| 23 | 5 posts orgánicos con venues destacados | IG Korantis | Brand building |
| 25 | Outreach a 3-5 micro-influencers foodie BA | DM/Email | 1,000-5,000 reach |
| 28 | Análisis de primeros 14 días: qué funciona | Internal | Decisiones |

**Métricas a trackear:**

| Métrica | Target semana 3-4 | Alarma si |
|---------|-------------------|-----------|
| Signups | 200-500 | < 100 |
| D1 retention | > 40% | < 25% |
| D7 retention | > 20% | < 10% |
| Save rate (saves/ficha abierta) | > 12% | < 5% |
| Mood pill usage | > 30% de sesiones | < 15% |
| Fichas abiertas por sesión | > 3 | < 1.5 |
| Tiempo promedio en ficha | > 30s | < 15s |

---

### SEMANA 5-6: Crecimiento BA + Prep NYC

**Producto (iteración basada en data de semana 3-4):**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 29-31 | Fix de los top 3 problemas de UX detectados | Dev |
| 31-33 | Sección contextual dinámica (cambia por hora) | Dev |
| 33-35 | Colecciones (crear + agregar venues) | Dev |
| 35-38 | Push notifications setup (1x/semana max) | Dev |
| 38-42 | Search NLP básico ("café tranquilo palermo") | Dev |

**Contenido BA:**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 29-42 | 40 venues más → total 120 BA | Editorial |
| 29-35 | Newsletter semanal #1 y #2 | Editorial |
| 35-42 | 3 listas temáticas nuevas basadas en data de uso | Editorial |

**Contenido NYC (aceleración):**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 29-35 | 20 venues NYC evaluados (remotamente + freelancers) | Freelancers + Editorial |
| 35-42 | 30 venues más → total 50 NYC en draft | Freelancers + Editorial |
| 35-42 | Fotos curadas de 50 venues NYC (Instagram + Google) | Editorial |
| 38-42 | QA editorial: fichas NYC revisadas por tono y calidad | Founder/Editor jefe |
| 40-42 | Test de producto con 5-10 NYC users (amigos/contactos) | Founder |

**Distribución BA (aceleración):**

| Día | Acción | Target |
|-----|--------|--------|
| 29-42 | 3 posts/semana en IG Korantis con contenido de venues | Brand |
| 33 | Primer evento Korantis mini (café meetup, 15 personas) | Community |
| 35 | Outreach a 2-3 medios/blogs de gastronomía BA | PR |
| 38 | Programa de referidos simple ("invitá a un amigo") | Growth |
| 42 | Partnership con 1-2 venues para cross-promotion | Partnership |

---

### SEMANA 7-8: Consolidación BA + NYC Soft Launch

**Producto:**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 43-45 | City switcher funcional y testeado | Dev |
| 45-47 | NYC venues publicados (50-65) | Dev + Editorial |
| 47-49 | Verificar que todo funciona en inglés | Dev + QA |
| 49-52 | Ranking engine v0.1 (mood match + distance + time) | Dev |
| 52-56 | Perfil básico en tab "You" (stats simples) | Dev |

**NYC Launch (Soft):**

| Día | Acción | Canal | Target |
|-----|--------|-------|--------|
| 47 | Email a waitlist NYC ("Ya estamos") | Email | Waitlist completa |
| 48 | 5 posts en IG con venues NYC destacados | IG | Brand |
| 49 | Compartir en 2-3 groups de foodies NYC | Reddit/FB/Discord | 500-1000 reach |
| 51 | Outreach a 5 micro-influencers NYC food | DM/Email | 5,000-15,000 reach |
| 53 | Submit a Product Hunt (si tiene sentido) | PH | Tech audience |
| 55 | Outreach a 1-2 medios NYC (Eater, Grub Street, etc.) | PR | Credibilidad |

**BA (mantenimiento + growth):**

| Día | Entregable | Responsable |
|-----|-----------|-------------|
| 43-56 | 30 venues más → total 150 BA | Editorial |
| 43-56 | Newsletter semanal #3 y #4 | Editorial |
| 50 | Segundo evento Korantis (noche temática, 30 personas) | Community |
| 53-56 | Analizar retención D30 de primeros usuarios | Analytics |

---

### SEMANA 9: Ambas Ciudades Live — Evaluación

**Día 57-60: Assessment**

```
PREGUNTAS CLAVE A RESPONDER:

1. ¿BA retiene? (D7 > 20%, D30 > 10%)
   SÍ → El producto funciona. Seguir creciendo.
   NO → Problema de producto. Pausar NYC, iterar en BA.

2. ¿NYC funciona igual que BA? (métricas comparables)
   SÍ → El concepto es global. Acelerar NYC.
   NO → Investigar por qué. ¿Contenido? ¿UX? ¿Cultura?

3. ¿El contenido NYC es comparable en calidad?
   SÍ → El modelo de producción con freelancers escala.
   NO → Necesitás equipo propio NYC o cambiar pipeline.

4. ¿Los usuarios guardan? (save rate > 12% en ambas)
   SÍ → El loop de retención funciona. Monetización posible.
   NO → El contenido no genera deseo suficiente. Iterar fichas.

5. ¿Qué features se usan más/menos?
   → Priorizar roadmap de mes 3-4 basado en data real.
```

**Output del día 60:**

```
DOCUMENTO: "Korantis Day 60 Assessment"

├── Métricas BA: [tabla]
├── Métricas NYC: [tabla]
├── Comparación: [dónde funciona mejor/peor]
├── Top 3 problemas de producto: [lista]
├── Top 3 fortalezas validadas: [lista]
├── Decisión de foco mes 3-4: [BA, NYC, o ambas con qué split]
├── Roadmap de features mes 3-4: [priorizado por data]
├── Roadmap de contenido mes 3-4: [volumen + calidad targets]
└── Decisión de fundraise: [sí/no/cuándo]
```

---

## Plan de Expansión Post-60 Días

### Si BA + NYC funcionan → Path a ciudades 3-5:

```
CRITERIOS PARA CIUDAD SIGUIENTE:

├── Cultura de salida nocturna/gastro fuerte
├── Densidad de venues "Korantis material" (>500 relevantes)
├── Idioma: español o inglés (por ahora)
├── Acceso a equipo editorial local (freelancers o partner)
├── Tamaño de mercado de early adopters urbanos
├── Competencia local de discovery: ¿hay vacío?
└── Conexión cultural con audiencia existente (BA/NYC users que viajan)
```

### Ranking de ciudades para expansión:

| Ciudad | Prioridad | Timeline | Justificación |
|--------|-----------|----------|---------------|
| **Ciudad de México** | 1 | Mes 4-6 | Español + cultura gastro explosiva + mercado enorme + bajo costo editorial + audiencia Korantis natural |
| **Londres** | 2 | Mes 6-9 | Inglés + mercado premium + validación europea + audiencia compatible + buena densidad gastro |
| **São Paulo** | 3 | Mes 9-12 | Portugués (nuevo idioma) pero cultura de salida brutal + mercado masivo + expansión LATAM |
| **París** | 4 | Mes 12-15 | Francés (nuevo idioma) + capital gastronómica mundial + audiencia premium + expansión EU |
| **Barcelona** | 5 | Mes 12-15 | Español (ya existe) + turismo + cultura nocturna + puente a EU en español |
| **Miami** | Alt. | Mes 6-9 | Inglés + español + puente BA↔NYC + foodie culture + turistas LATAM |

### Por qué CDMX primero (después de NYC):

1. **Español** → El contenido pipeline ya existe en español.
2. **Costo editorial bajo** → Freelancers mexicanos accesibles y de calidad.
3. **Cultura gastro mundial** → CDMX es top 5 ciudades gastronómicas del mundo.
4. **Mercado enorme** → 22M de habitantes metro, clase media-alta masiva.
5. **Poca competencia** → No hay Infatuation/Eater equivalente local.
6. **Audiencia natural** → Mexicanos urbanos de 25-40 son el target perfecto de Korantis.
7. **Validación LATAM** → Si funciona en BA + CDMX, toda LATAM es viable.

### El modelo de expansión por ciudad:

```
PARA CADA CIUDAD NUEVA:

Semana -4 a 0 (Preparación):
├── Identificar 3-5 freelancers editoriales locales
├── Definir 5-7 barrios prioritarios
├── Evaluar 60-80 venues remotamente (reviews + fotos + AI draft)
├── Founder/editor viaja 3-5 días para evaluar top 20 in-situ
├── Landing page + waitlist
└── Entregable: 50-70 fichas listas para publicar

Semana 0 (Launch):
├── Publicar venues
├── Activar waitlist
├── Distribución orgánica local (IG, grupos, micro-influencers)
└── Meta: 200-500 signups en semana 1

Semana 1-4 (Growth):
├── 20-30 venues más (total 80-100)
├── Distribución continua
├── Primer evento local
├── Newsletter local activada
└── Meta: 1,000-3,000 MAU al final del mes 1

Costo por ciudad nueva: ~$5,000-15,000 USD
(freelancers + viaje + foto + distribución)
Tiempo: 4-6 semanas de prep → launch
```

---

## Resumen de Recomendación Estratégica

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ¿Lanzar BA + NYC en paralelo?                              │
│                                                               │
│  RESPUESTA: NO en paralelo exacto.                          │
│             SÍ en secuencia rápida (60 días de desfase).    │
│                                                               │
│  BA = Laboratorio (día 1)                                    │
│  NYC = Validación global (día 45-60)                        │
│                                                               │
│  La narrativa pública es "dos ciudades de lanzamiento".     │
│  La realidad operativa es "BA primero, NYC fast-follow".    │
│                                                               │
│  Para el usuario: ambas ciudades existen desde mes 2.       │
│  Para el equipo: BA tiene 6 semanas de ventaja.             │
│  Para inversores: "lanzamos en BA y NYC en Q1 2025".        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### La frase para el equipo:

> **"BA nos enseña el producto. NYC nos enseña la escala. Necesitamos ambas, pero en ese orden."**

### La frase para inversores:

> **"Lanzamos en Buenos Aires y New York en los primeros 90 días. BA como mercado con alta densidad cultural y bajo costo operativo. NYC como validación de que el modelo funciona en el mercado más competitivo del mundo."**

### La frase para usuarios:

> **"Korantis está en Buenos Aires y New York. Más ciudades pronto."**

Simple. Sin explicar la estrategia. Solo la promesa.