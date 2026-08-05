const { MessageFlags, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { removeProduct } = require('../../services/products');
const { atualizarMensagemLoja } = require('../../services/loja');

const data = new SlashCommandBuilder()
  .setName('produto-remover')
  .setDescription('Remove um produto da loja')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((opt) =>
    opt.setName('id').setDescription('ID do produto (veja em /produto-listar)').setRequired(true)
  );

async function execute(interaction) {
  const id = interaction.options.getString('id');
  const removido = removeProduct(interaction.guildId, id);

  if (!removido) {
    await interaction.reply({
      content: `Nenhum produto ativo encontrado com o ID ${id}.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.reply({ content: `Produto **${removido.nome}** removido.`, flags: MessageFlags.Ephemeral });
  await atualizarMensagemLoja(interaction.client, interaction.guildId);
}

module.exports = {
  data,
  execute
};
