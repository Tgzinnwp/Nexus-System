const {
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits
} = require("discord.js");

const {
    closeTicket,
    createTicket,
    getTicketByChannel
} = require("../services/tickets");
const { getGuildConfig } = require("../services/config");
const config = require("../config/config");

const TRANSCRIPT_LIMIT = 3300;

async function sendTicketLog(client, guildId, embed) {
    const guildConfig = getGuildConfig(guildId);
    if (!guildConfig.ticket_logs_channel_id) return;

    const logChannel = await client.channels
        .fetch(guildConfig.ticket_logs_channel_id)
        .catch(() => null);

    if (!logChannel) return;

    await logChannel.send({ embeds: [embed] }).catch(() => {});
}

async function fetchTicketMessages(channel) {
    const messages = [];
    let before;

    while (messages.length < 1000) {
        const fetched = await channel.messages
            .fetch({
                limit: 100,
                before
            })
            .catch(() => null);

        if (!fetched || fetched.size === 0) break;

        messages.push(...fetched.values());
        before = fetched.last().id;

        if (fetched.size < 100) break;
    }

    return messages
        .filter((message) => !message.author.bot)
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

function sanitizeTranscriptText(value) {
    return value
        .replace(/`/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function formatTicketTranscript(messages) {
    if (!messages.length) {
        return "_Nenhuma mensagem de usuario foi enviada neste ticket._";
    }

    const lines = messages.map((message) => {
        const time = new Date(message.createdTimestamp)
            .toLocaleString("pt-BR", { hour12: false });
        const content = sanitizeTranscriptText(message.content || "_sem texto_");
        const attachments = [...message.attachments.values()]
            .map((attachment) => attachment.url)
            .join(" ");
        const suffix = attachments ? ` | Anexos: ${attachments}` : "";

        return `[${time}] ${message.author.tag}: ${content}${suffix}`;
    });

    let transcript = "";
    let truncated = false;

    for (const line of lines) {
        const next = transcript ? `${transcript}\n${line}` : line;

        if (next.length > TRANSCRIPT_LIMIT) {
            truncated = true;
            break;
        }

        transcript = next;
    }

    if (truncated) {
        transcript += "\n\n[Historico truncado por limite de tamanho da embed.]";
    }

    return `\`\`\`\n${transcript}\n\`\`\``;
}

function getTicketOwnerId(interaction) {
    const customIdOwner = interaction.customId.split(":")[1];

    if (/^\d{17,20}$/.test(customIdOwner || "")) {
        return customIdOwner;
    }

    const topicMatch = interaction.channel?.topic?.match(
        /\((\d{17,20})\)\s*$/
    );

    return topicMatch?.[1] || null;
}

module.exports = {
    customId: "ticket_close",

    async execute(interaction, client) {
        let ticket = getTicketByChannel(
            interaction.guildId,
            interaction.channelId
        );

        if (!ticket && interaction.channel?.name.startsWith("ticket-")) {
            const ownerId = getTicketOwnerId(interaction);

            if (ownerId) {
                ticket = createTicket(
                    interaction.guildId,
                    interaction.channelId,
                    ownerId
                );
            }
        }

        if (!ticket || ticket.status !== "open") {
            await interaction.reply({
                content: "Este canal nao parece ser um ticket aberto.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const isOwner = ticket.userId === interaction.user.id;
        const isAdmin = interaction.memberPermissions?.has(
            PermissionFlagsBits.Administrator
        );

        if (!isOwner && !isAdmin) {
            await interaction.reply({
                content: "Apenas o dono do ticket ou um administrador pode fechar este ticket.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const messages = await fetchTicketMessages(interaction.channel);
        const closedTicket = closeTicket(
            interaction.guildId,
            interaction.channelId,
            interaction.user.id
        );

        await interaction.reply({
            content: "Ticket fechado. Este canal sera apagado em 5 segundos.",
            ephemeral: false
        });

        const logEmbed = new EmbedBuilder()
            .setTitle("Ticket fechado")
            .setColor(config.colors.warning)
            .setDescription(formatTicketTranscript(messages))
            .addFields(
                { name: "Canal", value: `${interaction.channel.name} (${interaction.channelId})` },
                { name: "Aberto por", value: `<@${ticket.userId}> (${ticket.userId})` },
                { name: "Fechado por", value: `${interaction.user} (${interaction.user.id})` },
                { name: "Mensagens registradas", value: String(messages.length) }
            )
            .setTimestamp(closedTicket?.closedAt ? new Date(closedTicket.closedAt) : new Date());

        await sendTicketLog(client, interaction.guildId, logEmbed);

        setTimeout(() => {
            interaction.channel.delete("Ticket fechado").catch(() => {});
        }, 5000);
    }
};
