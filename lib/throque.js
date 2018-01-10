/**
 * This module exports a function which creates a throttled version of an input
 * function. This throttled version will only allow a certain amount of calls to
 * said function to be active at once. Useful for file system operations which
 * limit how many files can be open at once. Global variables in this
 * file are modularized to the exported function, which means they are not
 * shared between different instances of throttled functions.
 */

const Queue = require('./Queue.js');
const promisify = require('es6-promisify');

const queue = new Queue();
let activeCalls = 0;

/**
 * Creates a promise and pushes its' resolver function into the queue.
 * @returns {promise} - will resolve when this promises' resolver is called by
 *  execQueue
 */
const addToQueueAndWait = function() {
  return new Promise(resolve => queue.enqueue(resolve));
};

/**
 * Calls the next item in the queue as long as the queue has items.
 */
const execNext = function() {
  if (queue.length === 0) return;
  queue.dequeue()();
};

/**
 * Returns a throttled and promisified (if not already) version of an
 * asynchronous function. This throttled function will only allow a certain
 * number of invocations to be active at any given time. Invocations to the
 * throttled function when the maximum number of calls are active will enqueue
 * the function and invoke it when the appropriate conditions are met. Any
 * arguments passed to the throttled function will be passed to the original
 * functionToThrottle. The throttled function will return a promise that
 * resolves whatever functionToThrottle resolves.
 * @param {function} functionToThrottle
 * @param {number (default: 100)} maxConcurrentCalls - maximum amount of
 *  invocations of functionToThrottle that can be active at any given time.
 * @param {boolean (default: true)} returnsPromise - indicates whether or
 *  not functionToThrottle returns a promise (true) or calls a callback when
 *  finished (false). If this flag is false, the returned throttled function
 *  will be a promisified version of functionToThrottle.
 *  Note: If functionToThrottle does take a callback to call when done, it must
 *  follow the Node.js error-first callback pattern, or the internal
 *  promisification will fail. It is recommended to pre-promisify your
 *  functionToThrottle before using this function.
 * @returns {function} - throttled function which returns a promise once
 *  functionToThrottle has been invoked.
 *  - @returns {promise} - resolves with the return value of calling
 *     functionToThrottle with the arguments passed into the throttled function
 */
const throttleAndQueue = function(
  functionToThrottle,
  maxConcurrentCalls = 100,
  returnsPromise = true
) {
  const promisifiedFtt = returnsPromise
    ? functionToThrottle
    : promisify(functionToThrottle);

  return async function(...args) {
    if (activeCalls > maxConcurrentCalls) await addToQueueAndWait();

    activeCalls += 1;
    const fttPromise = promisifiedFtt(...args);
    const returnsPromise = fttPromise && typeof fttPromise.then == 'function';

    if (!returnsPromise) {
      throw new Error(
        'functionToThrottle does not return a promise. Either set returnsPromise flag to false (not reccomended), or promisify your function to throttle'
      );
    }

    const fttResolveValue = await fttPromise;
    activeCalls -= 1;

    if (activeCalls < maxConcurrentCalls) execNext();

    return fttResolveValue;
  };
};

module.exports = throttleAndQueue;
