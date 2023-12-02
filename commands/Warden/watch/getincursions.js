const { botIdent } = require('../../../functions.js');
const db = require(`../../../${botIdent().activeBot.botName}/db/index`);
const Discord = require("discord.js");

function getPresence(presence) {
    switch (presence) {
        case 0:
            return "Cleared <:tharg_g:417424014525333506>"
        case 1:
            return "Marginal <:tharg_r:417424014861008907>"
        case 2:
            return "Moderate <:tharg_r:417424014861008907>"
        case 3:
            return "Significant <:tharg_r:417424014861008907>"
        case 4:
            return "Massive <:tharg_r:417424014861008907>"
    }
}

module.exports = {
    data: new Discord.SlashCommandBuilder()
	.setName('incursions')
	.setDescription('Get a list of active incursion systems'),
	permissions: 0,
	async execute(interaction) {
		try {
            let res = await db.query(`SELECT * FROM systems WHERE status = 'true'`)
            let data = res.rows

            // Check if exists
            if (res.rowCount === 0) {
                interaction.reply({ content: `Sorry, there are no incursions to report at this time.`})
                return;
            }

            const returnEmbed = new Discord.EmbedBuilder()
            .setColor('#FF7100')
            .setTitle("**Active Incursions**")
            

            let presence;
            let presencelist = "List of active Thargoid incursions.\n\n";

            for (let i = 1; i <= 3; i++) {
                let prioritySystem = data.find(system => system.priority === i)
                presence = getPresence(prioritySystem.presence)
                presencelist += `${prioritySystem.name} - ${presence} - **#${prioritySystem.priority}**\n`
            }

            for (let system of data) {
                if (system.priority === null) {
                    presence = getPresence(system.presence)
                    presencelist += `${system.name} - ${presence}\n`
                }
            }
            returnEmbed.setDescription(`${presencelist}`)

            const buttonRow = new Discord.ActionRowBuilder()
            .addComponents(new Discord.ButtonBuilder().setLabel('Go to the Thargoid.watch Website').setStyle(Discord.ButtonStyle.Link).setURL('https://www.thargoid.watch/'),)
            
            interaction.reply({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] });

		} catch (err) {
            console.log(err)
			interaction.channel.send({ content: "Something went wrong, please ensure you have entered the correct format." })
		}        
	},
};
