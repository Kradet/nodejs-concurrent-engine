import { getLogger } from "~/conf/logger"
import { createActor } from "./actor"
import { createEventBus } from "./event-bus"

const createSupervisedActor = (
  id: string,
  handler: ActorHandler,
  bus: ReturnType<typeof createEventBus>,
  options?: { maxRestarts?: number; backoffMs?: number }
): Actor => {
  const log = getLogger(__filename).child({ function: "createSupervisedActor" })
  const maxRestarts = options?.maxRestarts ?? 5
  const baseBackoff = options?.backoffMs ?? 500

  let restartCount = 0
  let currentActor: any = null
  let isRestarting = false
  let pendingMessages: BaseEvent[] = []

  const start = () => {
    currentActor = createActor(
      id,
      async (msg, ctx) => {
        try {
          await handler(msg, ctx)
        } catch (e) {
          log.error(`Fallo en ${id}: ${msg.payload.id}`)
          handleCrash()
          throw e // Detiene el loop del actor interno
        }
      },
      bus
    )
    isRestarting = false

    // Al iniciar, volcamos los mensajes acumulados
    const queue = [...pendingMessages]
    pendingMessages = []
    queue.forEach((m) => currentActor.send(m))
  }

  const handleCrash = async () => {
    if (isRestarting) return
    isRestarting = true

    if (restartCount >= maxRestarts) {
      console.error("Máximo de reinicios alcanzado")
      return
    }

    // Recuperamos lo que el actor no procesó
    const leftovers = currentActor.stop()
    pendingMessages = [...leftovers, ...pendingMessages]

    const delay = baseBackoff * 2 ** restartCount
    restartCount++

    console.log(`Reiniciando ${id} en ${delay}ms... (Cola: ${pendingMessages.length})`)

    await new Promise((r) => setTimeout(r, delay))
    start()
  }

  start()

  return {
    id,
    send: (event: BaseEvent) => {
      if (isRestarting) {
        pendingMessages.push(event)
      } else {
        currentActor.send(event)
      }
    },
    stop: () => currentActor.stop()
  }
}

export { createSupervisedActor }
