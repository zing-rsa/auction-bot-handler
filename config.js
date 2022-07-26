module.exports = {
    MONGO_URL: process.env.MONGO_URI,
    DB_NAME: 'auction-bot-handler',
    BOT_COL_NAME: 'bots',
    AUCTION_COL_NAME: 'auctions',
    USER_COL_NAME: 'users',

    JWT_SECRET: process.env.JWT_SECRET,

    FRONTEND_URL: 'http://localhost:3000',

    BLOCKFROST_PROJECTID: process.env.BLOCKFROST_PROJECTID,
    BLOCKFROST_URI: 'https://cardano-mainnet.blockfrost.io/api/v0/',

    HEROKU_RESTART_MAX: 100800000

}
