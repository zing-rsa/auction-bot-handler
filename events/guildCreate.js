const db = require('..mongo').db();
const { BOT_COL_NAME } = require('../config')

module.exports = {
    name: 'guildCreate',
    once: true,
    async execute(guild) {

        try {

            clientId = guild.client.application.id

            console.log(`Bot ${clientId} added to server: ${guild.id} (${guild.name})`)

            // fetch bot
            bot_details = await db.collection(BOT_COL_NAME).findOne({ _id: clientId });

            if (bot_details.setup_complete == true) {
                console.log(`Setup is already complete for bot ${clientId} on server ${guild.id} (${guild.name})`);
                return
            }

            // check for setup: complete flag

            // make sure guild is same as guild in mongo
            // this should prevent anyone from adding the bot and getting to do setup

            let guideText = [
                `Lets get you setup. There are 3 steps:
1. Create an auctions category 
2. Create a commands channel
3. Create a history channel.

(I'm assuming you don't have these, if you 
have existing channels you'd like to use, feel free use those in the following setup)
            
To start off, please create me a new category. This catergory will be 
where all your auctions channels are posted. It can be anywhere, and 
you can name it anything you'd like, just please make sure that I have access to it. 
Once you're done, please send the ID of the category to me below.`,

                `Great! Next create a channel that you will use to run admin commands for auctions 
(create, end, etc.). It's a good idea to make this private, but once again please make 
sure I have access to it. Once you're ready, please send me the ID of the channel below.`,

                `Nice. Last is the history channel. Same deal as above. I will log info in this 
channel when auctions end. Please send me it's channel ID next.`,

                `Great. Setup is complete! You can now go to your auction commands channel and get 
started with /create. If you have any questions, please message my dad - zing#0908`
            ];

            details = []

            log = await guild.fetchAuditLogs({ type: "BOT_ADD", limit: 1 });
            dmChannel = await log.entries.first().executor.createDM();
            await dmChannel.send(`Thank you for adding me to ${guild.name}!`);

            for (let index = 0; index < 4; index++) {
                await dmChannel.send(guideText[i]);

                message = (await dmChannel.awaitMessages({ max: 1 })).first();

                details[i] = message.content;
            }

            bot_update = {
                auction_cat: details[0],
                comm_channel: details[1],
                tx_channel: details[3],
                setup_complete: true
            }

            await db.collection(BOT_COL_NAME).update({ _id: clientId }, { '$set': bot_update });

            // setup client.config like in index.js
            guild.client.auction_cat = bot_update.auction_cat
            guild.client.comm_channel = bot_update.comm_channel
            guild.client.tx_channel = bot_update.tx_channel

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
        }
    },
};