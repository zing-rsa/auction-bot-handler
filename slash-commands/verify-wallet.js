const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');

const { USER_COL_NAME } = require('../config');
const { generateJWT, generateNonce } = require('../util');
const { ValidationError } = require('../errors');
const db = require('../mongo').db();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-wallet')
        .setDescription('Verify a wallet against your discord user'),
    async execute(interaction) {

        console.log(interaction.client.application.id + ': /verify-wallet');
        
        await interaction.deferReply({ ephemeral: true });

        try {
            let description = ''

            let user = await db.collection(USER_COL_NAME).findOne({userid: interaction.user.id});

            if (user && user.stake_key) {
                description = `I checked my records and I already have you in my database. The details I found are:\n 
**stake_key: ${user.stake_key}**\n
If this is correct you can continue on to bidding. If you'd like to change, please feel free to re-verify below.`
            } else {
                description = `Please click the button below to verify your wallet.`
            }

            const nonce = generateNonce(16);
            const userid = interaction.user.id;
            const name = interaction.user.username;
            const token = generateJWT(userid);
            const avatarId = interaction.user.avatar;
            const bot_avatarid = interaction.client.user.avatar;
            const bot_id = interaction.client.application.id;

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

            const url = interaction.client.config.uri + `?data=${nonce}&userid=${userid}&username=${name}&auth=${token}&avatar=${avatarId}&bavatar=${bot_avatarid}&buser=${bot_id}`

            const urlEmbed = new MessageEmbed()
                .setColor('0x00a113')
                .setTitle(`Welcome to wallet verification!`)
                .setDescription(description)
                .setTimestamp();

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setLabel('Verify wallet')
                        .setURL(url)
                        .setStyle('LINK')
                );

            await interaction.editReply({ embeds: [urlEmbed], components: [row] });

        } catch (e) {
            if (e instanceof ValidationError) {
                return await interaction.editReply({ content: e.message, ephemeral: true });
            } else {
                console.error('Failure during verify wallet. Error:', e);
                await interaction.editReply({ content: "Sorry, I couldn't run that command", ephemeral: true });
            }
        }
    },
};