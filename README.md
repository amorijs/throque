# throque

Simple function decorator which limits how many invocations of said function can be active at once.

Pronounced: throck

Etymology: Throttle + Queue = throque

## Installation and usage

`yarn install` or `npm install`

```javascript
const throque = require('./throque');
const writeFileThroqued = throque(fs.writeFile, 200, false);
```

## History

throque was born from this pesky Node.js error: `Error: EMFILE: too many open files`. This error get's thrown when Node's file-system module has too many open files at once (obviously.) throque alleviates this problem by creating a decorated version of your function which Queues excessive calls until the appropriate conditions are met.

## Example

This snippet throws the error mentioned above:

```javascript
for (let i = 0; i < 10000; i += 1) {
  fs.readFile(filePath, { encoding: 'utf8' }, err => {
    if (err) throw err;
  });
}
```

throque to the rescue:

```javascript
const throque = require('throque');
const readFileThroqued = throque(fs.readFile, 200, false);

for (let i = 0; i < 10000; i += 1) {
  readFileThroqued(filePath, { encoding: 'utf8' }) // We can still pass the same arguments to fs.readFile (but not the callback)
    .then(console.log)   // That's a lot of logs
    .catch(console.log); // No error! :)
}
```

Notice how we are no longer using callbacks when using a throqued function. This is because throque will promisify your `functiontoThrottle` if you set the `returnsPromise` argument to false. There are some important things to note when setting this flag to false however (see API below.)

## API

throque currently exports a single function which is relatively simple to use.

### `throttleAndQueue` aka `throque`

_throque(functionToThrottle, maxConcurrentCalls, returnsPromise);_

#### Parameters

##### `functionToThrottle`: function

##### `maxConcurrentCalls`: number (default: 100)

* Maximum amount of invocations of the throttled function that can be active at any given time.

##### `returnsPromise`: boolean (default: true)

* Indicates whether or not your `functionToThrottle` returns a promise (true) or calls a callback when finished (false).
* If this flag is set to false, there are some important things to note:
  * The returned throttled function will be a promisified version of `functionToThrottle`.
  * `functionToThrottle` **must** follow the [Node.js error-first callback pattern](http://fredkschott.com/post/2014/03/understanding-error-first-callbacks-in-node-js/), or the internal promisification will fail. Even though Node native library methods should all work perfectly fine this way, it is recomended to not set this value to false (which means your `functiontoThrottle` returns a promise.)
  * If your `functionToThrottle` only passes a single argument to its' callback, your promisified function will resolve with this value, otherwise it will resolve with an array of values in the same order that would of been passed into the callback. You can use [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to mimic the callback signature.

## Plans for the future

### Tests

Currently throque is not tested, but tests will be added soon, and future additions to the library will be developed test-first.

### Extensive error handling

Although tracking errors at the time of writing should be extremely simple (the library is very small), more robust and descriptive error handling will be added.

### Features

* Ability to group multiple `functionsToThrottle` into one throttle-queue.

* Tracking calls made and ability to generate reports.
