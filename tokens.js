const { JWT_SECRET, JWT_EXPIRATION } = require('./config');
const jwt = require('jsonwebtoken');

const generateJWT = (userid) => {

    const token = jwt.sign(
        { userid: userid },
        JWT_SECRET,
        {
            expiresIn: '30m',
        }
    );

    return token;
}

module.exports = {
    generateJWT
}