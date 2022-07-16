const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {

		console.log('command should have been in: ', interaction.client.config.comm_channel);
		
 		await interaction.reply('Pong!');
	},
};