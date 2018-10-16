export default class Deferred {
  constructor() {
    const promise = new Promise((resolve, reject)=> {
      this.reject = reject
      this.resolve = resolve
    });

    this.promise = promise;
  }
}