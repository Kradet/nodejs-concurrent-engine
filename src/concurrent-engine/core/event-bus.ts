const createEventBus = () => {
  const subscriptions = new Map<string, Actor[]>()

  const register = (actor: Actor, eventTypes: string[]) => {
    for (const event of eventTypes) {
      if (!subscriptions.has(event)) {
        subscriptions.set(event, [])
      }
      subscriptions.get(event)!.push(actor)
    }
  }

  const unregister = (actor: Actor) => {
    for (const [, actors] of subscriptions) {
      const index = actors.indexOf(actor)
      if (index !== -1) actors.splice(index, 1)
    }
  }

  const emit = (event: BaseEvent) => {
    const actors = subscriptions.get(event.type) ?? []
    for (const actor of actors) {
      if (event.sender == actor.id) continue

      actor.send(event)
    }
  }

  return { register, unregister, emit }
}

export { createEventBus }
