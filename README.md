# Concurrent Engine

Motor de Concurrencia Basado en el Patrón Actor

---

## Descripción General

Este proyecto implementa un **motor de concurrencia** utilizando el **Patrón Actor Model** con un
**Event Bus** para la comunicación asíncrona entre componentes. Permite crear actores independientes
que procesan eventos de manera secuencial, con soporte para supervisión automática y reinicio en
caso de fallos.

### Problema que resuelve

- Gestión de procesos concurrentes de forma controlada y predecible
- Comunicación asíncrona entre componentes sin acoplamiento directo
- Tolerancia a fallos mediante supervisión y reinicio automático de actores
- Procesamiento secuencial de mensajes en buzones (mailboxes) individuales

### Casos de uso principales

- Sistemas de procesamiento de eventos en tiempo real
- Pipelines de datos con múltiples etapas de procesamiento
- Microservicios con comunicación basada en eventos
- Aplicaciones que requieren resiliencia ante fallos

---

## Arquitectura y Funcionamiento

### Componentes Principales

El proyecto se basa en tres conceptos fundamentales:

#### 1. Event Bus (`createEventBus`)

- Mecanismo central de pub/sub para comunicación entre actores
- Permite el registro de actores para recibir tipos específicos de eventos
- Los eventos fluyen asíncronamente entre los actores registrados
- Ubicación: `src/concurrent-engine/core/event-bus.ts`

#### 2. Actor (`createActor`)

- Unidad de procesamiento independiente con su propio buzón de mensajes
- Procesa eventos secuencialmente de su mailbox
- Puede ser detenido, conservando los mensajes no procesados
- Ubicación: `src/concurrent-engine/core/actor.ts`

#### 3. Supervised Actor (`createSupervisedActor`)

- Actor con capacidades de reinicio automático
- Configurable con máximo de reinicios y estrategia de backoff exponencial
- Cola de mensajes durante el reinicio para no perder eventos
- Ubicación: `src/concurrent-engine/core/supervisor.ts`

### Estructura de Eventos

Todos los eventos siguen una interfaz común:

```typescript
interface BaseEvent<T extends string = string, P = any> {
  readonly type: T // Identificador del tipo de evento (ej: "scrap.result")
  readonly payload: P // Datos del evento
  readonly sender: string // ID del actor que envía el evento
}
```

### Flujo General del Sistema

1. Se crea un **Event Bus** que gestiona las suscripciones
2. Se crean **Actores** que se registran en el bus para recibir tipos específicos de eventos
3. Los eventos se **emiten** al bus y este los distribuye a los actores correspondientes
4. Cada actor procesa los eventos de su **mailbox** de forma secuencial
5. Si un actor falla, el **supervisor** puede reiniciarlo automáticamente

---

## Requisitos

### Lenguaje y Versiones

- **TypeScript**: 5.9.3
- **Node.js**: Versión compatible con ES2022
- **Módulo**: CommonJS (no ES modules)

### Dependencias Principales

| Paquete                   | Versión | Propósito                                              |
| ------------------------- | ------- | ------------------------------------------------------ |
| express                   | 5.2.1   | Framework web (disponible pero no usado en el ejemplo) |
| winston                   | 3.19.0  | Sistema de logging                                     |
| winston-daily-rotate-file | 5.0.0   | Rotación de archivos de log                            |
| dotenv                    | 17.2.4  | Carga de variables de entorno                          |

### Dependencias de Desarrollo

- typescript: 5.9.3
- ts-node-dev: 2.0.0
- tsc-alias: 1.8.16
- tsconfig-paths: 4.2.0

---

## Instalación

```bash
# Clonar el repositorio
git clone <repositorio>
cd concurrent-engine

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

---

## Configuración

### Variables de Entorno

- `NODE_ENV`: Entorno de ejecución (development/production)
  - **development**: Logs en consola con formato legible, nivel debug
  - **production**: Logs en archivos rotativos, nivel info

### Logging

El sistema usa Winston con rotación diaria de archivos:

- Logs de errores: `logs/app-errors-YYYY-MM-DD.log`
- Logs generales: `logs/app-YYYY-MM-DD.log`
- Configuración en: `src/conf/logger.ts`

---

## Guía de Uso

### Ejecutar en Desarrollo

```bash
# Unix/Mac
npm run dev

