// 

type GroupName = string
type EventName = string
type Handler = {group: GroupName, callback: Function, once: boolean}
type EventMap = Record<EventName, Array<Handler>>

type EventBusNamespace = string|symbol

export interface EventBus {
  /**
   * 添加事件监听
   * 
   * @param eventName - 事件名
   * @param callback - 事件回调
   * @param group - 事件分组
   */
  on(eventName: EventName, callback: Function, group?: string): void
  /**
   * 添加一次性事件监听
   * 
   * @param eventName - 事件名
   * @param callback - 事件回调
   * @param group - 事件分组
   */
  once(eventName: EventName, callback: Function, group?: string): void
  /**
   * 解除事件监听
   * 
   * @param eventName - 事件名
   * @param target - 解除目标，可以是分组名或事件回调
   */
  off(eventName: EventName, target?: string|Function): void
  /**
   * 触发事件
   * 
   * @param eventName - 事件名
   * @param args - 参数
   */
  emit(eventName: EventName, ...args: unknown[]): void
}

class ClsEventBus implements EventBus {
  static eventsMap = {} as Record<EventBusNamespace, WeakMap<EventBus, EventMap>>

  protected namespace: EventBusNamespace

  constructor(namespace: EventBusNamespace) {
    this.namespace = namespace
    if (!ClsEventBus.eventsMap[namespace]) {
      ClsEventBus.eventsMap[namespace] = new WeakMap()
    }
  }

  /** 添加事件监听 */
  public on(eventName: EventName, callback: Function, group: string = 'default'): void {
    let events = ClsEventBus.eventsMap[this.namespace].get(this)
    if (!events) {
      events = {} as EventMap
      ClsEventBus.eventsMap[this.namespace].set(this, events)
    }
    if (!events[eventName]) {
      events[eventName] = []
    }
    events[eventName].push({group, callback, once: false})
  }

  /** 添加一次性事件监听 */
  public once(eventName: EventName, callback: Function, group: string = 'default'): void {
    let events = ClsEventBus.eventsMap[this.namespace].get(this)
    if (!events) {
      events = {} as EventMap
      ClsEventBus.eventsMap[this.namespace].set(this, events)
    }
    if (!events[eventName]) {
      events[eventName] = []
    }
    events[eventName].push({group, callback, once: true})
  }

  /** 解除事件监听 */
  public off(eventName: EventName, target?: string|Function): void {
    const events = ClsEventBus.eventsMap[this.namespace].get(this)
    if (!events || !events[eventName]) {
      return
    }
    const handlers = events[eventName]
    if (target === undefined) {
      events[eventName] = []
    } else if (typeof target === 'string') {
      events[eventName] = handlers.filter(x => x.group !== target)
    } else {
      events[eventName] = handlers.filter(x => x.callback !== target)
    }
  }

  /** 触发事件 */
  public emit(eventName: EventName, ...args: unknown[]): void {
    const events = ClsEventBus.eventsMap[this.namespace].get(this)
    if (!events || !events[eventName]) {
      return
    }
    const handlers = events[eventName].slice()
    events[eventName] = handlers.filter(x => !x.once)
    for (let i = 0; i < handlers.length; i++) {
      try {
        handlers[i].callback(...args)
      } catch (error) {
        console.error(error)
      }
    }
  }
}

export function defineEventBus(namespace: EventBusNamespace) {
  return function useEventBus() {
    return new ClsEventBus(namespace)
  }
}
