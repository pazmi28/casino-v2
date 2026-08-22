# Ruleta Tracker (v2)

App personal para registrar manualmente los números que salen en ruletas
físicas de varios casinos, detectar patrones estadísticos y sugerir
apuestas a partir de combinaciones observadas. No genera números
aleatorios: todo se introduce a mano tras observar la ruleta real.

Esta es la v2, migrada de Firebase a Supabase. Ver `CLAUDE.md` para el
contexto completo (modelo de datos, estructura de carpetas, estado y
pendientes) y `schema.sql` para el DDL de la base de datos.

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com) y ejecuta el
   contenido de `schema.sql` en el SQL Editor.
2. Copia `.env.example` a `.env.local` y rellena con la URL y la anon key
   del proyecto de Supabase (Settings → API).
3. Instala dependencias y arranca:

   ```bash
   npm install
   npm run dev
   ```

## Deploy en Vercel

1. Importa este repo en [vercel.com/new](https://vercel.com/new).
2. Antes del primer deploy, añade en Settings → Environment Variables
   (marcando Production, Preview y Development):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy. Vite se detecta automáticamente (build `vite build`, output `dist`).

## Estado

Funcional: gestión de casinos, registro de tiradas, búsqueda con vecinos en
rueda + mesa europea, estadística de vecinos/apuesta sugerida/secciones,
registro de sesiones de apuestas y gestor de patrones, todo contra Supabase.
Pendiente principal: cargar `number_combinations` desde el Excel, terminar de
cablear el tooltip propio de `NeighborStats` y decidir el despliegue. Ver la
sección "Estado actual" de `CLAUDE.md` para el detalle y lo que falta.
