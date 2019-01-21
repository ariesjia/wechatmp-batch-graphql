var getOpname = /(query|mutation) ?([\w\d-_]+)? ?\(.*?\)? \{/

export default function nanographql (str) {
  str = Array.isArray(str) ? str.join('') : str
  var name = getOpname.exec(str)
  return function (variables) {
    var data = { query: str }
    if (variables) data.variables = variables
    if (name && name.length) {
      var operationName = name[2]
      if (operationName) data.operationName = name[2]
    }
    return data
  }
}
