# Ruleta Tracker — Contexto para Claude Code

## ¿Qué es este proyecto?
App personal para registrar manualmente los números que salen en ruletas físicas
de varios casinos (Zaragoza, Madrid, Barcelona), detectar patrones estadísticos
y, a futuro, sugerir apuestas a partir de combinaciones observadas.
**No genera números aleatorios**: todo el histórico se introduce a mano tras
observar la ruleta real. Es la v2 de una app existente en Firebase, migrada a
Supabase porque los datos no son críticos y el modelo es claramente relacional.

## Stack técnico
| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | React 19 + TypeScript | se mantiene, no se baja a JS plano |
| Build | Vite | |
| Estilos | Tailwind CSS | se mantiene, no se sustituye por CSS vanilla |
| Backend / BD | Supabase (Postgres) | sustituye a Firebase Firestore |
| Autenticación | Ninguna | app de un solo usuario, sin login |
| Despliegue | Pendiente de decidir (Vercel recomendado) | |

**Regla crítica (heredada de la metodología v5.2):** los componentes NUNCA
importan el cliente de Supabase directamente. Todo pasa por `services/` →
`hooks/` → `components/`.

## Estructura de carpetas
```
src/
├── services/
│   ├── supabaseClient.ts
│   ├── casinos.ts        ← list, create, deleteWithSpins (cascade)
│   ├── spins.ts           ← list, addMany, delete
│   ├── betSessions.ts     ← list, create  (hoy roto: el modal no guarda)
│   ├── patterns.ts        ← list, create, delete
│   └── combinations.ts    ← getByPrevNumber (datos del Excel)
├── hooks/
│   ├── useCasinos.ts
│   ├── useSpins.ts
│   └── useRouletteStats.ts   ← extrae el useMemo gigante de App.tsx
├── lib/
│   └── roulette.ts        ← COLOR_MAP, PRIMES, sectores: ÚNICA fuente,
│                              ya no se duplica entre componentes
├── types/
│   └── index.ts
└── components/
    ├── Casinos/
    ├── SpinHistory/
    ├── SearchPanel/
    │   └── WheelNeighbors.tsx   ← antes RouletteDisplay.tsx, mismo
    │                               algoritmo de vecinos (±11 y ±1
    │                               secundarios), con transición simple
    ├── BetLog/
    └── PatternManager/        ← nuevo
```

## Modelo de datos (Supabase / Postgres)
Ver `schema.sql` para el DDL completo. Resumen de tablas:

- **casinos**: `id, city (check Zaragoza|Madrid|Barcelona), name, created_at`
- **spins** (antes "entries"): `id, casino_id FK→casinos, number (0-36),
  color (columna generada R/N/V), created_at`
- **bet_sessions**: `id, casino_id FK nullable, session_date, losses_before_win,
  notes, created_at`
- **patterns**: `id, casino_id FK nullable (NULL = patrón global), name,
  description, confidence (1-5), created_at`
- **pattern_numbers**: `pattern_id FK, number` (PK compuesta)
- **number_combinations**: `prev_number, next_number (PK compuesta),
  suggested_bet, notes, confidence (1-5)` — alimentada manualmente desde
  `Ruleta_Combinaciones.xlsx`

RLS activado en todas las tablas con política permisiva para el rol `anon`
(sin login no hay `user_id` que filtrar). Si en el futuro se añade
autenticación, basta con cambiar las políticas de `anon` a `authenticated`.

## Secciones de la app
- **Casinos**: lista por ciudad, alta/baja (borrar casino borra sus tiradas
  en cascada vía FK, ya no hace falta el batch manual de Firestore)
- **Historial de tiradas**: entrada manual de números (0-36), color
  auto-inferido desde `lib/roulette.ts`
- **Vecinos en rueda**: dado un número buscado, resalta su posición física
  ±11 puestos y los 2 vecinos consecutivos a cada lado de esas posiciones.
  Es navegación visual sobre la secuencia fija de la rueda, no aleatorio.
- **Estadísticas**: tendencias par/impar, color, números calientes, rachas,
  primos, sectores (vecinos del cero, tercio del cilindro, huérfanos) —
  cálculo client-side sobre los datos traídos de Supabase
- **Registro de apuestas**: sesiones por fecha/casino con pérdidas antes de
  ganar y notas — el guardado real está pendiente de implementar (bug
  heredado de la v1, el modal no tenía `onChange` ni lógica de guardado)
- **Gestor de patrones** (nuevo): nombre, descripción, confianza 1-5 y lista
  de números asociados; pueden ser globales o ligados a un casino concreto
- **Sugerencias por combinación** (nuevo): apuesta sugerida según los 2
  últimos números consecutivos, alimentada desde el Excel de combinaciones

