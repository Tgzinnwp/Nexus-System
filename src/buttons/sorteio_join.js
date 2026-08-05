const { EmbedBuilder, MessageFlags } = require("discord.js");

const { addParticipant, getGiveaway } = require("../services/giveaways");
const config = require("../config/config");

module.exports = {
    customId: "sorteio_join",

    async execute(interaction) {
        const giveawayId = interaction.customId.split(":")[1];
        const giveaway = getGiveaway(giveawayId);

        if (!giveaway || giveaway.status !== "open") {
            await interaction.reply({
                content: "Este sorteio ja foi encerrado ou nao existe mais.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (Date.now() >= giveaway.endsAt) {
            await interaction.reply({
                content: "Este sorteio ja chegou ao fim.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const alreadyJoined = giveaway.participants.includes(interaction.user.id);
        const updatedGiveaway = addParticipant(giveawayId, interaction.user.id);

        if (!updatedGiveaway) {
            await interaction.reply({
                content: "Nao consegui registrar sua participacao.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(
                alreadyJoined
                    ? "Voce ja esta participando deste sorteio."
                    : `${config.emojis.success} Participacao registrada.`
            );

        if (!alreadyJoined) {
            const updatedEmbed = new EmbedBuilder()
                .setTitle("Sorteio")
                .setColor(config.colors.info)
                .setDescription(`Premio: **${updatedGiveaway.prize}**\nClique no botao abaixo para participar.`)
                .addFields(
                    { name: "Termina em", value: `<t:${Math.floor(updatedGiveaway.endsAt / 1000)}:R>` },
                    { name: "Participantes", value: String(updatedGiveaway.participants.length) }
                )
                .setTimestamp(updatedGiveaway.endsAt);

            await interaction.message.edit({
                embeds: [updatedEmbed]
            }).catch(() => {});
        }

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};
