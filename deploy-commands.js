require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const mongo = require('./mongo');
const { BOT_COL_NAME } = require('./config');

(async () => {

	try {
		await mongo.connect();
	} catch (error) {
		process.exit() //for now
	}

	const db = mongo.db();

	let bots = db.collection(BOT_COL_NAME);
	let botsArr = await bots.find({}).toArray();

	console.log('Found bots:', botsArr);

	for (let i = 0; i < botsArr.length; i++) {

		const commands = [];
		const commandsPath = path.join(__dirname, 'slash-commands');
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			commands.push(command.data.toJSON());
		}

		const rest = new REST({ version: '9' }).setToken(botsArr[i].token);

		try {
			await rest.put(Routes.applicationGuildCommands(botsArr[i]._id, botsArr[i].guild), { body: commands });
			console.log('Successfully registered application commands for client: ', botsArr[i]._id);
		} catch (e){
			console.error(e);
		}
	}

	process.exit();

})();





