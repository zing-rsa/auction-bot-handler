const AsyncLock = require('async-lock');

let lock = new AsyncLock();

module.exports = lock
