const {
    ChannelType,
    ModalBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require("discord.js");

const data = new SlashCommandBuilder()
    .setName("criarmsg")
    .setDescription("Cria uma embed personalizada em um canal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
        option
            .setName("canal")
            .setDescription("Canal onde a embed sera enviada")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
    );

async function execute(interaction) {
    const channel = interaction.options.getChannel("canal");

    const modal = new ModalBuilder()
        .setCustomId(`criarmsg:${channel.id}`)
        .setTitle("Criar embed");

    const messageInput = new TextInputBuilder()
        .setCustomId("mensagem")
        .setLabel("Mensagem")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(4000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(messageInput)
    );

    await interaction.showModal(modal);
}

module.exports = {
    data,
    execute
};
