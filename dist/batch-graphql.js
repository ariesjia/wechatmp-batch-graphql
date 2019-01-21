function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    var ownKeys = Object.keys(source);

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
        return Object.getOwnPropertyDescriptor(source, sym).enumerable;
      }));
    }

    ownKeys.forEach(function (key) {
      _defineProperty(target, key, source[key]);
    });
  }

  return target;
}

var Deferred = function Deferred() {
  var _this = this;

  _classCallCheck(this, Deferred);

  var promise = new Promise(function (resolve, reject) {
    _this.reject = reject;
    _this.resolve = resolve;
  });
  this.promise = promise;
};

var isEmpty = function isEmpty(obj) {
  // null and undefined are "empty"
  if (obj === null || obj === undefined) { return true; } // Assume if it has a length property with a non-zero value
  // that that property is correct.

  if (obj.length > 0) { return false; }
  if (obj.length === 0) { return true; } // If it isn't an object at this point
  // it is empty, but it can't be anything *but* empty
  // Is it empty?  Depends on your application.

  if (_typeof(obj) !== "object") { return true; } // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and valueOf enumeration bugs in IE < 9

  return Object.keys(obj).length === 0;
};

function isType(type) {
  return function (obj) {
    return {}.toString.call(obj) == "[object " + type + "]";
  };
}

var isFunction = isType("Function");

var request = function request(method) {
  return function (url, option) {
    var _Object$assign = Object.assign({
      data: {},
      headers: {}
    }, option),
        data = _Object$assign.data,
        headers = _Object$assign.headers;

    var defer = new Deferred();
    var requestTask = wx.request({
      method: method,
      url: url,
      data: data,
      header: _objectSpread({
        'accept': 'application/json',
        'content-type': 'application/json; charset=utf-8'
      }, headers),
      success: function success(res) {
        if (res.statusCode >= 400) {
          defer.reject(res);
        } else {
          defer.resolve(res);
        }
      },
      fail: function fail(err) {
        defer.reject(err);
      }
    });
    return Object.assign(defer.promise, {
      abort: requestTask.abort
    });
  };
};

var getOpname = /(query|mutation) ?([\w\d-_]+)? ?\(.*?\)? \{/;
function nanographql(str) {
  str = Array.isArray(str) ? str.join('') : str;
  var name = getOpname.exec(str);
  return function (variables) {
    var data = {
      query: str
    };
    if (variables) { data.variables = variables; }

    if (name && name.length) {
      var operationName = name[2];
      if (operationName) { data.operationName = name[2]; }
    }

    return data;
  };
}

var _graph = function graph(url, gql) {
  var option = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return request('POST')(url, {
    data: gql,
    headers: option.headers
  });
};

var buildHeaders = function buildHeaders(headers) {
  if (isFunction(headers)) {
    return headers();
  }

  return headers || {};
};

var BatchGraphql =
/*#__PURE__*/
function () {
  function BatchGraphql(_ref) {
    var _ref$uri = _ref.uri,
        uri = _ref$uri === void 0 ? '/graphql' : _ref$uri,
        _ref$batchInterval = _ref.batchInterval,
        batchInterval = _ref$batchInterval === void 0 ? 10 : _ref$batchInterval,
        _ref$option = _ref.option,
        option = _ref$option === void 0 ? {} : _ref$option;

    _classCallCheck(this, BatchGraphql);

    this._queuedRequests = [];
    this.uri = uri;
    this.batchInterval = batchInterval;
    this.baseOption = option;
  }

  _createClass(BatchGraphql, [{
    key: "request",
    value: function request$$1(gql, option) {
      var defer = new Deferred();

      this._queuedRequests.push({
        config: {
          gql: gql,
          option: option
        },
        defer: defer
      });

      if (this._queuedRequests.length === 1) {
        this._timer();
      }

      return defer.promise;
    }
  }, {
    key: "graph",
    value: function graph(gql) {
      var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      return _graph(option.uri || this.uri, gql, _objectSpread({}, option, {
        headers: Object.assign({}, buildHeaders(this.baseOption.headers), buildHeaders(option.headers))
      })).then(function (res) {
        if (!isEmpty(res.data.errors)) {
          return Promise.reject(res);
        }

        return res;
      });
    }
  }, {
    key: "_timer",
    value: function _timer() {
      var _this = this;

      setTimeout(function () {
        var requests = _this._queuedRequests.slice(0);

        _graph(_this.uri, requests.map(function (item) {
          return item.config.gql;
        })).then(function (response) {
          var resultLength = response.data.length;
          var expectLength = requests.length;

          if (expectLength !== resultLength) {
            var errorMessage = "server returned results with length ".concat(resultLength, ", expected length of ").concat(expectLength);
            console.error(errorMessage);
            var error = new Error(errorMessage);
            return requests.forEach(function (request$$1) {
              return request$$1.defer.reject(error);
            });
          }

          response.data.forEach(function (data, index) {
            var requestConfig = requests[index];

            if (!isEmpty(data.errors)) {
              return requestConfig.defer.reject(data);
            }

            return requestConfig.defer.resolve(_objectSpread({}, response, {
              data: data
            }));
          });
        }, function (error) {
          requests.forEach(function (request$$1) {
            return request$$1.defer.reject(error);
          });
        });

        _this._queuedRequests = [];
      }, this.batchInterval);
    }
  }]);

  return BatchGraphql;
}();

export { _graph as graph, BatchGraphql, nanographql as gql };
