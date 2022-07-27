const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { USER_COL_NAME, FRONTEND_URI } = require('../config');
const { generateJWT, generateNonce } = require('../util');
const { ValidationError } = require('../errors');
const db = require('../mongo').db();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-wallet')
        .setDescription('Verify a wallet against your discord user'),
    async execute(interaction) {

        console.log('/verify-wallet');
        await interaction.deferReply({ ephemeral: true });

        try {

            // validation? 

            const nonce = generateNonce(16);
            const userid = interaction.user.id;
            const name = interaction.user.username;
            const token = generateJWT(userid);
            const avatarId = interaction.user.avatar;
            const bot_avatarid = interaction.client.user.avatar
            const bot_id = interaction.client.application.id

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

            const url = FRONTEND_URI + `?data=${nonce}&userid=${userid}&username=${name}&auth=${token}&avatar=${avatarId}&bavatar=${bot_avatarid}&buser=${bot_id}`

            const urlEmbed = new MessageEmbed()
                .setColor('0x00a113')
                .setTitle(`Please visit this link to verify!`)
                .setDescription(`Description`)
                .setURL(url)
                .setTimestamp();

            await interaction.editReply({ embeds: [urlEmbed], ephemeral: true });

        } catch (e) {
            if (e instanceof ValidationError){
                return await interaction.reply({ content: e.message, ephemeral: true });
            } else {
                console.error('Failure during verify wallet. Error:', e);
                await interaction.editReply({ content: "Sorry, I couldn't run that command", ephemeral: true });
            }
        }
    },
};