/**
 * Promisifies an async function which traditionally takes a callback.
 * functionToPromisify must follow the Node.js error-first callback pattern.
 * This means callback should always be the last argument and the callback
 * arguments signature should be (err, ...) => ...
 * ie: myAsyncFuntion(any, amount, of, arguments, (err, data) => ...)
 * NOTE: If the callback signature only takes a single argument (other than the
 * error), the promisified version will resolve with this value. Otherwise, the
 * promisified version will resolve with an array of the arguments that would
 * been passed to the callback (in the same order).
 * @param {function} functionToPromisify
 * @returns {function} - promisified version of functionToPromisify
 */
const promisify = function(functionToPromisify) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      functionToPromisify(...args, (err, ...data) => {
        if (err) reject(err);
        else if (data.length > 1) resolve(data);
        else resolve(data[0]);
      });
    });
  };
};

module.exports = promisify;
