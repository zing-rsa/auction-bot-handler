module.exports = {
    MONGO_URL: process.env.MONGO_URI,
    DB_NAME: 'auction-bot-handler',
    BOT_COL_NAME: 'bots',
    AUCTION_COL_NAME: 'auctions',

    HEROKU_RESTART_MAX: 100800000

}
