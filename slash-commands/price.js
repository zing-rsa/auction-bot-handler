const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('price')
		.setDescription('Shows the current price of an auction'),
	async execute(interaction) {

		console.log('price');
		
 		await interaction.reply('A200');
	},
};