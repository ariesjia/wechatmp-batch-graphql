import Deferred from './deferred'
import { request } from './request'
import { isEmpty } from './isEmpty'

export const graph = (url, gql, option = {}) => {
  return request('POST')(
    url,
    {
      data: gql,
      headers: option.headers
    }
  )
}

export class BatchGraphql {
  constructor({
    uri = '/graphql',
    batchInterval = 10,
  }) {
    this._queuedRequests = []
    this.uri = uri
    this.batchInterval = batchInterval
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
    return graph(option.uri || this.uri, gql, option).then((res) => {
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

export {default as gql} from './nanographql'
