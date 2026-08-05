const { EmbedBuilder, MessageFlags } = require("discord.js");

const config = require("../config/config");

module.exports = {
    customId: "criarmsg",

    async execute(interaction, client) {
        const channelId = interaction.customId.split(":")[1];
        const message = interaction.fields
            .getTextInputValue("mensagem")
            .trim();

        const channel = await client.channels
            .fetch(channelId)
            .catch(() => null);

        if (!channel) {
            await interaction.reply({
                content: "Nao consegui encontrar o canal selecionado.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (!message) {
            await interaction.reply({
                content: "A mensagem da embed nao pode ficar vazia.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.default)
            .setDescription(message);

        await channel.send({
            embeds: [embed]
        });

        await interaction.reply({
            content: `Embed enviada em ${channel}.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
