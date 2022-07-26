const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { ValidationError } = require('../errors');
const lock = require('../lock');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('price')
		.setDescription('Shows the current price of an auction'),
	async execute(interaction) {

		console.log('/price')
		await interaction.deferReply();

		lock.acquire("", async (done) => {

			try {

				if (!interaction.client.auctionIds.includes(interaction.channelId))
					throw new ValidationError("Can't do that here");
	
				let { highBid, increment } = interaction.client.auctions.find(auc => auc._id = interaction.channelId);
	
				const priceEmbed = new MessageEmbed()
					.setColor('0x00a113')
					.setTitle(`The current highest bid is: ${highBid}ADA`)
					.setDescription(`Next bid is: ${highBid + increment}ADA`)
					.setTimestamp();
	
				await interaction.editReply({ embeds: [priceEmbed] });
			} catch (e) {
				if (e instanceof ValidationError) {
					return await interaction.editReply({ content: e.message, ephemeral: true });
				} else {
					console.error('Failed to process price check. Error:', e);
					await interaction.editReply({ content: "Sorry, I couldn't run that command", ephemeral: true });
				}
			} finally {
				done()
			}

		}, () => {});

	},
};