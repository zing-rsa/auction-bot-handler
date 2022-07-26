const { JWT_SECRET, JWT_EXPIRATION } = require('./config');
const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');


const toCustomStringDate = (d) => {
    return d.getFullYear() + "-" + (d.getMonth() + 1).toString().padStart(2, '0') + "-" + d.getDate().toString().padStart(2, '0') + " " +
        d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, '0') + ':' + d.getSeconds().toString().padStart(2, '0');
}

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

const generateJWT = (userid) => {

    const token = jwt.sign(
        { userid: userid },
        JWT_SECRET,
        {
            expiresIn: '30m',
            // expiresIn: JWT_EXPIRATION,
        }
    );

    return token;
}

module.exports = {
    toCustomStringDate,
    generateNonce,
    generateJWT
}