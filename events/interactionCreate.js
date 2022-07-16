module.exports = {
	name: 'interactionCreate',
	async execute(ctx) {
        if (!ctx.isCommand()) return;

        const command = ctx.client.commands.get(ctx.commandName);
    
        if (!command) return;
    
        try {
            await command.execute(ctx);
        } catch (error) {
            console.error(error);
            await ctx.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
	},
};