const { SlashCommandBuilder } = require('@discordjs/builders');
const { handle_timer_setup } = require('../timers');
const { AUCTION_COL_NAME } = require('../config');
const db = require('../mongo').db();


module.exports = {
	data: new SlashCommandBuilder()
		.setName('create')
		.setDescription('Creates an auction')
		.addStringOption(option =>
			option.setName('name').setDescription('The name of the auction').setRequired(true))
		.addIntegerOption(option =>
			option.setName('price').setDescription('The starting price the auction').setRequired(true))
		.addIntegerOption(option =>
			option.setName('increment').setDescription('The increment for the auction').setRequired(true))
		.addStringOption(option =>
			option.setName('start-time').setDescription('The start of the auction (UTC)').setRequired(true))
		.addStringOption(option =>
			option.setName('end-time').setDescription('The end of the auction (UTC)').setRequired(true))
		.addStringOption(option =>
			option.setName('image-url').setDescription('Image to display on the auction (Optional)').setRequired(false)),

	async execute(interaction) {
		try {
			console.log('create');

			if (interaction.channelId != interaction.client.config.comm_channel)
				return await interaction.reply({ content: "Can't do that here", ephemeral: true });

			const re = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/
			if ([interaction.options.get('start-time').value, interaction.options.get('end-time').value]
				.map(str => re.test(str)).includes(false)) {
				return await interaction.reply(
					{
						content: "Those dates don't look right. Please send them in the following format: yyyy-MM-dd HH:mm:ss",
						ephemeral: true
					});
			}

			//TODO: check start and end are in future

			//TODO:  check end is after start 

			auc_name = interaction.options.getString('name');

			existing_channel = interaction.guild.channels.cache.find(channel => channel.name == auc_name);

			if (existing_channel)
				return await interaction.reply({ content: "Channel already exists", ephemeral: true });

			auction_cat = interaction.guild.channels.cache.get(interaction.client.config.auction_cat);

			if (!auction_cat)
				return await interaction.reply({ content: "Can't find the auctions category", ephemeral: true });

			auction_channel = await interaction.guild.channels.create(auc_name, {
				type: 'GuildText'
			});

			await auction_channel.setParent(auction_cat);

			await interaction.guild.channels.fetch();

			auction = {
				'_id': auction_channel.id,
				'name': auc_name,
				'price': interaction.options.get('price').value,
				'increment': interaction.options.get('increment').value,
				'start': Date.parse(interaction.options.get('start-time').value + ' UTC'),
				'end': Date.parse(interaction.options.get('end-time').value + ' UTC'),
				'highBid': interaction.options.get('price').value,
				'highBidId': null,
				'highBidName': null,
				'active': false,
				'bids': 0,
				'client_owner': interaction.client.application.id,
				'guild': interaction.guildId
			}

			await db.collection(AUCTION_COL_NAME).insertOne(auction);

			interaction.client.auctions.push(auction);
			interaction.client.auctionIds.push(auction._id);

			await auction_channel.send(`Welcome to the new auction for ${auc_name}!`);

			console.log('created auction for', auc_name);

			handle_timer_setup(auction, interaction.client);

			return await interaction.reply('Auction created');

		} catch (e) {

			// try remove auction traces
			// client object, db, timers, etc
			// try {

			// } catch (e) {

			// }

			console.error(e);
			return await interaction.reply('Failed to execute this command');
		}
	},
};