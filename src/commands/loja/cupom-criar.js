const {
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} = require("discord.js");

const {
    getProduct,
    getProductPrice,
    setProductDiscount
} = require("../../services/products");
const { atualizarMensagemLoja } = require("../../services/loja");
const config = require("../../config/config");

const data = new SlashCommandBuilder()
    .setName("cupom-criar")
    .setDescription("Aplica um desconto percentual a um produto da vitrine")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
        option
            .setName("id_do_produto")
            .setDescription("ID do produto exibido em /produto-listar")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("porcentagem")
            .setDescription("Percentual de desconto entre 1 e 99")
            .setMinValue(1)
            .setMaxValue(99)
            .setRequired(true)
    );

async function execute(interaction) {
    const productId = interaction.options.getString("id_do_produto").trim();
    const discountPercent = interaction.options.getInteger("porcentagem");
    const product = getProduct(interaction.guildId, productId);

    if (!product) {
        await interaction.reply({
            content: `Nenhum produto ativo encontrado com o ID ${productId}.`,
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const updatedProduct = setProductDiscount(
        interaction.guildId,
        productId,
        discountPercent
    );

    await atualizarMensagemLoja(interaction.client, interaction.guildId);

    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(
            [
                `${config.emojis.success} Cupom de **${discountPercent}%** aplicado a **${updatedProduct.nome}**.`,
                `De **R$ ${Number(updatedProduct.preco).toFixed(2)}** por **R$ ${getProductPrice(updatedProduct).toFixed(2)}**.`
            ].join("\n")
        );

    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
    });
}

module.exports = {
    data,
    execute
};
