require('dotenv').config()
const { BOT_COL_NAME, AUCTION_COL_NAME } = require('./config');

const { Client, Intents, Collection } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');

const mongo = require('./mongo');

let clients = {};

(async () => {

	try {
		await mongo.connect();
	} catch (error) {
		process.exit() //for now
	}

	const db = mongo.db();

	const { handle_auction_start } = require('./handlers');

	let bots = db.collection(BOT_COL_NAME);
	let auctions = db.collection(AUCTION_COL_NAME);

	let botsArr = await bots.find({}).toArray();
	let auctionsArr = await auctions.find({}).toArray();

	console.log(botsArr);

	for (let i = 0; i < botsArr.length; i++) {

		clients[botsArr[i]._id] = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

		clients[botsArr[i]._id].config = {
			auction_cat: botsArr[i].auction_cat,
			tx_channel: botsArr[i].tx_channel,
			comm_channel: botsArr[i].comm_channel
		};

		clients[botsArr[i]._id].auctions = auctionsArr.filter((auction) => auction.client_owner == botsArr[i]._id);

		clients[botsArr[i]._id].auctionIds = auctionsArr.filter((auction) => auction.client_owner == botsArr[i]._id)
			.map((auction) => auction._id);

		console.log('auctions: ', clients[botsArr[i]._id].auctionIds);

		clients[botsArr[i]._id].commands = new Collection();

		const commandsPath = path.join(__dirname, 'slash-commands');
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			clients[botsArr[i]._id].commands.set(command.data.name, command);
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

		for (let j = 0; j < clients[botsArr[i]._id].auctions.length; j++) {

			const start_diff = clients[botsArr[i]._id].auctions[j].start - new Date();
			//add end diff

			//need to make sure that start and end are in future
			
			// setTimeout(() => handle_auction_start(clients[botsArr[i]._id].auctions[j], clients[botsArr[i]._id]), diff);
			setTimeout(() => handle_auction_start(clients[botsArr[i]._id].auctions[j], clients[botsArr[i]._id]), 5000); //hardcode for dev

		}

		console.log('Logging in client: ', botsArr[i]._id);

		clients[botsArr[i]._id].login(botsArr[i].token);

	}

})();

