const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create')
		.setDescription('Creates an auction'),
	async execute(interaction) {
        if (interaction.channelId != interaction.client.config.comm_channel) await interaction.reply(
            { content: "Can't do that here", ephemeral: true });
        
		console.log('create');
		
 		await interaction.reply('Auction created');
	},
};