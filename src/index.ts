import { createActor } from "./concurrent-engine/core/actor"
import { createEventBus } from "./concurrent-engine/core/event-bus"
import { createSupervisedActor } from "./concurrent-engine/core/supervisor"

const bus = createEventBus()

export interface ActionState {
  actualPrice: number
}

export const SCRAP_RESULT_TYPE = "scrap.result" as const
export type ScrapResultEvent = CreateEvent<typeof SCRAP_RESULT_TYPE, ActionState>

export interface ProcessResult {
  result: string
}

export const PROCESS_OK = "process.ok" as const
export type ProcessResultEvent = CreateEvent<typeof PROCESS_OK, ProcessResult>

// Fake I/O async
const fakeIO = () => new Promise<void>((resolve) => setTimeout(resolve, 1000))

// Actor que falla intencionalmente
const unstableActor = createSupervisedActor(
  crypto.randomUUID(),
  async (event, ctx) => {
    if (event.type === SCRAP_RESULT_TYPE) {
      console.log("Procesando", event.payload)
      await fakeIO()

      if (Math.random() < 0.2) {
        throw new Error("Random failure")
      }

      const e: ProcessResultEvent = {
        payload: { result: "" },
        sender: ctx.self.id,
        type: PROCESS_OK
      }

      ctx.emit(e)
    }
  },
  bus,
  { maxRestarts: 5, backoffMs: 3000 }
)

bus.register(unstableActor, [SCRAP_RESULT_TYPE])

// Actor B
const workerB = createActor(
  crypto.randomUUID(),
  async (event) => {
    if (event.type === PROCESS_OK) {
      console.log("WorkerB recibió resultado:", event)
    }
  },
  bus
)

bus.register(workerB, [PROCESS_OK])

bus.emit({
  payload: { actualPrice: 25 },
  sender: crypto.randomUUID(),
  type: SCRAP_RESULT_TYPE
} as ScrapResultEvent)
