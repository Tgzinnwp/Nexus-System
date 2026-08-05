const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags
} = require('discord.js');
const {
  updateGuildConfig,
  getGuildConfig
} = require('../../services/config');

const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Configura o bot de vendas')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName('logs')
      .setDescription('Define o canal onde os logs de venda sao enviados')
      .addChannelOption((opt) =>
        opt
          .setName('canal')
          .setDescription('Canal de logs')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('cargo-comprador')
      .setDescription('Cargo dado automaticamente a quem compra')
      .addRoleOption((opt) =>
        opt.setName('cargo').setDescription('Cargo a atribuir apos a compra').setRequired(true)
      )
  )
  .addSubcommand((sub) => sub.setName('ver').setDescription('Mostra a configuracao atual'));

async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'logs') {
    const canal = interaction.options.getChannel('canal');
    updateGuildConfig(interaction.guildId, { logs_channel_id: canal.id });
    await interaction.reply({ content: `Canal de logs definido para ${canal}.`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === 'cargo-comprador') {
    const cargo = interaction.options.getRole('cargo');
    updateGuildConfig(interaction.guildId, { cargo_comprador_id: cargo.id });
    await interaction.reply({
      content: `Cargo de comprador definido para ${cargo}.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (sub === 'ver') {
    const config = getGuildConfig(interaction.guildId);
    await interaction.reply({
      content: [
        `**Configuracao atual**`,
        `Canal de produtos: ${config.produtos_channel_id ? `<#${config.produtos_channel_id}>` : 'nao definido'}`,
        `Canal de logs: ${config.logs_channel_id ? `<#${config.logs_channel_id}>` : 'nao definido'}`,
        `Cargo de comprador: ${config.cargo_comprador_id ? `<@&${config.cargo_comprador_id}>` : 'nao definido'}`,
        `Token do Mercado Pago: ${process.env.MP_ACCESS_TOKEN ? 'configurado no .env' : 'NAO configurado'}`,
        `Webhook Mercado Pago: ${process.env.MP_WEBHOOK_URL || 'nao configurado'}`,
        `Porta local do webhook: ${process.env.MP_WEBHOOK_PORT || 'desativada'}`,
      ].join('\n'),
      flags: MessageFlags.Ephemeral,
    });
  }
}

module.exports = {
  data,
  execute
};
