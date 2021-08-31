const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(`piggo`)
    .setDescription(`Summons the not so holy piggo`)
    .setDefaultPermission(false),
    permissions: 1,
    execute (interaction) {
        interaction.reply({ content: `You summoneth the piggo! <@352201261971668992>` });
        interaction.channel.send({ content: "https://tenor.com/view/waddles-pig-blink-gravity-falls-animal-gif-17396160" });
    }
}
