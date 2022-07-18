const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { ValidationError } = require('../errors')


module.exports = {
	data: new SlashCommandBuilder()
		.setName('price')
		.setDescription('Shows the current price of an auction'),
	async execute(interaction) {

		try {
			try { // validation

				if (!interaction.client.auctionIds.includes(interaction.channelId))
					throw new ValidationError("Can't do that here");

				} catch (e) {
					if (e instanceof ValidationError)
						return await interaction.reply({ content: e.message, ephemeral: true });
					else 
						throw(e)
				}
				console.log('/price')
				
				let { highBid, increment } = interaction.client.auctions.find(auc => auc._id = interaction.channelId);

				const priceEmbed = new MessageEmbed()
				.setColor('0x00a113')
				.setTitle(`The current highest bid is: ${highBid}ADA`)
				.setDescription(`Next bid is: ${highBid + increment}ADA`)
				.setTimestamp();

			await interaction.reply({ embeds: [priceEmbed] });
		} catch (e) {
			console.error('Failed to process price check. Error:', e);
			await interaction.reply({ content: "Sorry, I couldn't run that command", ephemeral: true });
		}
	},
};