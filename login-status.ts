export enum LOGIN_STATUS {
  /** 未登录 */
  UNLOGGED = 0,
  /** 登陆中 */
  LOGGING = 1,
  /** 已登录 */
  LOGGED = 2,
}

export type EventName = 'logging'|'success'|'fail'|'status-change'

type GroupName = string
type Handler = {group: GroupName, callback: Function, once: boolean}
type Events = Record<EventName, Array<Handler>>

class LoginStatus {
  protected static status = LOGIN_STATUS.UNLOGGED
  protected static eventsMap = new Map<LoginStatus, Events>()

  constructor() {
    LoginStatus.eventsMap.set(this, {} as Events)
  }

  /**
   * 销毁事件存储对象
   */
  public destroy() {
    LoginStatus.eventsMap.delete(this)
  }

  /**
   * 获取当前登录状态
   */
  public getStatus() {
    return LoginStatus.status
  }

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
      callback()
      return
    }
    const events = LoginStatus.eventsMap.get(this) as Events
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
      callback()
      return
    }
    const events = LoginStatus.eventsMap.get(this) as Events
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
    const events = LoginStatus.eventsMap.get(this) as Events
    if (!events[eventName]) {
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
    LoginStatus.eventsMap.forEach(events => {
      const listeners = events[eventName]
      events[eventName] = []
      for (let i = 0; i < listeners.length; i++) {
        try {
          listeners[i].callback(...args)
        } catch (error) {
          console.error(error)
        }
      }
    })
  }

  public logging() {
    LoginStatus.status = LOGIN_STATUS.LOGGING
    this.emit('status-change', LoginStatus.status)
    this.emit('logging')
  }

  public success() {
    LoginStatus.status = LOGIN_STATUS.LOGGED
    this.emit('status-change', LoginStatus.status)
    this.emit('success')
  }

  public fail() {
    LoginStatus.status = LOGIN_STATUS.UNLOGGED
    this.emit('status-change', LoginStatus.status)
    this.emit('fail')
  }
}

export default function useLoginStatus() {
  return new LoginStatus()
}
