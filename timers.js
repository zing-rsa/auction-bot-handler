const { handle_auction_start, handle_auction_end} = require('./handlers')
const { HEROKU_RESTART_MAX } = require('./config');

let start_timers = {}
let end_timers = {}

const handle_timer_setup = (auction, client) => {

    const start_diff = auction.start - Date.now();
    const end_diff = auction.end - Date.now();
    
    if (auction.active === false && start_diff < HEROKU_RESTART_MAX)
        start_timers[auction._id] = setTimeout(() => handle_auction_start(auction, client), Math.max(start_diff, 10));

    if (end_diff < HEROKU_RESTART_MAX)
        end_timers[auction._id] = setTimeout(() => handle_auction_end(auction, client), Math.max(end_diff, 500));
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
