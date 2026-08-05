const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica a latencia do bot.'),

  cooldown: 5,

  async execute(interaction) {
    const embed = infoEmbed(
      `Pong! Latencia da API: **${Math.round(interaction.client.ws.ping)}ms**.`,
      'Status do bot'
    );

    await interaction.reply({ embeds: [embed] });
  }
};