## Decisiones de diseño
- Sin autenticación; RLS con política permisiva para `anon`
- Colores fijos según el mapeo estándar europeo, calculados una vez como
  columna generada en Postgres y replicados en `src/lib/roulette.ts` para
  el cliente (nunca duplicados entre componentes como en la v1)
- Animación de la rueda de vecinos: empezar simple (transición CSS), sin
  física de bola; posible mejora futura si hace falta
- Sin migración de datos: se empieza con tablas vacías en Supabase

## Variables de entorno
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Estado actual
### Completado
- [x] Análisis y modelo de datos validado (este documento + schema.sql)
- [x] Registro de tiradas: `services/spins.ts` (listSpins / addSpins /
  deleteSpin), `hooks/useSpins.ts` (loading/error/reload + add con parseo y
  validación 0–36) y `components/SpinHistory/SpinHistory.tsx` (input +
  línea de tiempo con número/color/hora), integrado en `App.tsx` al
  seleccionar casino. El color se usa tal cual viene de Postgres.
- [x] Búsqueda con vecinos en rueda:
  `components/SearchPanel/WheelNeighbors.tsx` (dibuja los 37 números en
  círculo por ángulo usando `ROULETTE_SEQUENCE`; resalta el buscado, sus 2
  vecinos físicos a ±11 y los 4 secundarios a ±10/±12, con
  `transition-all duration-300`) y `components/SearchPanel/SearchPanel.tsx`
  (input + botón Buscar + cuenta de apariciones del número). `useSpins` se
  subió a `App.tsx` como instancia única compartida por `SpinHistory` y
  `SearchPanel`, de modo que la cuenta usa los spins ya cargados sin lanzar
  otra query.
- [x] Paleta y helpers de mesa unificados en `lib/roulette.ts`: `COLOR_STYLE`
  (R rojo-600 / N zinc-900 / V verde-700, única fuente; `SpinHistory` y
  `WheelNeighbors` ya no definen su propio mapeo), más `dozenOf`, `tableRow`,
  `isEven`, `isLow`, `isRed`. `WheelNeighbors` mide el contenedor real con
  `useLayoutEffect`+`ResizeObserver` y calcula el diámetro de cada casilla por
  la cuerda entre números (`2·r·sin(π/37)·0.88`), eliminando el solape. El
  contenedor de la rueda usa fondo claro (`bg-white border border-gray-200`,
  mismo lenguaje visual que las tarjetas) y los números sin resaltar van con su
  `COLOR_STYLE` pleno + `border border-black/10` (sin `opacity`, antes rojo y
  negro casi no se distinguían). El verde tapete es solo de la mesa (`TableLayout`).
  Nueva vista `components/SearchPanel/TableLayout.tsx`: mesa europea en CSS
  grid (0, 36 números, 2 to 1, docenas y apuestas sencillas) que resalta en
  blanco la casilla exacta y en dorado todo lo que el número buscado cumple,
  con `transition-all duration-300`. En `SearchPanel`, rueda y mesa van lado a
  lado en un flex (`lg:flex-row`, apilados por debajo de 1024px): la rueda en
  `w-full lg:w-[380px] flex-shrink-0` (ancho explícito imprescindible: sus
  hijos son `position:absolute` y no aportan tamaño, sin ancho el wrapper
  colapsaba a 0px) y la mesa en `flex-1 min-w-0 overflow-x-auto` (scroll
  horizontal en pantallas estrechas). El texto "El X ha salido N veces" queda
  encima del flex. Verificado en navegador: `clientWidth=380` (no 0) tanto en
  ventana ancha como estrecha.
- [x] Registro de sesiones de apuestas (arreglado el bug de la v1: el modal no
  guardaba nada). `services/betSessions.ts` (listBetSessions ordenadas por
  fecha desc / createBetSession / deleteBetSession), `hooks/useBetSessions.ts`
  (sessions/loading/error/reload/add/remove, tipo de retorno completo) y
  `components/BetLog/BetLog.tsx` (formulario con `<input type="date">` por
  defecto hoy vía `toISOString().slice(0,10)`, número de pérdidas antes de
  ganar, notas, botón Guardar; lista de sesiones con borrado y mensaje de
  vacío). Se sustituyó el mecanismo de fechas pre-generadas de la v1 por un
  selector de fecha normal. Integrado en `App.tsx` bajo `SearchPanel`.
