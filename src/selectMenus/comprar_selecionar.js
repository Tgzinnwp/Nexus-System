const { startPurchase } = require("../buttons/comprar");

module.exports = {
    customId: "comprar_selecionar",

    async execute(interaction) {
        const productId = interaction.values[0];
        await startPurchase(interaction, productId);
    }
};
