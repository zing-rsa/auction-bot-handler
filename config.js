module.exports = {
    MONGO_URL: process.env.MONGO_URI,
    DB_NAME: 'auction-bot-handler',
    BOT_COL_NAME: 'bots',
    AUCTION_COL_NAME: 'auctions',
    USER_COL_NAME: 'users',

    JWT_SECRET: process.env.JWT_SECRET,

    FRONTEND_URL: 'http://localhost:3000',

    HEROKU_RESTART_MAX: 100800000

}
