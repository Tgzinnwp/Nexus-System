const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const {
  getProductDiscountPercent,
  getProductPrice,
  listActiveProducts
} = require('../../services/products');

function formatProductPrice(product) {
  const discountPercent = getProductDiscountPercent(product);

  if (!discountPercent) return `R$ ${Number(product.preco).toFixed(2)}`;

  return `~~R$ ${Number(product.preco).toFixed(2)}~~ R$ ${getProductPrice(product).toFixed(2)} (-${discountPercent}%)`;
}

const data = new SlashCommandBuilder()
  .setName('produto-listar')
  .setDescription('Lista os produtos cadastrados na loja');

async function execute(interaction) {
  const produtos = listActiveProducts(interaction.guildId);

  if (produtos.length === 0) {
    await interaction.reply({ content: 'Nenhum produto cadastrado ainda.', flags: MessageFlags.Ephemeral });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('Produtos cadastrados')
    .setColor(0x2ecc71)
    .setDescription(
      produtos
        .map(
          (p) =>
            `**#${p.id} — ${p.nome}**\n${formatProductPrice(p)} • estoque: ${
              p.estoque < 0 ? 'ilimitado' : p.estoque
            }\n${p.descricao ? p.descricao : '_sem descricao_'}`
        )
        .join('\n\n')
    );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = {
  data,
  execute
};
