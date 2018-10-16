# wechatmp-batch-graphql
> Query Batching in Wechat Mini Program

- [What is GraphQL?](https://graphql.org/)
- [Query batching in Apollo](https://blog.apollographql.com/query-batching-in-apollo-63acfd859862)

## Examples
```javascript
import { BatchGraphql, gql } from '@/utils/batch-graphql'
const graphql = new BatchGraphql({
  uri: '/graphqls'
})
const query1 = gql`
query getProduct($id: ID!) {
  node(id: $id) {
    ... on Product {
      description
    }
  }
}
`
const query2 = gql`
query chineseRegions {
  chineseRegions {
    code
    name
  }
}
`
graphql.request(query1({
  id: 'Z2lkOi8vUFJPRFDVC9OSzAwMTQ='
}))

graphql.request(query2())

// query1 and query2 it will send in one request
```

## Install
``` bash
// use yarn
yarn add wechamp-batch-graphql
// use npm
npm install wechamp-batch-graphql
```

## License

[MIT](http://opensource.org/licenses/MIT)


## Thanks
Heavily inspired by [nanographql](https://github.com/yoshuawuyts/nanographql)