# Windows
npm run dev-w
```

### Ejecutar en Producción

```bash
# Compilar primero
npm run build

# Unix/Mac
npm start

# Windows
npm run start-w
```

### Ejemplo de Uso

```typescript
import { createActor } from "~/concurrent-engine/core/actor"
import { createEventBus } from "~/concurrent-engine/core/event-bus"
import { createSupervisedActor } from "~/concurrent-engine/core/supervisor"

// 1. Crear el Event Bus
const bus = createEventBus()

// 2. Definir tipos de eventos
const SCRAP_RESULT_TYPE = "scrap.result" as const

// 3. Crear un actor supervisado (con reinicio automático)
const processor = createSupervisedActor(
  "Procesador",
  async (event, ctx) => {
    if (event.type === SCRAP_RESULT_TYPE) {
      // Procesar el evento
      const result = { data: "procesado" }

      // Emitir nuevo evento
      ctx.emit({
        payload: result,
        sender: ctx.self.id,
        type: "process.complete"
      })
    }
  },
  bus,
  { maxRestarts: 5, backoffMs: 3000 }
)

// 4. Registrar actor para recibir eventos
bus.register(processor, [SCRAP_RESULT_TYPE])

// 5. Emitir evento
bus.emit({
  payload: { mensaje: "Hola" },
  sender: "sistema",
  type: SCRAP_RESULT_TYPE
})
```

---

## Estructura del Proyecto

```bash
concurrent-engine/
├── src/
│   ├── index.ts                    # Punto de entrada y ejemplo de uso
│   ├── concurrent-engine/
│   │   └── core/
│   │       ├── types.ts            # Definiciones de tipos base (Event, Actor, Context)
│   │       ├── event-bus.ts       # Implementación del bus de eventos
│   │       ├── actor.ts           # Implementación del actor básico
│   │       └── supervisor.ts      # Actor con supervisión y reinicio
│   └── conf/
│       ├── types.ts               # Tipos de configuración
│       └── logger.ts              # Configuración de Winston
├── package.json                   # Dependencias y scripts
├── tsconfig.json                  # Configuración de TypeScript
└── init.md                        # Notas de inicialización
```

---

## Guía para Desarrolladores

### Cómo agregar un nuevo actor

1. Importa las funciones necesarias:

   ```typescript
   import { createActor } from "~/concurrent-engine/core/actor"
   import { createEventBus } from "~/concurrent-engine/core/event-bus"
   ```

2. Define los tipos de eventos que usará tu actor:

   ```typescript
   const MI_EVENTO_TYPE = "mi.evento" as const
   type MiEvento = CreateEvent<typeof MI_EVENTO_TYPE, MiPayload>
   ```

3. Crea el actor:

   ```typescript
   const miActor = createActor(
     "MiActor",
     async (event, ctx) => {
       if (event.type === MI_EVENTO_TYPE) {
         // Procesar evento
       }
     },
     bus
   )
   ```

4. Regístralo en el bus:

   ```typescript
   bus.register(miActor, [MI_EVENTO_TYPE])
   ```

### Patrones de diseño utilizados

- **Actor Model**: Aislamiento de estado y procesamiento
- **Pub/Sub**: Desacoplamiento mediante Event Bus
- **Supervisor**: Manejo de fallos con reinicio exponencial
- **Mailbox**: Cola de mensajes para procesamiento secuencial

### Decisiones técnicas importantes

- **CommonJS**: El proyecto usa módulos CommonJS por compatibilidad
- **Strict Mode**: TypeScript está configurado en modo estricto
- **Backoff exponencial**: Los reinicios usan backoff exponencial (`baseBackoff * 2^restartCount`)
- **Sin tests**: No hay framework de tests configurado actualmente

---

## Limitaciones Conocidas

1. **Sin pruebas automatizadas**: No hay test framework configurado
2. **Sin linter**: ESLint/Prettier no están configurados

---

_Este archivo README.md fue generado automáticamente por una herramienta de inteligencia artificial
a partir del análisis del código fuente del proyecto._
