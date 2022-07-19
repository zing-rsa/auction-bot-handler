const db = require('../mongo').db();
const { BOT_COL_NAME } = require('../config')
const path = require('node:path');
const fs = require('node:fs');

const { MessageEmbed } = require('discord.js');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const refresh_bot_commands = async (bot) => {
    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'slash-commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '9' }).setToken(bot.token);

    try {
        await rest.put(Routes.applicationGuildCommands(bot._id, bot.guild), { body: commands })
        console.log(`Successfully registered application commands for client: ${bot._id} in server: ${bot.guild}`)
    } catch (e) {
        console.log(e);
    }
}

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
                refresh_bot_commands(bot_details);
                return
            }

            let guideHeader = [
                'Thanks for adding me!',
                'Great!',
                'Nice.',
                'Setup is complete!'
            ]

            let guideBody = [
                `Lets get you setup. It'll take 3 steps.\n
To start off, please create me a new \`category\` in your server. This category will be 
where all your auction channels are posted. It can be anywhere, and you can name it
anything you'd like, but \`please make sure that I have access to it\`.\n 
Once you're done, please [copy the ID](https://turbofuture.com/internet/Discord-Channel-ID) of the category and send it to me here.`,

                `Next create a \`channel\` that you will use to run admin commands for auctions 
(create, end, etc.). It's a good idea to make this private, but \`please make 
sure I have access to it\`.\n
Once you're ready, please send me the ID of the channel here.`,

                `The final step is the history channel. Create a private channel and I'll log the info of your auctions as they end. One last time - \`please give me access\`.\n
Once you're done please send that ID here.`,

                `You can now go to your auction commands channel and get 
started with /create. If you have any questions, please message my dad - zing#0908`
            ];

            let guideExpectedTypes = [
                'GUILD_CATEGORY',
                'GUILD_TEXT',
                'GUILD_TEXT'
            ]

            details = []

            log = await guild.fetchAuditLogs({ type: "BOT_ADD", limit: 1 });
            dmChannel = await log.entries.first().executor.createDM();

            for (let i = 0; i < 3; i++) {

                step_complete = false;
                retries_left = 5;

                guideEmbed = new MessageEmbed()
                    .setColor('0x00a113')
                    .setTitle(guideHeader[i])
                    .setDescription(guideBody[i])
                    .setTimestamp()

                await dmChannel.send({ embeds: [guideEmbed] });

                while (!step_complete) {

                    if (retries_left == 0) {
                        throw new Error('Could not complete setup: Max retries reached');
                    }

                    try {

                        message = (await dmChannel.awaitMessages({ max: 1 })).first();

                        channelId = message.content;

                        await guild.channels.fetch();

                        channel = guild.channels.cache.get(channelId);

                        if (channel.type != guideExpectedTypes[i]) {
                            throw new Error(`Didn't receive expected type`);
                        }

                        if (i == 0) {
                            if (!channel) {
                                throw new Error("Couldn't find category");
                            }
                        }

                        if (i == 1) {
                            commandChannelEmbed = new MessageEmbed()
                                .setColor('0x00a113')
                                .setTitle('Your auction commands channel:')
                                .setDescription(`This will be where you manage your auctions.
You are able to run two commands here:

\`/create\`: will generate a new auction with supplied parameters. 
Please note: dates should be in \`UTC\` and should be in format: \`yyyy-MM-dd HH:mm:ss\`. You have the option to include an image with the optional image-url tag, this should be a url to any publicly accessible image on the web.

\`/end\`: will end an auction when supplied with the channelID of the auction. 
Note that if you would like to cancel an auction before it has started, you can simply delete the channel - /end should only be required if you need to manually end an active auction before the specified end time, while preserving the bids. Once an auction ends I stop tracking the channel and it can be handled however you please.

Note the above commands are scoped only to this channel and will be ignored if run anywhere else. Once an auction begins, your users will be able to interact within the auction channel by running two commands: 

\`/bid\`: will allow them to bid a valid amount, while the auction is active. 

\`/price\`: will display the current price(useful if a lengthy chat has ensued since the last bid).
    
That is all, happy auctioning!`)
                                .setTimestamp()

                            await channel.send({ embeds: [commandChannelEmbed] });
                        }

                        if (i == 2) {
                            historyChannelEmbed = new MessageEmbed()
                                .setColor('0x00a113')
                                .setTitle('Your auction history channel:')
                                .setDescription(`I will update this channel with auction details after they end.`)
                                .setTimestamp()

                            await channel.send({ embeds: [historyChannelEmbed] });
                        }

                        details[i] = channelId;

                        step_complete = true;

                    } catch (e) {
                        retries_left--;
                        guideEmbed = new MessageEmbed()
                            .setColor('0xfdbf2f')
                            .setTitle('Oops!')
                            .setDescription(`I had trouble with that ID. Possible causes are: 
- I don't have access to view the channel/category
- It's not a valid ID
- It's not what I'm expecting(eg. I asked for a category but you sent a channel or vice versa)\n
Please try again.`          )
                            .setTimestamp()

                        await dmChannel.send({ embeds: [guideEmbed] });
                    }
                }
            }

            guideEmbed = new MessageEmbed()
                .setColor('0x00a113')
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

            refresh_bot_commands(bot_details);

            guild.client.config.auction_cat = bot_update.auction_cat
            guild.client.config.comm_channel = bot_update.comm_channel
            guild.client.config.tx_channel = bot_update.tx_channel

            await db.collection(BOT_COL_NAME).updateOne({ _id: clientId }, { '$set': bot_update });

            console.log(`Updated db entry for bot:`, clientId)

        } catch (e) {
            console.error('Setup process failed: ', e);
            if (dmChannel) {
                await dmChannel.send('Unfortunately it seems like my setup failed. Please contact zing#0908 for assistance');
            }
        }
    },
};