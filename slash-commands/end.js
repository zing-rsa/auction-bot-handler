const { SlashCommandBuilder } = require('@discordjs/builders');
const { handle_auction_end } = require('../handlers');
const { clear_timers } = require('../timers');
const { AUCTION_COL_NAME } = require('../config');
const { ValidationError } = require('../errors');
const db = require('../mongo').db();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('Prematurely ends an auction')
        .addStringOption(option =>
            option.setName('auction-id').setDescription('The ID of the auction(same as channelID)').setRequired(true)),
    async execute(interaction) {
        try {
            try {
                id = interaction.options.get('auction-id').value;
                auction = await db.collection(AUCTION_COL_NAME).findOne({ _id: id });

                if (interaction.channelId != interaction.client.config.comm_channel)
                    throw new ValidationError("Can't do that here");

                if (!auction)
                    throw new ValidationError("Can't find that auction");

            } catch (e) {
                if (e instanceof ValidationError)
                    return await interaction.reply({ content: e.message, ephemeral: true });
                else
                    throw(e)
            }

            console.log('/end');

            clear_timers(auction._id);

            handle_auction_end(auction, interaction.client);

            return await interaction.reply('Auction ended');

        } catch (e) {
            console.error(e);
            return await interaction.reply("Sorry, I couldn't execute that command");
        }
    },
};