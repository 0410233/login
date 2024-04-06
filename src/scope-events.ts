// 

type GroupName = string
type EventName = string
type EventListener = {group: GroupName, callback: Function}
type ScopeEvents = Record<EventName, Array<EventListener>>

class Events {
  static eventsMap = new WeakMap<Events, ScopeEvents>()

  /** 添加事件监听 */
  public on(eventName: EventName, callback: Function, group?: string): void {
    let events = Events.eventsMap.get(this)
    if (!events) {
      events = {} as ScopeEvents
    }
    if (!events[eventName]) {
      events[eventName] = []
    }
    events[eventName].push({group: group || 'default', callback})
  }

  /** 解除事件监听 */
  public off<T extends Function>(eventName: EventName, target?: string|T): void {
    const events = Events.eventsMap.get(this)
    if (!events || !events[eventName]) {
      return
    }
    const listeners = events[eventName]
    if (target === undefined) {
      // 
    } else if (target === '*') {
      events[eventName] = []
    } else if (typeof target === 'string') {
      events[eventName] = listeners.filter(x => x.group !== target)
    } else {
      events[eventName] = listeners.filter(x => x.callback !== target)
    }
  }

  /** 触发事件 */
  public emit(eventName: EventName, ...args: unknown[]): void {
    const events = Events.eventsMap.get(this)
    if (!events || !events[eventName]) {
      return
    }
    const listeners = events[eventName]
    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i].callback(...args)
      } catch (error) {
        console.error(error)
      }
    }
  }
}

export function useScopeEvents() {
  return new Events()
}
