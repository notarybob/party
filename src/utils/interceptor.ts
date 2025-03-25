import { isPromise } from './index'

export type Interceptor = (
  ...args: any[]
) => Promise<boolean> | boolean | undefined | void

export let funcInterceptor = (
  interceptor: Interceptor | undefined,
  {
    args = [],
    done,
    canceled,
  }: {
    args?: unknown[]
    done: (val?: any) => void
    canceled?: () => void
  }
) => {
  if (interceptor) {
    // eslint-disable-next-line prefer-spread
    let returnVal = interceptor.apply(null, args)

    if (isPromise(returnVal)) {
      returnVal
        .then((value) => {
          if (value) {
            done(value)
          } else if (canceled) {
            canceled()
          }
        })
        .catch(() => {})
    } else if (returnVal) {
      done()
    } else if (canceled) {
      canceled()
    }
  } else {
    done()
  }
}