- [x] Gestor de patrones (global / por casino). `parseNumbers` se movió de
  `useSpins` a `lib/roulette.ts` (fuente única; `useSpins` la importa).
  `services/patterns.ts` (listPatterns con `.or(casino_id.is.null,
  casino_id.eq.<id>)` + join `pattern_numbers(number)` mapeado a `number[]`
  plano / createPattern en dos inserts: patterns y luego pattern_numbers /
  deletePattern, que confía en el ON DELETE CASCADE), `hooks/usePatterns.ts`
  (patterns/loading/error/reload/add/remove, tipo completo; el parseo de
  números lo hace el componente, no el hook) y
  `components/PatternManager/PatternManager.tsx` (formulario nombre +
  descripción + select confianza 1–5 + checkbox global + números con el mismo
  aviso de inválidos que SpinHistory; tarjetas con badge Global/Este casino,
  confianza N/5, descripción y números como círculos con `COLOR_STYLE`).
  Integrado en `App.tsx` bajo `BetLog`. Arreglos tras la primera prueba: el
  componente valida que haya ≥1 número válido antes de llamar al servicio (sin
  ello se creaban patrones huérfanos sin números) y `createPattern` no llama a
  `pattern_numbers.insert` con array vacío; el guardado usa un único `feedback`
  (éxito o error, nunca los dos a la vez); nuevo `lib/errors.ts` con
  `errorMessage(e)` que lee `.message` de los errores de supabase-js (no son
  `instanceof Error`, antes salía siempre "Error desconocido"). `usePatterns.add`
  devuelve `string | null` en vez de escribir el `error` del hook.
- [x] Unificado el manejo de errores: `useSpins`, `useBetSessions` y
  `useCasinos` usan ya `errorMessage()` de `lib/errors.ts` (antes el
  `e instanceof Error` caía siempre al genérico con errores de supabase-js).
  Nuevo helper `columnOf(n)` en `lib/roulette.ts` (columna 2-a-1: 1=…1,4,7 /
  2=…2,5,8 / 3=…3,6,9, null para el 0). En `SpinHistory`, fila de 4 toggles
  independientes (Docena por defecto activo; Rango, Par/Impar, Columna) encima
  de la línea de tiempo: por cada toggle activo se añade una línea bajo la hora
  de cada círculo (orden fijo Docena→Rango→Par/Impar→Columna), formateada con
  `dozenOf`/`isLow`/`isEven`/`columnOf`; la línea de círculos no se filtra ni
  cambia. Estado en un `useState` local, sin persistir.
- [x] Estadística de vecinos en `SearchPanel` (debajo de la fila Rueda+Mesa).
  Nuevo helper `getNeighbors(n)` en `lib/roulette.ts` (vecinos físicos a ±11);
  `WheelNeighbors` lo usa para el resaltado primario en vez de calcular
  `rightIdx/leftIdx` por su cuenta (pinta igual). Nuevo
  `components/SearchPanel/NeighborStats.tsx` (props `searched` + `spins`, sin
  query nueva) con tres bloques en orden: (1) Vecino más probable — selector de
  alcance EXCLUYENTE (Todo / Últimas 10/20/30, por defecto Todo) que cuenta las
  apariciones de `getNeighbors(searched).left/right` en el subconjunto; badge
  "Más probable" al de más cuenta, "Empate" si igualan, y "Sin datos
  suficientes…" si suman 0 (en ese caso no se renderiza el bloque 2). (2)
  Próxima apuesta posible — toma el ganador del bloque 1 y muestra su
  docena/columna/rango buscando el % en `sectionStats` (no recalcula), con
  "Mejor cobertura" en el mayor %. (3) Sección más frecuente — SIEMPRE sobre
  todo el historial (ignora el alcance) y excluyendo el 0, % de cada docena/
  columna/rango con barras y badge "Más frecuente". `sectionStats` se calcula
  una vez (`useMemo` sobre spins) y lo reusan los bloques 2 y 3. Cada elemento
  con resultado calculado (las 2 tarjetas de vecino, las 3 de apuesta y todas
  las barras de sección, no solo los que llevan badge) tiene un `title` nativo
  con el desglose exacto (count/total/pct y alcance) reutilizando los valores
  ya mostrados, para poder comparar al pasar el ratón.
### Pendiente
- [ ] Crear proyecto en Supabase y ejecutar `schema.sql`
- [~] Implementar `services/` y `hooks/` (hecho: casinos, spins, betSessions,
  patterns; falta combinations)
- [~] Trocear `App.tsx` en los componentes de arriba (hecho: SpinHistory,
  SearchPanel/WheelNeighbors, BetLog, PatternManager; faltan el resto)
- [ ] Cargar `number_combinations` desde el Excel cuando esté terminado
- [ ] Decidir despliegue (Vercel recomendado por la metodología v5.2)

## Instrucciones generales para Claude Code
- Nunca importar el cliente de Supabase directamente en un componente;
  siempre `services` → `hooks` → `components`
- Reutilizar `src/lib/roulette.ts` para color/sectores/primos, no duplicar
  el mapeo en ningún componente
- Mantener Tailwind CSS; no introducir librerías UI adicionales sin pedir
  permiso antes
- Mantener TypeScript estricto: el tipo de retorno de `useRouletteStats`
  debe declarar TODOS los campos que devuelve (bug heredado de la v1)
