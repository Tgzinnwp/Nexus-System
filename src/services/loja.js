const {
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");
const { createEmbed } = require("../utils/theme");
const appConfig = require("../config/config");

const {
    getGuildConfig,
    updateGuildConfig
} = require("./config");

const {
    getProductDiscountPercent,
    getProductPrice,
    listActiveProducts
} = require("./products");

function formatPrice(product) {
    const discountPercent = getProductDiscountPercent(product);
    const originalPrice = Number(product.preco).toFixed(2);

    if (!discountPercent) return `R$ ${originalPrice}`;

    return `~~R$ ${originalPrice}~~ R$ ${getProductPrice(product).toFixed(2)} (-${discountPercent}%)`;
}

function cleanSelectLabel(value) {
    return String(value)
        .replace(/[*_~`|]/g, "")
        .trim()
        .slice(0, 100) || "Produto";
}

function buildSelectDescription(product) {
    const discountPercent = getProductDiscountPercent(product);
    const stock = product.estoque < 0 ? "Ilimitado" : product.estoque;
    const parts = [
        `R$ ${getProductPrice(product).toFixed(2)}`,
        `Estoque: ${stock}`
    ];

    if (discountPercent) parts.push(`${discountPercent}% OFF`);

    return parts.join(" | ").slice(0, 100);
}

function buildLojaPayload(produtos) {

    const embed = createEmbed({
        title: `${appConfig.emojis.cart} Loja`,
        color: appConfig.colors.accent,
        description: produtos.length === 0
            ? "Nenhum produto disponivel no momento."
            : "Selecione um produto abaixo para iniciar a compra pelo Mercado Pago."
    });

    if (produtos.length) {

        embed.addFields(
            produtos.slice(0, 25).map(produto => ({
                name: `${produto.nome} • ${formatPrice(produto)}`,
                value:
                    `${produto.descricao || "_Sem descricao._"}\n` +
                    `Estoque: ${
                        produto.estoque < 0
                            ? "Ilimitado"
                            : produto.estoque
                    }`
            }))
        );

    }

    const rows = [];

    const produtosDisponiveis = produtos.filter(
        p => p.estoque !== 0
    );

    if (produtosDisponiveis.length) {
        const select = new StringSelectMenuBuilder()
            .setCustomId("comprar_selecionar")
            .setPlaceholder("Selecione um produto")
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                produtosDisponiveis.slice(0, 25).map(produto => ({
                    label: cleanSelectLabel(produto.nome),
                    description: buildSelectDescription(produto),
                    value: produto.id
                }))
            );

        rows.push(new ActionRowBuilder().addComponents(select));
    }

    return {
        embeds: [embed],
        components: rows
    };

}

async function atualizarMensagemLoja(client, guildId) {

    const config = getGuildConfig(guildId);

    if (!config?.produtos_channel_id) return;

    const channel = await client.channels
        .fetch(config.produtos_channel_id)
        .catch(() => null);

    if (!channel) return;

    const produtos = listActiveProducts(guildId);

    const payload = buildLojaPayload(produtos);

    if (config.loja_message_id) {

        const message = await channel.messages
            .fetch(config.loja_message_id)
            .catch(() => null);

        if (message) {

            await message.edit(payload);

            return;

        }

    }

    const novaMensagem = await channel.send(payload);

    updateGuildConfig(guildId, {
        loja_message_id: novaMensagem.id
    });

}

module.exports = {
    atualizarMensagemLoja,
    buildLojaPayload
};
