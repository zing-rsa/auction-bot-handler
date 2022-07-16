const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('Prematurely ends an auction'),
    async execute(interaction) {
        if (interaction.channelId != interaction.client.config.comm_channel) await interaction.reply(
            { content: "Can't do that here", ephemeral: true });

        console.log('end');

        await interaction.reply('Auction ended.');
    },
};