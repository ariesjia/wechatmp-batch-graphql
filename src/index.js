import Deferred from './utils/deferred'
import { isEmpty } from './utils/isEmpty'
import { isFunction } from './utils/is'
import { request } from './request'

export {default as gql} from './utils/nanographql'

export const graph = (url, gql, option = {}) => {
  return request('POST')(
    url,
    {
      data: gql,
      headers: option.headers
    }
  )
}

const buildHeaders = (headers) => {
  if(isFunction(headers)) {
    return headers()
  }
  return headers || {}
}


export class BatchGraphql {
  constructor({
    uri = '/graphql',
    batchInterval = 10,
    option = {}
  }) {
    this._queuedRequests = []
    this.uri = uri
    this.batchInterval = batchInterval
    this.baseOption = option
  }

  request(gql, option) {
    const defer = new Deferred()
    this._queuedRequests.push({
      config: {
        gql,
        option
      },
      defer
    })
    if (this._queuedRequests.length === 1) {
      this._timer()
    }
    return defer.promise
  }

  graph(gql, option = {}) {
    return graph(option.uri || this.uri, gql, {
      ...option,
      headers: Object.assign(
        {},
        buildHeaders(this.baseOption.headers),
        buildHeaders(option.headers),
      )
    }).then((res) => {
      if (!isEmpty(res.data.errors)) {
        return Promise.reject(res)
      }
      return res
    })
  }

  _timer() {
    setTimeout(() => {
      const requests = this._queuedRequests.slice(0)
      graph(
        this.uri,
        requests.map(item => item.config.gql)
      ).then((response) => {
        const resultLength = response.data.length
        const expectLength = requests.length
        if (expectLength !== resultLength) {
          const errorMessage = (`server returned results with length ${resultLength}, expected length of ${expectLength}`)
          console.error(errorMessage)
          const error = new Error(errorMessage)
          return requests.forEach(request => request.defer.reject(error))
        }
        response.data.forEach((data, index) => {
          const requestConfig = requests[index]
          if (!isEmpty(data.errors)) {
            return requestConfig.defer.reject(data)
          }
          return requestConfig.defer.resolve({
            ...response,
            data
          })
        })
      }, (error) => {
        requests.forEach(request => request.defer.reject(error))
      })
      this._queuedRequests = []
    }, this.batchInterval)
  }
}
