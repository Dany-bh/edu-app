# AGENTS.md

## Proyecto

- Expo SDK 57 / Expo Router / React Native / TypeScript.
- Todo texto visible en español claro para estudiantes de 16-17 años.
- Rigor médico: nunca inventar datos clínicos.
- Si falta una fuente necesaria: marcar `TODO` explícito y avisar.
- Usar tokens existentes desde `src/constants/theme.ts`.
- Mantener compatibilidad móvil 360px, web 1280px y funcionalidad offline.
- Mantener lógica pura y pruebas relevantes para puntos, nivel, racha, IMC y quiz.
- Consultar la documentación exacta de Expo SDK 57 antes de usar una API nueva.

## Principios de modificación

- Preservar funcionalidad existente por defecto.
- Inspeccionar antes de editar.
- Hacer solo el cambio mínimo necesario.
- No modificar archivos fuera del alcance.
- No hacer refactors, renombres ni limpiezas accesorias.
- No cambiar APIs públicas o firmas sin necesidad y autorización.
- No sobrescribir cambios preexistentes del usuario.
- Distinguir cambios propios de cambios ya existentes.
- Sea detecte un diff inesperado, detenerse y reportarlo.

## Git

PROHIBIDO, salvo autorización explícita:

- `git reset --hard`
- `git checkout -- <archivo>`
- `git restore <archivo>`

Nunca revertir cambios que no fueron realizados por la tarea actual.

## Tests

- No modificar tests solo para hacerlos pasar.
- No usar `test.skip`, `it.skip`, `describe.skip`, `.only` ni equivalentes como solución.
- Si un test puede revelar un bug real, reportarlo antes de ampliar el alcance.
- Ejecutar únicamente tests relevantes durante cambios focalizados.
- Ejecutar suites mayores solo cuando el alcance lo justifique.

## ESLint

- No usar `eslint-disable` para ocultar problemas.
- No usar `--fix` global.
- Para cambios pequeños, preferir ESLint focalizado sobre archivos modificados.
- No corregir warnings no relacionados sin autorización.

## React Hooks

- Cumplir `react-hooks/exhaustive-deps` semánticamente.
- No añadir dependencias ciegamente solo para silenciar ESLint.
- No usar `useCallback`/`useMemo` únicamente porque un valor u objeto se recrea.
- Requerir razón semántica, dependencia de hook o beneficio de rendimiento demostrable.
- Antes de cambiar dependencias, analizar closures, valores capturados y riesgo de loops o stale closures.

## Dependencias

- No instalar paquetes sin necesidad real.
- Solicitar autorización antes de añadir una dependencia nueva.
- Preferir APIs y dependencias existentes del proyecto.

## Exploración y contexto

- Empezar por archivos directamente relacionados.
- No explorar todo el repositorio para tareas puntuales.
- No iniciar auditorías generales salvo solicitud explícita.
- Evitar subagentes cuando la tarea pueda resolverse directamente.
- No releer archivos grandes innecesariamente.
- Buscar antes símbolos o fragmentos delimitados.

## Validación proporcional

- Análisis o solo lectura: no ejecutar validación salvo necesidad real.
- Cambio pequeño: `npx tsc --noEmit` cuando corresponda + ESLint focalizado.
- Cambio de lógica: añadir tests relevantes.
- Cambios amplios: ampliar validación proporcionalmente.
- `npx tsc --noEmit` es validación general del proyecto, no focalizada.
- No declarar `VERIFIED`/`PASSED`/`CLEAN` sin ejecutar el comando correspondiente.
- Reportar `BLOCKED` si una validación no puede ejecutarse.
- Reportar `FAILED` y no corregir automáticamente si falla por causa fuera del alcance.

## Criterio de detención

Detenerse y reportar antes de ampliar el alcance si:

- aparece una dependencia inesperada;
- hay un diff ajeno;
- se requiere modificar un archivo no autorizado;
- una validación falla por causa aparentemente preexistente;
- la solución requiere un refactor mayor al solicitado.

## Entrega

Para cambios, usar un resumen breve:

- CAMBIOS
- VALIDACIÓN
- ARCHIVOS MODIFICADOS
- PROBLEMAS RESTANTES

Evitar reportes extensos innecesarios.
