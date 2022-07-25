const { randomBytes } = require('crypto');

const randomString = (length = 64, chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') => {
    if (length <= 0 || length > 2048) throw new Error('Length must be bewteen 1 and 2048.');
    const charsLength = chars.length;
    if (charsLength < 10 || chars.length > 256) throw new Error('Chars must be bewteen 10 and 256.');
    const bytes = randomBytes(length);
    let result = new Array(length);
    let cursor = 0;
    for (let i = 0; i < length; i++) {
        cursor += bytes[i];
        result[i] = chars[cursor % charsLength];
    }
    return result.join('');
}

const generateNonce = (length) => {
    if (length <= 0 || length > 2048) throw new Error('Length must be bewteen 1 and 2048');
    const payload = randomString(length);
    return Buffer.from(`${payload}`).toString('hex');
}

module.exports = {
    generateNonce
}