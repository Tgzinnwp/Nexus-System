const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} = require("discord.js");

const {
    createGiveaway,
    updateGiveaway
} = require("../../services/giveaways");
const { scheduleGiveaway } = require("../../services/giveawayRunner");
const config = require("../../config/config");
const { createEmbed } = require("../../utils/theme");

const data = new SlashCommandBuilder()
    .setName("sorteio")
    .setDescription("Cria um sorteio com botao de participacao")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
        option
            .setName("premio")
            .setDescription("Premio do sorteio")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("minutos")
            .setDescription("Tempo ate o sorteio finalizar")
            .setMinValue(1)
            .setMaxValue(10080)
            .setRequired(true)
    )
    .addChannelOption((option) =>
        option
            .setName("canal")
            .setDescription("Canal onde o sorteio sera enviado")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
    );

async function execute(interaction, client) {
    const prize = interaction.options.getString("premio").trim();
    const minutes = interaction.options.getInteger("minutos");
    const channel = interaction.options.getChannel("canal") || interaction.channel;
    const endsAt = Date.now() + minutes * 60 * 1000;

    const giveaway = createGiveaway({
        guildId: interaction.guildId,
        channelId: channel.id,
        messageId: null,
        prize,
        endsAt
    });

    const embed = createEmbed({
        title: `${config.emojis.gift} Sorteio`,
        color: config.colors.accent,
        description: `Premio: **${prize}**\nClique no botao abaixo para participar.`
    })
        .addFields(
            { name: "Termina em", value: `<t:${Math.floor(endsAt / 1000)}:R>` },
            { name: "Participantes", value: "0" }
        )
        .setTimestamp(endsAt);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`sorteio_join:${giveaway.id}`)
            .setLabel("Participar")
            .setStyle(ButtonStyle.Success)
    );

    const message = await channel.send({
        embeds: [embed],
        components: [row]
    });

    const savedGiveaway = updateGiveaway(giveaway.id, {
        messageId: message.id
    });

    await interaction.reply({
        content: `Sorteio criado em ${channel}.`,
        flags: MessageFlags.Ephemeral
    });

    scheduleGiveaway(client, savedGiveaway);
}

module.exports = {
    data,
    execute
};
