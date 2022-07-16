require('dotenv').config()

const fs = require('node:fs');
const path = require('node:path');

const mongo = require('./mongo');

const { Client, Intents, Collection } = require('discord.js');

const { BOT_COL_NAME } = require('./config');

let clients = {};

(async () => {

	try {
		await mongo.connect();
	} catch (error) {
		process.exit() //for now
	}

	const db = mongo.db();

	let bots = db.collection(BOT_COL_NAME);
	let botsArr = await bots.find({}).toArray();

	console.log(botsArr);

	for (let i = 0; i < botsArr.length; i++) {

		clients[botsArr[i]._id] = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

		clients[botsArr[i]._id].config = {
			auction_cat : botsArr[i].auction_cat,
			tx_channel : botsArr[i].tx_channel,
			comm_channel : botsArr[i].comm_channel
		}

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

		console.log('Logging in client: ', botsArr[i]._id);

		clients[botsArr[i]._id].login(botsArr[i].token);

	}

})();

