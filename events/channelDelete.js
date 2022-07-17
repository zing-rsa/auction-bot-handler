const { handle_auction_end } = require('../handlers');
const { clear_timers } = require('../timers')

module.exports = {
	name: 'channelDelete',
	async execute(channel) {
        if (!channel.client.auctionIds.includes(channel.id))
            return

        console.log('Detected deleted channel: ', channel.id);

        auction = channel.client.auctions.find(auc => auc._id == channel.id);

        clear_timers(channel.id);

        handle_auction_end(auction, channel.client, silent=true);

        console.log('Silently deleted auction: ', channel.id);
	},
};