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
