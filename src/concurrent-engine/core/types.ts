interface BaseEvent<T extends string = string, P = any> {
  readonly type: T
  readonly payload: P
  readonly sender: string
}

type CreateEvent<T extends string, P> = BaseEvent<T, P>

type Actor = {
  id: string
  send: (event: BaseEvent) => void
  stop: () => void
}

type ActorContext = {
  emit: (event: BaseEvent) => void
  self: Actor
}

type ActorHandler = (event: BaseEvent, ctx: ActorContext) => Promise<void> | void
