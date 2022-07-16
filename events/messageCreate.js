const { MESSAGE_COMMAND_PREFIX } = require('../config')

module.exports = {
	name: 'messageCreate',
	async execute(message) {
        console.log('received')

        if (message.author.bot) return
        if (!message.content.startsWith(MESSAGE_COMMAND_PREFIX)) return

        console.log('valid');

        const args = message.content.slice(MESSAGE_COMMAND_PREFIX.length).trim().split(/ +/)
        const command = args.shift().toLowerCase()

        message.reply(command);
	},
};