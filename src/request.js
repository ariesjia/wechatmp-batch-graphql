import Deferred from './utils/deferred'

export const request = method => (url, option) => {
  const {
    data,
    headers
  } = Object.assign({
    data: {},
    headers: {}
  }, option)
  const defer = new Deferred()
  const requestTask = wx.request({
    method,
    url,
    data,
    header: {
      'accept': 'application/json',
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
    success(res) {
      if (res.statusCode >= 400) {
        defer.reject(res)
      } else {
        defer.resolve(res)
      }
    },
    fail(err) {
      defer.reject(err)
    },
  })
  return Object.assign(defer.promise, {
    abort: requestTask.abort
  })
}