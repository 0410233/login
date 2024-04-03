export enum LOGIN_STATUS {
  /** 未登录 */
  PENDING = 0,
  /** 登陆中 */
  LOGGING = 1,
  /** 登录成功 */
  SUCCESS = 2,
}

type Callback = (res?: unknown) => void

export class LoginStatus {
  protected static status = LOGIN_STATUS.PENDING
  protected static failCallbacks = [] as Callback[]
  protected static successCallbacks = [] as Callback[]
  protected static loggingCallbacks = [] as Callback[]
  protected static results = [] as Array<{type: 'success'|'error', result: unknown}>

  static getStatus() {
    return LoginStatus.status
  }

  static getResults() {
    return LoginStatus.results.slice()
  }
  
  static clearResults() {
    LoginStatus.results = []
  }

  static onLogging(cb: Callback) {
    if (LoginStatus.status === LOGIN_STATUS.LOGGING) {
      cb()
    } else {
      LoginStatus.loggingCallbacks.push(cb)
    }
  }

  static onSuccess(cb: Callback) {
    if (LoginStatus.status === LOGIN_STATUS.SUCCESS) {
      const last = LoginStatus.results[LoginStatus.results.length - 1]
      const res = last && last.type === 'success' ? last.result : undefined
      cb(res)
    } else {
      LoginStatus.successCallbacks.push(cb)
    }
  }

  static onFail(cb: Callback) {
    LoginStatus.failCallbacks.push(cb)
  }

  static logging() {
    LoginStatus.status = LOGIN_STATUS.LOGGING
    if (LoginStatus.loggingCallbacks.length) {
      const cbs = LoginStatus.loggingCallbacks.slice()
      LoginStatus.loggingCallbacks = []
      for (let i = 0; i < cbs.length; i++) {
        try {
          cbs[i]()
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  static success(res: unknown) {
    LoginStatus.status = LOGIN_STATUS.SUCCESS
    LoginStatus.results.push({type: 'success', result: res})
    if (LoginStatus.successCallbacks.length) {
      const cbs = LoginStatus.successCallbacks.slice()
      LoginStatus.successCallbacks = []
      for (let i = 0; i < cbs.length; i++) {
        try {
          cbs[i](res)
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  static fail(err: unknown) {
    LoginStatus.status = LOGIN_STATUS.PENDING
    LoginStatus.results.push({type: 'error', result: err})
    if (LoginStatus.failCallbacks.length) {
      const cbs = LoginStatus.failCallbacks.slice()
      LoginStatus.failCallbacks = []
      for (let i = 0; i < cbs.length; i++) {
        try {
          cbs[i](err)
        } catch (error) {
          console.error(error)
        }
      }
    }
  }
}
