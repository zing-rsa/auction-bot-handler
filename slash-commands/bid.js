const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bid')
		.setDescription('Bids on an auction'),
	async execute(interaction) {

		console.log('bid');
		
 		await interaction.reply('Bid received');
	},
};