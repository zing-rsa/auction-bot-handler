const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('../mongo').db()
const { AUCTION_COL_NAME } = require('../config')
const { clear_timers, handle_timer_setup } = require('../timers');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bid')
		.setDescription('Bids on an auction')
		.addIntegerOption(option => option.setName('price').setDescription('Price of bid').setRequired(true)),
	async execute(interaction) {

		try {

			console.log('bid')

			if (!interaction.client.auctionIds.includes(interaction.channelId))
				return await interaction.reply({ content: "Can't do that here", ephemeral: true });

			console.log('bid valid');

			auction = interaction.client.auctions.find(auc => auc._id == interaction.channelId);
			price = interaction.options.get('price').value;

			now = Date.now();

			if (!(auction.start <= now && auction.end >= now))
				return await interaction.reply({ content: "Auction is not active", ephemeral: true });

			if (price <= auction.highBid)
				return await interaction.reply({ content: `Min bid is ${auction.highBid + auction.increment}`, ephemeral: true });

			prevHighBidId = auction.highBidId

			auction_update = {
				...auction,
				highBid: price,
				highBidId: interaction.member.id,
				highBidName: interaction.member.displayName,
				bids: auction.bids + 1
			}

			if (auction.end - now < 60000) {
				// extend logic
				// clear timers, setup new timer for end

				clear_timers(auction._id);
				handle_timer_setup(auction_update, client)

			}

			interaction.client.auctions.splice(
				interaction.client.auctions.findIndex(auc => auc._id == channel.id_),
				1,
				{
					...auction,
					...auction_update
				}
			);

			await db.collection(AUCTION_COL_NAME).updateOne({ _id: auction._id }, { '$set': auction_update });

			await interaction.reply(`New bid from ${auction_update.highBidName} received: ${auction_update.highBid}ADA`);

		} catch (e) {
			console.error('Failed to process bid. Error:', e);
			await interaction.reply({ content: "Sorry, I couldn't process this bid", ephemeral: true });
		}
	},
};