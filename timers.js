const { handle_auction_start, handle_auction_end} = require('./handlers')
const { HEROKU_RESTART_MAX } = require('./config');

let start_timers = {}
let end_timers = {}

const handle_timer_setup = (auction, client) => {

    const start_diff = auction.start - Date.now();
    const end_diff = auction.end - Date.now();

    // does not cater for the bot being down during the start or end of auctions
    // can't remove isFuture check because that would result in duplicate 'start' calls for active auctions

    if (start_diff > 0 && start_diff < HEROKU_RESTART_MAX)
        start_timers[auction._id] = setTimeout(() => handle_auction_start(auction, client), start_diff);

    if (end_diff > 0 && end_diff < HEROKU_RESTART_MAX)
        end_timers[auction._id] = setTimeout(() => handle_auction_end(auction, client), end_diff);
}

const clear_timers = (timerId = null) => {
    if (!timerId) {
        start_timers = {}
        end_timers = {}
    } else {

        clearTimeout(start_timers[timerId]);
        clearTimeout(end_timers[timerId]);

        delete start_timers[timerId];
        delete end_timers[timerId];
    }
}

module.exports = {
    handle_timer_setup,
    clear_timers
}
