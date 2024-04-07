export enum LOGIN_STATUS {
  /** 未登录 */
  UNLOGGED = 0,
  /** 登陆中 */
  LOGGING = 1,
  /** 已登录 */
  LOGGED = 2,
}

export type EventName = 'logging'|'success'|'fail'|'status-change'

// type StatusCallback = (res?: unknown) => void
// type StatusChangeCallback = (status: LOGIN_STATUS) => void

// type Callback<T extends Function> = {scope: string, callback: T}
type GroupName = string
// type EventName = string
type Handler = {group: GroupName, callback: Function, once: boolean}
type Events = Record<EventName, Array<Handler>>

class LoginStatus {
  protected static status = LOGIN_STATUS.UNLOGGED
  protected static eventsMap = new WeakMap<LoginStatus, Events>()
  protected static last = {
    type: null,
    result: undefined
  } as {type: null|'success'|'fail', result: unknown}

  /**
   * 添加事件监听
   * 
   * @param eventName - 事件名
   * @param callback - 事件回调
   * @param group - 事件分组，方便取消事件
   */
  public on(eventName: EventName, callback: Function, group?: string): void {
    if (eventName === 'logging' && LoginStatus.status === LOGIN_STATUS.LOGGING) {
      callback()
      return
    }
    if (eventName === 'success' && LoginStatus.status === LOGIN_STATUS.LOGGED) {
      const res = LoginStatus.last.type === 'success' ? LoginStatus.last.result : null
      callback(res)
      return
    }
    let events = LoginStatus.eventsMap.get(this)
    if (!events) {
      events = {} as Events
      LoginStatus.eventsMap.set(this, events)
    }
    if (!events[eventName]) {
      events[eventName] = []
    }
    events[eventName].push({group: group || 'default', callback, once: false})
  }

  /**
   * 添加一次性事件监听
   * 
   * @param eventName - 事件名
   * @param callback - 事件回调
   * @param group - 事件分组，方便取消事件
   */
  public once(eventName: EventName, callback: Function, group?: string): void {
    if (eventName === 'logging' && LoginStatus.status === LOGIN_STATUS.LOGGING) {
      callback()
      return
    }
    if (eventName === 'success' && LoginStatus.status === LOGIN_STATUS.LOGGED) {
      const res = LoginStatus.last.type === 'success' ? LoginStatus.last.result : null
      callback(res)
      return
    }
    let events = LoginStatus.eventsMap.get(this)
    if (!events) {
      events = {} as Events
      LoginStatus.eventsMap.set(this, events)
    }
    if (!events[eventName]) {
      events[eventName] = []
    }
    events[eventName].push({group: group || 'default', callback, once: true})
  }

  /**
   * 解除事件监听
   * 
   * @param eventName - 事件名
   * @param target - 解除目标，可以是分组名或事件回调
   */
  public off(eventName: EventName, target?: string|Function): void {
    const events = LoginStatus.eventsMap.get(this)
    if (!events || !events[eventName]) {
      return
    }
    const listeners = events[eventName]
    if (target === undefined) {
      events[eventName] = []
    } else if (typeof target === 'string') {
      events[eventName] = listeners.filter(x => x.group !== target)
    } else {
      events[eventName] = listeners.filter(x => x.callback !== target)
    }
  }

  /**
   * 触发事件
   * 
   * @param eventName - 事件名
   * @param args - 参数
   */
  protected emit(eventName: EventName, ...args: unknown[]): void {
    const events = LoginStatus.eventsMap.get(this)
    if (!events || !events[eventName]) {
      return
    }
    const listeners = events[eventName]
    events[eventName] = []
    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i].callback(...args)
      } catch (error) {
        console.error(error)
      }
    }
  }

  public logging() {
    LoginStatus.status = LOGIN_STATUS.LOGGING
    this.emit('status-change')

    LoginStatus.last = {type: null, result: undefined}
    this.emit('logging')
  }

  public success(res: unknown) {
    LoginStatus.status = LOGIN_STATUS.LOGGED
    this.emit('status-change')

    LoginStatus.last = {type: 'success', result: res}
    this.emit('success', res)
  }

  public fail(err: unknown) {
    LoginStatus.status = LOGIN_STATUS.UNLOGGED
    this.emit('status-change')
    
    LoginStatus.last = {type: 'fail', result: err}
    this.emit('fail', err)
  }
}

export function useLoginStatus() {
  return new LoginStatus()
}
