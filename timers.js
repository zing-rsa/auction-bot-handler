const { handle_auction_start, handle_auction_end} = require('./handlers')

let start_timers = {}
let end_timers = {}

const handle_timer_setup = (auction, client) => {

    // const start_diff = auction.start - new Date();
    // const end_diff = auction.end - new Date();
    
    const start_diff = 10000; //dev
    const end_diff = 20000;   //dev

    //check if auctions are soon

    if (start_diff > 0)
        start_timers[auction._id] = setTimeout(() => handle_auction_start(auction, client), start_diff);

    if (end_diff > 0)
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
