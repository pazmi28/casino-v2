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
### Pendiente
- [ ] Crear proyecto en Supabase y ejecutar `schema.sql`
- [~] Implementar `services/` y `hooks/` (hecho: casinos, spins; faltan
  betSessions, patterns, combinations)
- [~] Trocear `App.tsx` en los componentes de arriba (hecho: SpinHistory,
  SearchPanel/WheelNeighbors; faltan el resto)
- [ ] Arreglar el guardado real de `bet_sessions` (modal roto en v1)
- [ ] Implementar Gestor de patrones (global / por casino)
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
