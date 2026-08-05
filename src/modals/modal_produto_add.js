const { EmbedBuilder, MessageFlags } = require("discord.js");
const { addProduct } = require("../services/products");
const { atualizarMensagemLoja } = require("../services/loja");
const config = require("../config/config");

function parsePrice(value) {
    const normalized = value.replace(",", ".").trim();
    const price = Number(normalized);

    if (!Number.isFinite(price) || price <= 0) {
        return null;
    }

    return Math.round(price * 100) / 100;
}

function parseStock(value) {
    const normalized = value.trim();

    if (!normalized) return -1;

    const stock = Number(normalized);

    if (!Number.isInteger(stock) || stock < 0) {
        return null;
    }

    return stock;
}

module.exports = {
    customId: "modal_produto_add",

    async execute(interaction, client) {
        const nome = interaction.fields.getTextInputValue("nome").trim();
        const preco = parsePrice(
            interaction.fields.getTextInputValue("preco")
        );
        const estoque = parseStock(
            interaction.fields.getTextInputValue("estoque") || ""
        );
        const descricao = (
            interaction.fields.getTextInputValue("descricao") || ""
        ).trim();
        if (!nome || preco === null || estoque === null) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(
                    `${config.emojis.error} Preencha um nome valido, preco maior que zero e estoque numerico.`
                );

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const product = addProduct(interaction.guildId, {
            nome,
            preco,
            estoque,
            descricao
        });

        await atualizarMensagemLoja(client, interaction.guildId);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(
                `${config.emojis.success} Produto **${product.nome}** cadastrado com sucesso.\nID: \`${product.id}\``
            );

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};
