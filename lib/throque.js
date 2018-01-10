/**
 * This module exports a function which creates a throttled version of an input
 * function. This throttled version will only allow a certain amount of calls to
 * said function to be active at once. Useful for file system operations which
 * limit how many files can be open at once. Use of global variables in this
 * module is because these variables are modularized to the exported function,
 * which means they are not shared between seperate instances of throttled
 * functions.
 */

const Queue = require('./Queue.js');
const promisify = require('./promisify');

// Queue which keeps track of functions to call when conditions allow for it
const callQueue = new Queue();

let activeCalls = 0;
let maxCalls;

/**
 * Returns a promise that resolves once execQueue processes the given callback.
 * callback, resolve, and reject are all pushed into the call queue in an object,
 * so that when execQueue processes this object, it can resolve or reject
 * the promise returned from addToQueueAndWait with the return value of the
 * given callback.
 * @param {function} callWhenReady - function to be pushed into a queue and
 *  called at an appropriate time. Return value from this function will be the
 *  value that addToQueueAndWait resolves with.
 * @returns {promise}
 *  @resolves - return value from callback
 */
const addToQueueAndWait = function(callWhenReady) {
  return new Promise((resolve, reject) => {
    callQueue.enqueue({ callWhenReady, resolve: resolve, reject });
    execQueue();
  });
};

/**
 * Processes the next call in the call queue if:
 * 1) The call queue has any items in it.
 * 2) The number of active calls is less than the maximum number of active calls.
 * Every time a call has completed, execQueue will call itself, ensuring all
 * items in the queue are processed.
 */
const execQueue = async function() {
  if (callQueue.length === 0) return;
  else if (activeCalls >= maxCalls) return;

  const nextCall = callQueue.dequeue();
  const { callWhenReady, resolve, reject } = nextCall;

  activeCalls += 1;

  try {
    const fttResolveValue = await callWhenReady();
    resolve(fttResolveValue);
  } catch (e) {
    reject(e);
  }

  activeCalls -= 1;
  execQueue();
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
  maxCalls = maxConcurrentCalls;

  let promisifiedFunctionToThrottle = returnsPromise
    ? functionToThrottle
    : promisify(functionToThrottle);

  const throttledFunction = function(...args) {
    const callWhenReady = () => {
      const fttPromise = promisifiedFunctionToThrottle(...args);
      const fttReturnsPromise = fttPromise && fttPromise.constructor == Promise;

      if (!fttReturnsPromise) {
        throw new Error(
          'functionToThrottle does not return a promise. Either set returnsPromise flag to false (not reccomended), or promisify your function to throttle'
        );
      }

      return fttPromise;
    };

    return addToQueueAndWait(callWhenReady);
  };

  return throttledFunction;
};

module.exports = throttleAndQueue;
