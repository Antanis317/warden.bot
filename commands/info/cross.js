const Discord = require("discord.js");
const { cleanString } = require("../../discord/cleanString");
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('cross')
	.setDescription('How many people with rank1 also have rank2?')
	.addRoleOption(option => option.setName('first-rank')
		.setDescription('First Rank')
		.setRequired(true))
	.addRoleOption(option => option.setName('second-rank')
		.setDescription('Second Rank')
		.setRequired(true)),
	usage: '"role1" "role2"',
	permlvl: 0, // 0 = Everyone, 1 = Mentor, 2 = Staff
	args: true,
	execute(message) {
		try {
			let count = 0
			const returnEmbed = new Discord.MessageEmbed()
			.setColor('#FF7100')
            .setAuthor('The Anti-Xeno Initiative', "https://cdn.discordapp.com/attachments/860453324959645726/865330887213842482/AXI_Insignia_Hypen_512.png")
            .setTitle("**Count**")
			let actualrole1 = ""
			let actualrole2 = ""
			let memberwithrole1 = null
			try
			{
				let roleID = message.options.data[0].value
				memberwithrole1 = message.guild.roles.cache.get(roleID).members
				actualrole1 = cleanString(message.guild.roles.cache.find(role => role.id == roleID).name)
			}
			catch(TypeError)
			{
				throw("Role 1 may have errors, please check and retry.")
			}
			let memberwithrole2 = null
			try
			{
				let roleID = message.options.data[1].value
				memberwithrole2 = message.guild.roles.cache.get(roleID).members
				actualrole2 = cleanString(message.guild.roles.cache.find(role => role.id == roleID).name)
			}
			catch(TypeError)
			{
				throw("Role 2 may have errors, please check and retry.")
			}
			let countrole1 = memberwithrole1.size
			let countrole2 = memberwithrole2.size
			memberwithrole1.map( m => {
				memberwithrole2.map( n =>{
					if(m.user.username == n.user.username)
					{
						count+=1
					}
				})
			})
			returnEmbed.addField("Members with rank " + actualrole1,"```" + countrole1 + "```",true)
			returnEmbed.addField("Members with rank " + actualrole2,"```" + countrole2 + "```",true)
			returnEmbed.addField("Members with rank " + actualrole1 + " having rank " + actualrole2, "```" + count + "```")
			message.reply({ embeds: [returnEmbed.setTimestamp()] });
		} catch(err) {
			console.error(err);
			message.reply({ content: `ERROR! Something went wrong:\n${err}` })
		}
	},
};
