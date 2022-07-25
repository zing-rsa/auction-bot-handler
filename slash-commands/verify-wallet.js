const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { ValidationError } = require('../errors');
const { generateNonce } = require('../entropy');
const { generateJWT } = require('../tokens');
const { USER_COL_NAME, FRONTEND_URL } = require('../config');
const db = require('../mongo').db();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-wallet')
        .setDescription('Verify a wallet against your discord user'),
    async execute(interaction) {

        try {

            // try { // validation

            // 	if (!interaction.client.auctionIds.includes(interaction.channelId))
            // 		throw new ValidationError("Can't do that here");



            // 	} catch (e) {
            // 		if (e instanceof ValidationError)
            // 			return await interaction.reply({ content: e.message, ephemeral: true });
            // 		else 
            // 			throw(e)
            // 	}

            console.log('/verify-wallet');

            await interaction.deferReply({ ephemeral: true });

            const nonce = generateNonce(16);
            const userid = interaction.user.id;
            const name = interaction.user.username;
            const token = generateJWT(userid);
            const avatarId = interaction.user.avatar;

            await db.collection(USER_COL_NAME).updateOne(
                { userid: interaction.user.id },
                {
                    '$set': {
                        userid: interaction.user.id,
                        nonce: nonce
                    }
                },
                { upsert: true }
            );

            const url = FRONTEND_URL + `?data=${nonce}&userid=${userid}&username=${name}&auth=${token}&avatar=${avatarId}`

            const urlEmbed = new MessageEmbed()
                .setColor('0x00a113')
                .setTitle(`Please visit this link to verify!`)
                .setDescription(`Description`)
                .setURL(url)
                .setTimestamp();

            await interaction.editReply({ embeds: [urlEmbed], ephemeral: true });

        } catch (e) {
            console.error('Failed to process price check. Error:', e);
            await interaction.editReply({ content: "Sorry, I couldn't run that command", ephemeral: true });
        }
    },
};