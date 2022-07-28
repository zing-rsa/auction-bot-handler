const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { getStakeInfo } = require('../services/blockfrost.service');
const { clear_timers, handle_timer_setup } = require('../timers');
const { AUCTION_COL_NAME, USER_COL_NAME } = require('../config');
const { toCustomStringDate } = require('../util');
const { ValidationError } = require('../errors');
const db = require('../mongo').db();
const lock = require('../lock');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bid')
		.setDescription('Bids on an auction')
		.addIntegerOption(option => option.setName('price').setDescription('Price of bid').setRequired(true)),
	async execute(interaction) {

		console.log(interaction.client.application.id + ': /bid')
		
		await interaction.deferReply({ ephemeral: true });

		lock.acquire("", async (done) => {

			try {

				let auction = interaction.client.auctions.find(auc => auc._id == interaction.channelId);
				let price = interaction.options.get('price').value;
				let now = Date.now();
				let balance;

				if (!interaction.client.auctionIds.includes(interaction.channelId))
					throw new ValidationError("Can't do that here");

				if (!(auction.start <= now && auction.end >= now))
					throw new ValidationError("Auction is not active");

				if (price < auction.highBid || (auction.bids > 0 && price < auction.highBid + auction.increment)) {
					if (auction.bids == 0)
						throw new ValidationError(`Min bid is ${auction.highBid}`);
					else
						throw new ValidationError(`Min bid is ${auction.highBid + auction.increment}`);
				}

				let user = await db.collection(USER_COL_NAME).findOne({ userid: interaction.user.id });

				if (!user)
					throw new ValidationError("You must register a wallet to partake in this auction, please run /verify-wallet");

				if (!user.stake_key)
					throw new ValidationError("I couldn't find your wallet info, please run /verify-wallet");

				try {
					balance = await getStakeInfo(user.stake_key);
				} catch (e) {
					throw new ValidationError('I could not obtain your wallet info from blockfrost');
				}

				if (balance < price)
					throw new ValidationError('It appears your wallet does not contain enough ADA to place this bid');


				extended = false;
				prevHighBidId = auction.highBidId

				auction_update = {
					...auction,
					highBid: price,
					highBidId: interaction.member.id,
					highBidName: interaction.member.displayName,
					bids: auction.bids + 1
				}

				if (auction.end - now < 60000) {
					auction_update.end = now + 60000;

					clear_timers(auction._id);
					handle_timer_setup(auction_update, interaction.client);
					extended = true;
				}

				interaction.client.auctions.splice(
					interaction.client.auctions.findIndex(auc => auc._id == interaction.channelId),
					1,
					auction_update
				);

				await db.collection(AUCTION_COL_NAME).updateOne({ _id: auction._id }, { '$set': auction_update });

				const bidEmbed = new MessageEmbed()
					.setColor('0x00a113')
					.setTitle(auction_update.highBidName + ' placed a bid!')
					.setDescription('Price: ' + auction_update.highBid + 'ADA')
					.addFields(
						{
							name: '\u200B',
							value: `How to participate: /bid ${auction_update.highBid + auction_update.increment}`,
							inline: false
						}
					)
					.setTimestamp();

				interaction.editReply("Bid processed.").catch(() => { });
				// await interaction.editReply("Bid processed.");

				await interaction.channel.send({ embeds: [bidEmbed] });

				if (prevHighBidId && prevHighBidId != 'none')
					await interaction.channel.send(`<@${prevHighBidId}> you have been outbid!`);

				if (extended)
					await interaction.channel.send(`Auction extended! New end time: ${toCustomStringDate(new Date(auction_update.end))} (UTC)`)

			} catch (e) {
				if (e instanceof ValidationError) {
					return await interaction.editReply({ content: e.message, ephemeral: true });
				} else {
					console.error('Failed to process bid. Error:', e);
					await interaction.editReply({ content: "Sorry, I couldn't process this bid", ephemeral: true });
				}
			} finally {
				done();
			}

		}, () => {});
	},
};