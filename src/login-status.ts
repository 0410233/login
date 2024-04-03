export enum LOGIN_STATUS {
  /** 未登录 */
  PENDING = 0,
  /** 登陆中 */
  LOGGING = 1,
  /** 登录成功 */
  SUCCESS = 2,
}

type StatusCallback = (res?: unknown) => void
type StatusChangeCallback = (status: LOGIN_STATUS) => void

type Callback<T extends Function> = {scope: string, callback: T}

export class LoginStatus {
  protected static status = LOGIN_STATUS.PENDING
  protected static failCallbacks = [] as Array<Callback<StatusCallback>>
  protected static successCallbacks = [] as Array<Callback<StatusCallback>>
  protected static loggingCallbacks = [] as Array<Callback<StatusCallback>>
  protected static statusChangeCallbacks = [] as Array<Callback<StatusChangeCallback>>
  protected static results = [] as Array<{type: 'response'|'error', result: unknown}>

  static getStatus() {
    return LoginStatus.status
  }

  static onStatusChange(callback: StatusChangeCallback, scope: string = 'default') {
    LoginStatus.statusChangeCallbacks.push({scope, callback})
  }

  protected static emitStatusChange() {
    const cbs = LoginStatus.statusChangeCallbacks.slice()
    const status = LoginStatus.status
    for (let i = 0; i < cbs.length; i++) {
      try {
        cbs[i].callback(status)
      } catch (error) {
        console.error(error)
      }
    }
  }

  static getResults() {
    return LoginStatus.results.slice()
  }
  
  static clearResults() {
    LoginStatus.results = []
  }

  static onLogging(callback: StatusCallback, scope: string = 'default') {
    if (LoginStatus.status === LOGIN_STATUS.LOGGING) {
      callback()
    } else {
      LoginStatus.loggingCallbacks.push({scope, callback})
    }
  }

  static onSuccess(callback: StatusCallback, scope: string = 'default') {
    if (LoginStatus.status === LOGIN_STATUS.SUCCESS) {
      const last = LoginStatus.results[LoginStatus.results.length - 1]
      const res = last && last.type === 'response' ? last.result : undefined
      callback(res)
    } else {
      LoginStatus.successCallbacks.push({scope, callback})
    }
  }

  static onFail(callback: StatusCallback, scope: string = 'default') {
    LoginStatus.failCallbacks.push({scope, callback})
  }

  protected static off<T extends Function>(callbacks: Array<Callback<T>>, target?: string|T): Array<Callback<T>> {
    if (target === undefined) {
      return callbacks
    } else if (target === '*') {
      return []
    } else if (typeof target === 'string') {
      return callbacks.filter(x => x.scope !== target)
    } else {
      return callbacks.filter(x => x.callback !== target)
    }
  }

  static offLogging(target?: string|StatusCallback) {
    LoginStatus.loggingCallbacks = LoginStatus.off(LoginStatus.loggingCallbacks, target)
  }

  static offSuccess(target?: string|StatusCallback) {
    LoginStatus.successCallbacks = LoginStatus.off(LoginStatus.successCallbacks, target)
  }

  static offFail(target?: string|StatusCallback) {
    LoginStatus.failCallbacks = LoginStatus.off(LoginStatus.failCallbacks, target)
  }

  static offStatusChange(target?: string|StatusChangeCallback) {
    LoginStatus.statusChangeCallbacks = LoginStatus.off(LoginStatus.statusChangeCallbacks, target)
  }

  static logging() {
    LoginStatus.status = LOGIN_STATUS.LOGGING
    LoginStatus.emitStatusChange()
    if (LoginStatus.loggingCallbacks.length) {
      const cbs = LoginStatus.loggingCallbacks.slice()
      LoginStatus.loggingCallbacks = []
      for (let i = 0; i < cbs.length; i++) {
        try {
          cbs[i].callback()
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  static success(res: unknown) {
    LoginStatus.status = LOGIN_STATUS.SUCCESS
    LoginStatus.emitStatusChange()
    LoginStatus.results.push({type: 'response', result: res})
    if (LoginStatus.successCallbacks.length) {
      const cbs = LoginStatus.successCallbacks.slice()
      LoginStatus.successCallbacks = []
      for (let i = 0; i < cbs.length; i++) {
        try {
          cbs[i].callback(res)
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  static fail(err: unknown) {
    LoginStatus.status = LOGIN_STATUS.PENDING
    LoginStatus.emitStatusChange()
    LoginStatus.results.push({type: 'error', result: err})
    if (LoginStatus.failCallbacks.length) {
      const cbs = LoginStatus.failCallbacks.slice()
      LoginStatus.failCallbacks = []
      for (let i = 0; i < cbs.length; i++) {
        try {
          cbs[i].callback(err)
        } catch (error) {
          console.error(error)
        }
      }
    }
  }
}
