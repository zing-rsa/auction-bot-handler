const { SlashCommandBuilder } = require('@discordjs/builders');
const { AUCTION_COL_NAME } = require('../config');
const db = require('../mongo').db();

const handle_auction_end = async (auction, interaction) => {
    interaction.client.auctions.splice(interaction.client.auctions.findIndex(a => a._id == auction._id), 1);
    interaction.client.auctionIds.splice(interaction.client.auctionIds.indexOf(auction._id));

    await interaction.guild.channels.cache.get(interaction.client.config.tx_channel)
        .send(`Closed auction: ${auction.name}`);

    await db.collection(AUCTION_COL_NAME).deleteOne({ _id: auction._id });

    await interaction.guild.channels.cache.get(auction._id)
        .send('This auction has ended. Thank you!');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('Prematurely ends an auction')
        .addStringOption(option =>
            option.setName('auction-id').setDescription('The ID of the auction(same as channelID)').setRequired(true)),
    async execute(interaction) {
        try {

            console.log('end');

            if (interaction.channelId != interaction.client.config.comm_channel)
                return await interaction.reply({ content: "Can't do that here", ephemeral: true });

            id = interaction.options.get('auction-id').value;

            auction = await db.collection(AUCTION_COL_NAME).findOne({ _id: id });

            if (!auction)
                return await interaction.reply({ content: "Can't find that auction", ephemeral: true });

            handle_auction_end(auction, interaction);

            return await interaction.reply('Auction ended');

        } catch (e) {
            console.error(e);
            return await interaction.reply('Failed to execute this command');
        }
    },
};