const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");

const { getGuildConfig, updateGuildConfig } = require("../../services/config");
const config = require("../../config/config");
const { createEmbed } = require("../../utils/theme");

const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Configura e publica o painel de tickets")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("painel")
      .setDescription("Envia o painel com botao para abrir ticket")
      .addChannelOption((option) =>
        option
          .setName("canal")
          .setDescription("Canal onde o painel sera enviado")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("logs")
      .setDescription("Define o canal que recebera os logs dos tickets")
      .addChannelOption((option) =>
        option
          .setName("canal")
          .setDescription("Canal de logs dos tickets")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("ver")
      .setDescription("Mostra a configuracao atual dos tickets")
  );

async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "painel") {
    const channel = interaction.options.getChannel("canal");

    const embed = createEmbed({
      title: `${config.emojis.ticket} Atendimento`,
      color: config.colors.accent,
      description: "Precisa de ajuda? Clique no botao abaixo para abrir um atendimento privado com a equipe."
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_open")
        .setLabel("Abrir atendimento")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: `Painel de tickets enviado em ${channel}.`,
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  if (subcommand === "logs") {
    const channel = interaction.options.getChannel("canal");

    updateGuildConfig(interaction.guildId, {
      ticket_logs_channel_id: channel.id
    });

    await interaction.reply({
      content: `Canal de logs de ticket definido para ${channel}.`,
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  if (subcommand === "ver") {
    const guildConfig = getGuildConfig(interaction.guildId);

    await interaction.reply({
      content: [
        "**Configuracao de tickets**",
        `Logs: ${guildConfig.ticket_logs_channel_id ? `<#${guildConfig.ticket_logs_channel_id}>` : "nao definido"}`
      ].join("\n"),
      flags: MessageFlags.Ephemeral
    });
  }
}

module.exports = {
  data,
  execute
};
