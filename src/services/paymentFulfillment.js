const { EmbedBuilder } = require("discord.js");

const { getGuildConfig } = require("./config");
const { getOrder, listPendingOrders, updateOrder } = require("./orders");
const { decrementStock, getProduct } = require("./products");
const { atualizarMensagemLoja } = require("./loja");
const {
    getPayment,
    searchPaymentsByExternalReference
} = require("./mercadoPago");
const config = require("../config/config");

const activeFulfillments = new Set();

async function sendSaleLog(client, order, product, payment, stockUpdated) {
    const guildConfig = getGuildConfig(order.guildId);
    if (!guildConfig.logs_channel_id) return;

    const channel = await client.channels
        .fetch(guildConfig.logs_channel_id)
        .catch(() => null);

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle(`${config.emojis.cart} Venda aprovada`)
        .setColor(config.colors.success)
        .addFields(
            { name: "Pedido", value: `\`${order.id}\`` },
            { name: "Produto", value: product ? product.nome : order.productName },
            { name: "Comprador", value: `<@${order.userId}> (${order.userId})` },
            { name: "Pagamento MP", value: `\`${payment.id}\`` },
            { name: "Valor", value: `R$ ${Number(order.amount).toFixed(2)}` },
            { name: "Estoque", value: stockUpdated ? "Atualizado" : "Nao alterado/verificar manualmente" }
        )
        .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
}

async function giveBuyerRole(client, order) {
    const guildConfig = getGuildConfig(order.guildId);
    if (!guildConfig.cargo_comprador_id) return;

    const guild = await client.guilds.fetch(order.guildId).catch(() => null);
    if (!guild) return;

    const member = await guild.members.fetch(order.userId).catch(() => null);
    if (!member) return;

    await member.roles
        .add(guildConfig.cargo_comprador_id, "Compra aprovada pelo Mercado Pago")
        .catch(() => {});
}

async function notifyBuyer(client, order, product) {
    const user = await client.users.fetch(order.userId).catch(() => null);
    if (!user) return;

    const embed = new EmbedBuilder()
        .setTitle(`${config.emojis.success} Pagamento aprovado`)
        .setColor(config.colors.success)
        .setDescription(
            `Seu pagamento do produto **${product ? product.nome : order.productName}** foi aprovado.\nPedido: \`${order.id}\``
        )
        .setTimestamp();

    await user.send({ embeds: [embed] }).catch(() => {});
}

async function fulfillApprovedPayment(client, orderId, payment) {
    if (activeFulfillments.has(orderId)) return getOrder(orderId);

    activeFulfillments.add(orderId);

    try {
        const currentOrder = getOrder(orderId);

        if (!currentOrder || currentOrder.status === "paid") {
            return currentOrder;
        }

        if (payment.status !== "approved") {
            return updateOrder(orderId, {
                paymentId: String(payment.id),
                paymentStatus: payment.status
            });
        }

        const product = getProduct(currentOrder.guildId, currentOrder.productId);
        const updatedProduct = decrementStock(
            currentOrder.guildId,
            currentOrder.productId,
            currentOrder.quantity
        );

        const paidOrder = updateOrder(orderId, {
            status: "paid",
            paidAt: new Date().toISOString(),
            paymentId: String(payment.id),
            paymentStatus: payment.status
        });

        await atualizarMensagemLoja(client, currentOrder.guildId);
        await giveBuyerRole(client, currentOrder);
        await notifyBuyer(client, currentOrder, product);
        await sendSaleLog(client, paidOrder, product, payment, Boolean(updatedProduct));

        return paidOrder;
    } finally {
        activeFulfillments.delete(orderId);
    }
}

async function handlePaymentNotification(client, paymentId) {
    const payment = await getPayment(paymentId);
    const orderId = payment.external_reference || payment.metadata?.order_id;

    if (!orderId) return null;

    return fulfillApprovedPayment(client, orderId, payment);
}

async function checkPendingOrders(client) {
    for (const order of listPendingOrders()) {
        if (order.paymentId) {
            const payment = await getPayment(order.paymentId).catch(() => null);

            if (payment) {
                await fulfillApprovedPayment(client, order.id, payment);
            }

            continue;
        }

        const result = await searchPaymentsByExternalReference(order.id).catch(() => null);
        const payment = result?.results?.find(
            (item) => item.status === "approved"
        );

        if (payment) {
            await fulfillApprovedPayment(client, order.id, payment);
        }
    }
}

function startPaymentPolling(client) {
    if (!process.env.MP_ACCESS_TOKEN) return;

    const intervalMs = Number(process.env.MP_POLL_INTERVAL_MS || 60000);

    setInterval(() => {
        checkPendingOrders(client).catch(() => {});
    }, intervalMs);
}

module.exports = {
    checkPendingOrders,
    fulfillApprovedPayment,
    handlePaymentNotification,
    startPaymentPolling
};
