# ARQUITECTURA DE SOFTWARE - EDU-APP

**Proyecto:** `edu-app` (Aplicación Educativa Móvil de Salud Adolescente y Prevención de ENT)  
**Plataformas:** Android, iOS, Web  
**Framework:** Expo SDK 57 (React Native 0.86.3 · React 19.2.3 · TypeScript)  
**Patrón Arquitectónico:** Modular por Capas, Offline-First, Enrutamiento Declarativo Basado en Archivos (Expo Router).

---

## 1. DIAGRAMA DE ARQUITECTURA GENERAL

```text
                                 ┌──────────────────────────────┐
                                 │     CAPA DE PRESENTACIÓN     │
                                 │  Expo Router 57 (src/app/)   │
                                 └──────────────┬───────────────┘
                                                │
                                 ┌──────────────▼──────────────┐
                                 │    COMPONENTES & CONTEXTO   │
                                 │  src/components / src/context│
                                 └──────────────┬───────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
  ┌──────────────▼──────────────┐                               ┌──────────────▼──────────────┐
  │      SERVICIOS DE IA        │                               │   PERSISTENCIA Y DATOS      │
  │  (RAG + Gemini 1.5 Flash)   │                               │       (Offline-First)       │
  │     src/services/ai/        │                               │          src/db/            │
  └──────────────┬──────────────┘                               └──────────────┬──────────────┘
                 │                                                             │
                 ▼                                              ┌──────────────▼──────────────┐
  ┌─────────────────────────────┐                               │       SQLite (Local)        │
  │ MINSA Knowledge Base (JSON) │                               │    saludadolescente.db      │
  │      + Google AI Studio     │                               │      (Foreign Keys ON)      │
  └─────────────────────────────┘                               └──────────────┬──────────────┘
                                                                               │
                                                                        Cola de Sincronización
                                                                               │
                                                                ┌──────────────▼──────────────┐
                                                                │      Firebase Firestore     │
                                                                │      (Cloud Backup/Sync)    │
                                                                └─────────────────────────────┘
```

---

## 2. ESTRUCTURA DE DIRECTORIOS

```text
edu-app/
├── assets/                    # Iconos nativos, splash screen y gráficos
├── src/
│   ├── app/                   # Capa de Presentación y Enrutamiento (Expo Router)
│   │   ├── (auth)/            # Grupo de autenticación (login, registro)
│   │   ├── (tabs)/            # Navegación principal en pestañas (inicio, descubrir, asistente, perfil, admin)
│   │   ├── enfermedad/        # Pantallas dinámicas de detalle por enfermedad ([id].tsx)
│   │   ├── evaluacion.tsx     # Calculadora de IMC y Tamizaje de Riesgo ENT
│   │   └── retos.tsx          # Módulo de gamificación y trivias interactivas
│   ├── components/            # Componentes de UI reutilizables (Tarjetas, Quizzes, Gráficos)
│   ├── config/                # Configuraciones externas (Firebase, SDKs)
│   ├── constants/             # Constantes clínicas (MINSA, catálogo de enfermedades, temas)
│   ├── context/               # Estado global (AuthContext, sesión, control de puntos)
│   ├── db/                    # Base de datos SQLite, KDF criptográfico y migraciones
│   ├── hooks/                 # Custom React Hooks
│   ├── services/              # Lógica de negocio externa (Gemini IA, RAG Engine, SyncService, PDF)
│   └── types/                 # Tipos centralizados de TypeScript
├── scripts/                   # Scripts de soporte para extracción y compilación
├── firestore.rules            # Reglas de seguridad para Firestore
├── app.json                   # Configuración del proyecto Expo (SDK 57)
└── package.json               # Dependencias fijadas y compatibles
```

---

## 3. ESTRATEGIA OFFLINE-FIRST

La aplicación está diseñada bajo el principio de disponibilidad sin conexión continua:

1. **Lectura y Escritura Local Inmediata:**
   - Todas las mutaciones (registro de progreso, incremento de puntos, actualización de perfiles) se escriben de manera inmediata en SQLite (`saludadolescente.db`).
   - El estudiante no experimenta retrasos de red ni bloqueos en zonas sin cobertura escolar o rural.
2. **Cola de Sincronización Asíncrona (`cola_sincronizacion`):**
   - Cada operación genera un evento en la tabla `cola_sincronizacion` con estado `'pendiente'`.
3. **Replicación y Resolución de Conflictos (`syncService.ts`):**
   - Cuando la app detecta conectividad o al iniciar sesión, el servicio procesa los eventos pendientes en orden cronológico hacia Firebase Firestore.
   - Resolución de conflictos basada en marcas de tiempo (`updatedAt` / `serverTimestamp`).

---

## 4. MOTOR RAG HÍBRIDO Y GEMINI IA

El asistente inteligente **EduSalud IA** utiliza una arquitectura Retrieval-Augmented Generation (RAG) combinada:

```text
Pregunta del Adolescente
          ↓
Tokenización y Normalización (sin acentos, stop words médicas)
          ↓
Búsqueda Léxica + Ponderación de Códigos Clínicos (HIS, CIE-10, UPS)
          ↓
Recuperación de Evidencia Oficial MINSA (Norma Técnica 2020 / Manual ENT 2025)
          ↓
Inyección de Contexto en Prompt de Sistema
          ↓
Gemini 1.5 Flash (Timeout 15s · Reintentos · Salida sin diagnósticos no autorizados)
          ↓
Respuesta Educativa Breve y Empática + Síntesis de Voz (expo-speech)
```

---

## 5. SUBISTEMA MULTIMEDIA Y SÍNTESIS DE VOZ

* **Síntesis de Voz (`expo-speech`):**
  - Configurado en español (`es-ES`).
  - Limpieza forzosa en ciclo de vida: Al desmontar la pantalla o cambiar de pestaña se invoca `Speech.stop()` para erradicar cualquier fuga de audio en segundo plano.
* **Grabación de Audio (`expo-av`):**
  - Grabación con permisos reactivos.
  - Almacenamiento temporal en caché con codificación Base64 para transcripción multimodal con Gemini.
  - Los recursos nativos de grabación se liberan en `stopAndUnloadAsync()` mediante referencias mutables (`recordingRef`).
