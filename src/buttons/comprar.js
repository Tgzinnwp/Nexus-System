const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
    AttachmentBuilder,
    EmbedBuilder,
    MessageFlags
} = require("discord.js");

const {
    getProduct,
    getProductDiscountPercent,
    getProductPrice
} = require("../services/products");
const { createOrder, updateOrder } = require("../services/orders");
const { createPixPayment } = require("../services/mercadoPago");
const config = require("../config/config");

function getPixData(payment) {
    const transactionData = payment.point_of_interaction?.transaction_data || {};

    return {
        qrCode: transactionData.qr_code,
        qrCodeBase64: transactionData.qr_code_base64,
        ticketUrl: transactionData.ticket_url
    };
}

function writePixQrCodeFile(orderId, qrCodeBase64) {
    if (!qrCodeBase64) return null;

    const filePath = path.join(os.tmpdir(), `pix-${orderId}.png`);
    fs.writeFileSync(filePath, Buffer.from(qrCodeBase64, "base64"));

    return filePath;
}

async function startPurchase(interaction, productId) {
    const product = getProduct(interaction.guildId, productId);

    if (!product || product.estoque === 0) {
        await interaction.reply({
            content: "Este produto nao esta disponivel no momento.",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    if (!process.env.MP_ACCESS_TOKEN) {
        await interaction.reply({
            content: "Mercado Pago ainda nao foi configurado. Defina MP_ACCESS_TOKEN no .env.",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const productPrice = getProductPrice(product);
    const discountPercent = getProductDiscountPercent(product);
    const order = createOrder({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        productId: product.id,
        productName: product.nome,
        amount: productPrice,
        discountPercent,
        quantity: 1,
        paymentMethod: "pix"
    });

    try {
        const payment = await createPixPayment(order, product);
        const pixData = getPixData(payment);
        const qrCodeFile = writePixQrCodeFile(order.id, pixData.qrCodeBase64);

        updateOrder(order.id, {
            paymentId: String(payment.id),
            paymentStatus: payment.status,
            pixQrCode: pixData.qrCode,
            pixTicketUrl: pixData.ticketUrl,
            expiresAt: payment.date_of_expiration
        });

        const embed = new EmbedBuilder()
            .setTitle(`${config.emojis.cart} Pix gerado`)
            .setColor(config.colors.accent)
            .setDescription(
                [
                    `Produto: **${product.nome}**`,
                    `Valor: **R$ ${productPrice.toFixed(2)}**${discountPercent ? ` (${discountPercent}% de desconto)` : ""}`,
                    `Pedido: \`${order.id}\``,
                    "",
                    "Pague pelo app do seu banco usando o QR Code ou o Pix copia-e-cola abaixo.",
                    pixData.ticketUrl ? `[Abrir instrucoes do Mercado Pago](${pixData.ticketUrl})` : null
                ].filter(Boolean).join("\n")
            )
            .setTimestamp();

        if (payment.date_of_expiration) {
            embed.addFields({
                name: "Validade",
                value: `<t:${Math.floor(new Date(payment.date_of_expiration).getTime() / 1000)}:R>`
            });
        }

        if (pixData.qrCode) {
            embed.addFields({
                name: "Pix copia-e-cola",
                value: `\`\`\`${pixData.qrCode.slice(0, 950)}\`\`\``
            });
        }

        const files = qrCodeFile
            ? [new AttachmentBuilder(qrCodeFile, { name: "pix-qrcode.png" })]
            : [];

        await interaction.editReply({
            embeds: [embed],
            files
        });
    } catch (error) {
        updateOrder(order.id, {
            status: "failed",
            error: error.message
        });

        await interaction.editReply({
            content: `Nao consegui gerar o Pix no Mercado Pago: ${error.message}`
        });
    }
}

module.exports = {
    customId: "comprar",

    async execute(interaction) {
        const productId = interaction.customId.includes(":")
            ? interaction.customId.split(":")[1]
            : interaction.customId.replace("comprar_", "");
        await startPurchase(interaction, productId);
    },

    startPurchase
};
