require('dotenv').config()
const { BOT_COL_NAME, AUCTION_COL_NAME, FRONTEND_URI } = require('./config');


const { Client, Intents, Collection } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');

const mongo = require('./mongo');
const { Console } = require('node:console');

let clients = {};

(async () => {

	try {
		await mongo.connect();
	} catch (error) {
		process.exit() //for now
	}
	
	const db = mongo.db();
	
	const { handle_timer_setup } = require('./timers');


	let bots = db.collection(BOT_COL_NAME);
	let auctions = db.collection(AUCTION_COL_NAME);

	let botsArr = await bots.find({}).toArray();
	let auctionsArr = await auctions.find({}).toArray();

	console.log('Found bots:', botsArr);

	for (let i = 0; i < botsArr.length; i++) {

		clients[botsArr[i]._id] = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES ] });

		clients[botsArr[i]._id].config = {
			uri: botsArr[i].custom_domain || FRONTEND_URI,
			functionality: botsArr[i].functionality
		}

		clients[botsArr[i]._id].commands = new Collection();

		const commandsPath = path.join(__dirname, 'slash-commands');
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);

			if (botsArr[i].functionality.commands.map(c => c.name).includes(command.data.name)) {
				clients[botsArr[i]._id].commands.set(command.data.name, command);
			}
		}

		const eventsPath = path.join(__dirname, 'events');
		const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

		for (const file of eventFiles) {
			const filePath = path.join(eventsPath, file);
			const event = require(filePath);
			if (event.once) {
				clients[botsArr[i]._id].once(event.name, (...args) => event.execute(...args));
			} else {
				clients[botsArr[i]._id].on(event.name, (...args) => event.execute(...args));
			}
		}

		console.log('Logging in client: ', botsArr[i]._id);

		await clients[botsArr[i]._id].login(botsArr[i].token);

		if(botsArr[i].functionality.intents.includes('auctions')){
			try {
				clients[botsArr[i]._id].config = {
					...clients[botsArr[i]._id].config,
					auction_cat: botsArr[i].auction_cat,
					tx_channel: botsArr[i].tx_channel,
					comm_channel: botsArr[i].comm_channel
				};
				
				clients[botsArr[i]._id].auctions = auctionsArr.filter((auction) => auction.client_owner == botsArr[i]._id);
				
				clients[botsArr[i]._id].auctionIds = auctionsArr.filter((auction) => auction.client_owner == botsArr[i]._id)
				.map((auction) => auction._id);
				
				console.log(`Found auctions for ${botsArr[i]._id}:`, clients[botsArr[i]._id].auctionIds);

				for (let j = 0; j < clients[botsArr[i]._id].auctions.length; j++) {
					handle_timer_setup(clients[botsArr[i]._id].auctions[j], clients[botsArr[i]._id]);
				}

			} catch (e) {
				Console.error(`Encountered error trying to assign auction information for bot: ${botsArr[i]._id}. Error: `, e);
			}
		}

	}

})();

