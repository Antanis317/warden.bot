const Discord = require("discord.js");
const { botIdent, eventTimeCreate } = require('../../../functions')
const objectives = require('./opord_values.json')

let voiceChans = []

function fillVoiceChan(interaction) {
    const guild = interaction.client.guilds.cache.get(process.env.GUILDID);
    const voiceChansSet = new Set();

    if (guild) {
        const voiceChannels = guild.channels.cache.filter(chan => chan.type === 2); 

        voiceChannels.forEach(channel => {
            voiceChansSet.add({ name: channel.name, id: channel.id });
        });
    }
    voiceChans = Array.from(voiceChansSet); 
}
module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('opord')
        .setDescription('Create an Operation Order')
        .addStringOption(option =>
            option.setName('operation_name')
                .setDescription('Give this OPORD a Name.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('mission_statement')
                .setDescription('Give the reason for the Operation Order.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('date_time')
                .setDescription('Enter your local date and time.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('wing_size')
                .setDescription('Select a wing size or enter a custom one.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('meetup_point')
                .setDescription('Enter meetup location.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('weapons_required')
                .setDescription('Entered required weapons, if any.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('modules_required')
                .setDescription('Enter required modules, if any.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('prefered_build')
                .setDescription('Enter a short URL of EDSY recommended build.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('objective_a')
                .setDescription('Enter the mission completion requirements for Objective A.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('objective_b')
                .setDescription('Enter the mission completion requirements for Objective B.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('objective_c')
                .setDescription('Enter the mission completion requirements for Objective C.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('voice_channel')
                .setDescription('Enter the voice channel to host this event.')
                .setRequired(true)
                .setAutocomplete(true)
        ),
	async autocomplete(interaction) {
        fillVoiceChan(interaction)

		const focusedOption = interaction.options.getFocused(true);
		let choices;

        if (focusedOption.name === 'wing_size') {
			choices = objectives.wing_sizes
		}
        if (focusedOption.name === 'voice_channel') {
            choices = voiceChans.map(i=>i.name)
		}

		const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
    permissions: 0,
    async execute(interaction) {
        await interaction.reply({
            content: 'Operation Order Request Error Checking. If its error free it will await approval.',
            components: [],
            ephemeral: true
        });
        let requestingPlayer = { username: interaction.user.username, memberName: interaction.member.nickname }
        let strikePackage = interaction.options._hoistedOptions
        let timeSlot = eventTimeCreate(strikePackage.find(i=>i.name === 'date_time').value)
        let response = null;
        let returnEmbed = null;
        const channel = interaction.guild.channels.cache.get(process.env.LOGCHANNEL); //logchannel or other.

        async function gimmeModal(i,interaction,returnEmbed) {

                const fields = {
                    time: new Discord.TextInputBuilder()
                        .setCustomId(`time`)
                        .setLabel(`Input the correct time: IE. 01/JAN/24+1325`)
                        .setStyle(Discord.TextInputStyle.Short)
                        .setRequired(true)
                        .setPlaceholder(`05/MAY/24+1200`)
                }
                
                const modal = new Discord.ModalBuilder()
                .setCustomId('myModal')
                .setTitle('My Modal')
                .addComponents(
                    new Discord.ActionRowBuilder().addComponents(fields.time),
                )
                await i.showModal(modal);
                const submitted = await i.awaitModalSubmit({
                    time: 60000,

                    // filter: i => i.user.id === interaction.user.id,
                }).catch(error => {

                    console.error(error)
                    return null
                })
        
                if (submitted) {
                    const [ time ] = submitted.fields.fields.map(i=>i.value)
                    return [submitted,time]
                    
                }
        }

        //Bad Timeslot
        if (typeof timeSlot != "number" || timeSlot.toString().length < 13 || Date.now() > timeSlot) { 
            returnEmbed = new Discord.EmbedBuilder()
                .setTitle('Operation Order Request')
                .setAuthor({name: interaction.member.nickname, iconURL: interaction.user.displayAvatarURL({dynamic:true})})
                .setThumbnail(botIdent().activeBot.icon)
                .setColor('#FD0E35')
                .setDescription(`**Malformed Time Format!*`)
                .addFields(
                    { name: "Malformed Value:", value: strikePackage.find(i=>i.name === 'date_time').value },
                    { name: "Correct Syntax:", value: "01/JAN/24+1800" },
                    { name: "Correction:", value: "Would you like to correct this time?" }
                )
            const buttonRow = new Discord.ActionRowBuilder()
                .addComponents(new Discord.ButtonBuilder().setLabel('Yes').setCustomId('Yes').setStyle(Discord.ButtonStyle.Success))
                .addComponents(new Discord.ButtonBuilder().setLabel('Cancel Submission').setCustomId('No').setStyle(Discord.ButtonStyle.Danger))
            response = await interaction.followUp({ content: `Error Discovered`, embeds: [returnEmbed.setTimestamp()], components: [buttonRow], ephemeral: true }).catch(console.error);
            const collector = response.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, time: 3_600_000 });
            collector.on('collect', async i => {
                const selection = i.customId;
                collector.stop()
                if (selection == 'Yes') {

                    //maybe use a while loop around line 140 instead of this crap below????

                    const modalResults = await gimmeModal(i,interaction,returnEmbed)
                    timeSlot = eventTimeCreate(modalResults[1]) //returns 13 digit timestamp
                    if (typeof timeSlot != "number" || timeSlot.toString().length < 13 || Date.now() > timeSlot) { 
                        await modalResults[0].reply({
                            content: `Not within Standard. Submission Cancelled. Try again.`,
                            embeds: [],
                            components: [],
                            ephemeral: true
                        })
                    }
                    else {
                        await modalResults[0].reply({
                            content: `Time Updated. Awaiting Approval.`,
                            embeds: [],
                            components: [],
                            ephemeral: true
                        })
                        const newTime = modalResults[1]
                        publishRequest(newTime)
                        //modal was good call publishRequest with new time value
                    }

                }
                else {
                    await i.update({ content: 'Operation Order Submission Cancelled', components: [], embeds: [returnEmbed.setColor('#FD0E35')], ephemeral: true }).catch(console.error);
                    //cancel the submission
                    //cancel the submission
                    //cancel the submission
                    //cancel the submission
                }
            });
        }
        else { publishRequest() }
        
        async function publishRequest(newTime){
            //Good Timeslot
            returnEmbed = new Discord.EmbedBuilder()
                .setTitle('Operation Order Request')
                .setAuthor({name: interaction.member.nickname, iconURL: interaction.user.displayAvatarURL({dynamic:true})})
                .setThumbnail(botIdent().activeBot.icon)
                .setColor('#FAFA37') //87FF2A
                .setDescription(`A request for a Operation has been submitted. This will require approval. Review the contents and then select Approve or Deny`)
            interaction.options._hoistedOptions.forEach((i,index) =>{
                let properName = null;
                properName = objectives.stringNames.find(x=>x.name === i.name)
                if (newTime && properName.name == 'date_time') {
                    returnEmbed.addFields({ name: properName.string_name, value: newTime, inline: properName.inline })
                }
                else {
                    returnEmbed.addFields({ name: properName.string_name, value: i.value, inline: properName.inline })
                }
            })
            const buttonRow = new Discord.ActionRowBuilder()
                .addComponents(new Discord.ButtonBuilder().setLabel('Approve').setCustomId('Approve').setStyle(Discord.ButtonStyle.Success))
                .addComponents(new Discord.ButtonBuilder().setLabel('Deny').setCustomId('Deny').setStyle(Discord.ButtonStyle.Danger))
            response = await channel.send({ embeds: [returnEmbed.setTimestamp()], components: [buttonRow] }).catch(console.error);
            const collector = response.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, time: 345_600_000  });
            collector.on('collect', async i => {
                const selection = i.customId;
                collector.stop()
                if (selection == 'Approve') {
                    createEvent(interaction)
                    await i.update({ content: 'Operation Order Approved', components: [], embeds: [returnEmbed.setColor('#87FF2A')], ephemeral: true }).catch(console.error);
                }
                else {
                    await i.update({ content: 'Operation Order Disapproved', components: [], embeds: [returnEmbed.setColor('#FD0E35')], ephemeral: true }).catch(console.error);
                }
            });
        }
        
        
        async function createEvent(interaction){
            try {
                const guild = interaction.client.guilds.cache.get(process.env.guildID)
                if (!guild)  return console.log('Guild not found');
                if (voiceChans.length == 0) { fillVoiceChan(interaction) }
                const channelName = strikePackage.find(i=>i.name === 'voice_channel').value
                const selectedChannelId = voiceChans.map(i=>i).find(i=>i.name === channelName).id

                const event_manager = new Discord.GuildScheduledEventManager(guild);
                await event_manager.create({
                    name: strikePackage.find(i=>i.name === 'operation_name').value,
                    scheduledStartTime: timeSlot,
                    privacyLevel: 2,
                    entityType: 2,
                    channel: selectedChannelId,
                    // description: strikePackage.find(i=>i.name === 'mission_statement').value,
                    // reason: strikePackage.find(i=>i.name === 'mission_statement').value,
                });
            }
            catch (e) {
                console.log(e)
            }
        }
    } 
};