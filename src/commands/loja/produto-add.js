const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('produto-add')
  .setDescription('Cadastra um novo produto na loja (abre um formulario)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

async function execute(interaction) {
  const modal = new ModalBuilder().setCustomId('modal_produto_add').setTitle('Novo produto');

  const nomeInput = new TextInputBuilder()
    .setCustomId('nome')
    .setLabel('Nome do produto')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(80);

  const precoInput = new TextInputBuilder()
    .setCustomId('preco')
    .setLabel('Preco (ex: 29.90)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(12);

  const estoqueInput = new TextInputBuilder()
    .setCustomId('estoque')
    .setLabel('Estoque (deixe vazio para ilimitado)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(6);

  const descricaoInput = new TextInputBuilder()
    .setCustomId('descricao')
    .setLabel('Descricao')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nomeInput),
    new ActionRowBuilder().addComponents(precoInput),
    new ActionRowBuilder().addComponents(estoqueInput),
    new ActionRowBuilder().addComponents(descricaoInput)
  );

  await interaction.showModal(modal);
}

module.exports = {
  data,
  execute
};
