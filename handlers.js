const { AUCTION_COL_NAME } = require('./config');
const db = require('./mongo').db();


const handle_auction_start = async (auction, client) => {
	console.log('auction-' + auction.name + ' started')

	await db.collection(AUCTION_COL_NAME).updateOne(
        { _id: auction._id}, 
        { '$set': {
            'active': true
        }
    });

	await client.guilds.cache.get(auction.guild)
        .channels.cache.get(auction._id)
        .send("This auction has started. Good luck!")
}

const handle_auction_end = async (auction, interaction) => {

    //this needs to be edited to accept (auction, client)

    interaction.client.auctions.splice(interaction.client.auctions.findIndex(a => a._id == auction._id), 1);
    interaction.client.auctionIds.splice(interaction.client.auctionIds.indexOf(auction._id));

    await interaction.guild.channels.cache.get(interaction.client.config.tx_channel)
        .send(`Closed auction: ${auction.name}`);

    await db.collection(AUCTION_COL_NAME).deleteOne({ _id: auction._id });

    await interaction.guild.channels.cache.get(auction._id)
        .send('This auction has ended. Thank you!');
}

module.exports = {
    handle_auction_start,
    handle_auction_end
}