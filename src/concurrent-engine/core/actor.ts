import { createEventBus } from "./event-bus"

const createActor = (
  id: string,
  handler: ActorHandler,
  bus: ReturnType<typeof createEventBus>
): Actor & { getMailbox: () => BaseEvent[] } => {
  let mailbox: BaseEvent[] = []
  let processing = false
  let active = true

  const process = async (): Promise<BaseEvent | null> => {
    if (processing || !active) return null
    processing = true

    while (active && mailbox.length > 0) {
      const event = mailbox.shift()!
      try {
        await handler(event, { emit: bus.emit, self: actor })
      } catch (err) {
        processing = false
        return event
      }
    }
    processing = false
    return null
  }

  const actor: Actor = {
    id,
    send: (msg: BaseEvent) => {
      if (!active) return
      mailbox.push(msg)
      process().catch(() => {})
    },
    stop: () => {
      active = false
      const remaining = [...mailbox]
      mailbox = []
      return remaining
    }
  }

  return {
    ...actor,
    getMailbox: () => mailbox
  } as any
}

export { createActor }
