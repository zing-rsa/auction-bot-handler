const db = require('../mongo').db();
const { BOT_COL_NAME } = require('../config')
const path = require('node:path');
const fs = require('node:fs');

const { MessageEmbed } = require('discord.js');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = {
    name: 'guildCreate',
    once: true,
    async execute(guild) {

        try {

            clientId = guild.client.application.id;

            console.log(`Bot ${clientId} added to server: ${guild.id} (${guild.name})`)

            bot_details = await db.collection(BOT_COL_NAME).findOne({ _id: clientId });

            if (bot_details.guild != guild.id)
                return

            if (bot_details.setup_complete == true) {
                console.log(`Setup is already complete for bot ${clientId} on server ${guild.id} (${guild.name})`);
                return
            }

            let guideHeader = [
                'Thanks for adding me!',
                'Great!',
                'Nice.',
                'Setup is complete!'
            ]

            let guideBody = [
                `Lets get you setup. It'll take 3 steps.             
To start off, please create me a new category in your server. This category will be 
where all your auction channels are posted. It can be anywhere, and 
you can name it anything you'd like, just please make sure that I have access to it. 
Once you're done, please send the ID of the category to me here.`,

                `Next create a channel that you will use to run admin commands for auctions 
(create, end, etc.). It's a good idea to make this private, but please make 
sure I have access to it. Once you're ready, please send me the ID of the channel here.`,

                `Last step is the history channel - create a channel and I'll log the info of your auctions as they end. 
Once you're done please send that ID here.`,

                `You can now go to your auction commands channel and get 
started with /create. If you have any questions, please message my dad - zing#0908`
            ];

            details = []

            log = await guild.fetchAuditLogs({ type: "BOT_ADD", limit: 1 });
            dmChannel = await log.entries.first().executor.createDM();

            for (let i = 0; i < 3; i++) {

                step_complete = false;
                retries_left = 5;

                guideEmbed = new MessageEmbed()
                    .setColor('0xfdbf2f')
                    .setTitle(guideHeader[i])
                    .setDescription(guideBody[i])
                    .setTimestamp()

                await dmChannel.send({ embeds: [guideEmbed] });

                // await dmChannel.send(guideText[i]);

                while (!step_complete) {

                    if (retries_left == 0) {
                        throw new Error('Could not complete setup: Max retires reached');
                    }

                    try {

                        message = (await dmChannel.awaitMessages({ max: 1 })).first();

                        channelId = message.content;

                        await guild.channels.fetch();

                        channel = guild.channels.cache.get(channelId);

                        if (channel.type == 'GUILD_TEXT') {
                            await channel.send("I'm here!");
                        } else if (channel.type == 'GUILD_CATEGORY') {
                            if (!channel) {
                                throw new Error("Couldn't find category");
                            }
                        } else {
                            await channel.send("I'm here!");
                        }

                        details[i] = channelId;

                        step_complete = true;

                    } catch (e) {
                        retries_left--;
                        await dmChannel.send(`I couldn't find that. Please make sure the ID is correct, and that I have the permission to access it, then send it again.`);
                    }
                }
            }

            guideEmbed = new MessageEmbed()
                .setColor('0xfdbf2f')
                .setTitle(guideHeader[3])
                .setDescription(guideBody[3])
                .setTimestamp()

            await dmChannel.send({ embeds: [guideEmbed] });

            bot_update = {
                auction_cat: details[0],
                comm_channel: details[1],
                tx_channel: details[2],
                setup_complete: true
            }

            await db.collection(BOT_COL_NAME).updateOne({ _id: clientId }, { '$set': bot_update });

            // setup client.config like in index.js
            guild.client.config.auction_cat = bot_update.auction_cat
            guild.client.config.comm_channel = bot_update.comm_channel
            guild.client.config.tx_channel = bot_update.tx_channel

            // run deploy commands script
            const commands = [];
            const commandsPath = path.join(__dirname, '..', 'slash-commands');
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                commands.push(command.data.toJSON());
            }

            const rest = new REST({ version: '9' }).setToken(bot_details.token);

            try {
                await rest.put(Routes.applicationGuildCommands(bot_details._id, bot_details.guild), { body: commands })
                console.log(`Successfully registered application commands for client: ${bot_details._id} in server: ${bot_details.guild}`)
            } catch (e) {
                console.log(e);
            }

        } catch (e) {
            console.error('Setup process failed: ', e);
            if (dmChannel) {
                await dmChannel.send('Unfortunately it seems like my setup failed. Please contact zing#0908 for assistance');
            }
        }
    },
};