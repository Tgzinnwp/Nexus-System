const { EmbedBuilder } = require("discord.js");

const {
    finishGiveaway,
    listOpenGiveaways
} = require("./giveaways");
const config = require("../config/config");

const scheduledGiveaways = new Set();

async function finishAndAnnounce(client, giveawayId) {
    const giveaway = finishGiveaway(giveawayId);
    if (!giveaway) return;

    scheduledGiveaways.delete(giveawayId);

    const channel = await client.channels
        .fetch(giveaway.channelId)
        .catch(() => null);

    if (!channel) return;

    const message = giveaway.messageId
        ? await channel.messages.fetch(giveaway.messageId).catch(() => null)
        : null;

    const winnerText = giveaway.winnerId
        ? `<@${giveaway.winnerId}>`
        : "nenhum participante";

    const closedEmbed = new EmbedBuilder()
        .setTitle("Sorteio encerrado")
        .setColor(giveaway.winnerId ? config.colors.success : config.colors.warning)
        .setDescription(`Premio: **${giveaway.prize}**\nVencedor: ${winnerText}`)
        .addFields({
            name: "Participantes",
            value: String(giveaway.participants.length)
        })
        .setTimestamp();

    if (message) {
        await message.edit({
            embeds: [closedEmbed],
            components: []
        }).catch(() => {});
    }

    await channel.send({
        content: giveaway.winnerId
            ? `Parabens ${winnerText}! Voce ganhou **${giveaway.prize}**.`
            : `O sorteio de **${giveaway.prize}** terminou sem participantes.`
    }).catch(() => {});
}

function scheduleGiveaway(client, giveaway) {
    if (!giveaway || giveaway.status !== "open") return;
    if (scheduledGiveaways.has(giveaway.id)) return;

    scheduledGiveaways.add(giveaway.id);

    const delay = Math.max(0, giveaway.endsAt - Date.now());

    setTimeout(() => {
        finishAndAnnounce(client, giveaway.id).catch(() => {
            scheduledGiveaways.delete(giveaway.id);
        });
    }, delay);
}

function scheduleOpenGiveaways(client) {
    for (const giveaway of listOpenGiveaways()) {
        scheduleGiveaway(client, giveaway);
    }
}

module.exports = {
    finishAndAnnounce,
    scheduleGiveaway,
    scheduleOpenGiveaways
};
