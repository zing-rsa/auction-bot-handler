const { AUCTION_COL_NAME } = require('./config');
const db = require('./mongo').db();
const { MessageEmbed } = require('discord.js');


const handle_auction_start = async (auction, client) => {
    console.log('auction-' + auction.name + ' started')

    await db.collection(AUCTION_COL_NAME).updateOne(
        { _id: auction._id },
        {
            '$set': {
                'active': true
            }
        });

    channel = client.guilds.cache.get(auction.guild).channels.cache.get(auction._id);

    if (!channel) {
        handle_auction_end(auction, client, silent = true);
    } else {
        await channel.send("This auction has started. Good luck!");
    }
}

const handle_auction_end = async (auction, client, silent = false) => {

    if (client.auctions.findIndex(a => a._id == auction._id) > -1)
        client.auctions.splice(client.auctions.findIndex(a => a._id == auction._id), 1);

    if (client.auctionIds.indexOf(auction._id) > -1)
        client.auctionIds.splice(client.auctionIds.indexOf(auction._id));

    auction = await db.collection(AUCTION_COL_NAME).findOne({ _id: auction._id });
    await db.collection(AUCTION_COL_NAME).deleteOne({ _id: auction._id });

    if (!silent) {
        await client.guilds.cache.get(auction.guild)
            .channels.cache.get(auction._id)
            .send('This auction has ended. Thank you!');

        const endEmbed = new MessageEmbed()
            .setColor('0xFF5733')
            .setTitle(`Auction for ${auction.name} completed`)
            .addFields(
                {  name: 'Winner:', value: `${auction.highBidName} (${auction.highBidId})`,inline: true},
                {  name: 'Sale Price:', value: auction.highBid.toString(), inline: true},
                {  name: 'Total bids:', value: auction.bids.toString(), inline: false}
            )
            .setTimestamp();

        await client.guilds.cache.get(auction.guild)
            .channels.cache.get(client.config.tx_channel)
            .send({ embeds: [endEmbed] });
    }
}

module.exports = {
    handle_auction_start,
    handle_auction_end
}