const { SlashCommandBuilder } = require('@discordjs/builders');
const { handle_timer_setup } = require('../timers');
const { AUCTION_COL_NAME } = require('../config');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { toCustomStringDate } = require('../util');
const db = require('../mongo').db();
const { ValidationError } = require('../errors')


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
			option.setName('image-url').setDescription('Image to display on the auction (Optional)').setRequired(false))
		.addStringOption(option =>
			option.setName('description').setDescription('Description of the NFT being auctioned (Optional)').setRequired(false))
		.addStringOption(option =>
			option.setName('nft-link').setDescription('Link to the NFT (Optional)').setRequired(false))
		.addStringOption(option =>
			option.setName('payment-addr').setDescription('Address payment will be made to (Optional)').setRequired(false)),

	async execute(interaction) {

		console.log(interaction.client.application.id + ': /create');

		await interaction.deferReply();

		try {
			auc_name = interaction.options.getString('name');
			existing_channel = interaction.guild.channels.cache.find(channel => channel.name == auc_name);
			auction_cat = interaction.guild.channels.cache.get(interaction.client.config.auction_cat);
			start = interaction.options.get('start-time').value
			end = interaction.options.get('end-time').value

			description = interaction.options.get('description') ? interaction.options.get('description').value : null;
			nftLink = interaction.options.get('nft-link') ? interaction.options.get('nft-link').value : null;
			paymentAddr = interaction.options.get('payment-addr') ? interaction.options.get('payment-addr').value : null;

			const re = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/

			if (interaction.channelId != interaction.client.config.comm_channel)
				throw new ValidationError("Can't do that here")

			if ([start, end].map(str => re.test(str)).includes(false)) {
				throw new ValidationError("Those dates don't look right. Please use format: yyyy-MM-dd HH:mm:ss");
			}

			try {
				start = new Date(start + ' UTC').getTime();
				end = new Date(end + ' UTC').getTime();
			} catch (e) {
				throw new ValidationError("I couldn't parse those dates. Please use format: yyyy-MM-dd HH:mm:ss");
			}

			if (start < Date.now())
				throw new ValidationError("Start date must be in future");

			if (end < start)
				throw new ValidationError("End date must be after start date");

			if (existing_channel)
				throw new ValidationError("Channel already exists");

			if (!auction_cat)
				throw new ValidationError("Can't find the auctions category");

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
				'start': start,
				'end': end,
				// 'start': Date.now() + 10000,
				// 'end': Date.now() + 45000,
				'highBid': interaction.options.get('price').value,
				'highBidId': 'none',
				'highBidName': 'none',
				'active': false,
				'bids': 0,
				'client_owner': interaction.client.application.id,
				'guild': interaction.guildId
			}

			if (interaction.options.get('image-url'))
				auction.url = interaction.options.get('image-url').value

			await db.collection(AUCTION_COL_NAME).insertOne(auction);

			interaction.client.auctions.push(auction);
			interaction.client.auctionIds.push(auction._id);

			console.log(interaction.client.application.id + ': created auction for ' + auc_name);

			handle_timer_setup(auction, interaction.client);

			const fields = [
				{ name: 'Starting price:', value: auction.price + 'ADA', inline: true },
				{ name: 'Increment:', value: auction.increment + 'ADA', inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },
				{ name: 'Start time (UTC)', value: toCustomStringDate(new Date(auction.start)), inline: true },
				{ name: 'End time (UTC)', value: toCustomStringDate(new Date(auction.end)), inline: true },
				{ name: '\u200B', value: '\u200B', inline: false },

				...(paymentAddr ? [{ name: 'Payment address:', value: paymentAddr, inline: true }] : []),

				{ name: 'How to participate:', value: '/bid', inline: false },
			]

			let row;

			if (nftLink) {

				row = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setLabel('View the asset here!')
							.setURL(nftLink)
							.setStyle('LINK')
					);
			}

			const auctionEmbed = new MessageEmbed()
				.setColor('0xfdbf2f')
				.setTitle('Auction - ' + auction.name)
				.setDescription('A new auction has been created for ' + auction.name + `${description ? '\n\n' + description : ''}`)
				.addFields(fields)
				.setImage(auction.url)
				.setTimestamp()
				.setFooter({ text: 'Goodluck!' });

			if (row){
				await auction_channel.send({ embeds: [auctionEmbed], components: [row]  });
			} else {
				await auction_channel.send({ embeds: [auctionEmbed] });
			}

			return await interaction.editReply('Auction created');

		} catch (e) {
			if (e instanceof ValidationError) {
				return await interaction.editReply({ content: e.message, ephemeral: true });
			} else {
				console.error(e);
				return await interaction.editReply('Failed to execute this command');
			}
		}
	},
};