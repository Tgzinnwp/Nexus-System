const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits
} = require("discord.js");

const { createTicket, findOpenTicketByUser } = require("../services/tickets");
const config = require("../config/config");

function buildTicketChannelName(user) {
    const safeName = user.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32);

    return `ticket-${safeName || user.id}`;
}

module.exports = {
    customId: "ticket_open",

    async execute(interaction, client) {
        const existingTicket = findOpenTicketByUser(
            interaction.guildId,
            interaction.user.id
        );

        if (existingTicket) {
            await interaction.reply({
                content: `Voce ja tem um ticket aberto: <#${existingTicket.channelId}>.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const channel = await interaction.guild.channels.create({
            name: buildTicketChannelName(interaction.user),
            type: ChannelType.GuildText,
            topic: `Ticket de ${interaction.user.tag} (${interaction.user.id})`,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageChannels
                    ]
                }
            ]
        });

        createTicket(interaction.guildId, channel.id, interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle("Ticket aberto")
            .setColor(config.colors.info)
            .setDescription(
                `${interaction.user}, descreva seu atendimento aqui. Administradores do servidor podem acompanhar e responder.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`ticket_close:${interaction.user.id}`)
                .setLabel("Fechar ticket")
                .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
            content: `${interaction.user}`,
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: `Ticket aberto em ${channel}.`,
            flags: MessageFlags.Ephemeral
        });

    }
};
