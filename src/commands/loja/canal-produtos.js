const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    MessageFlags
} = require("discord.js");

const {
    getGuildConfig,
    updateGuildConfig
} = require("../../services/config");

const {
    atualizarMensagemLoja
} = require("../../services/loja");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("canal-produtos")
        .setDescription("Define o canal onde a vitrine de produtos será publicada.")
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )
        .addChannelOption(option =>
            option
                .setName("canal")
                .setDescription("Canal da loja.")
                .addChannelTypes(
                    ChannelType.GuildText
                )
                .setRequired(true)
        ),

    async execute(interaction) {

        const canal =
            interaction.options.getChannel("canal");
        const currentConfig = getGuildConfig(interaction.guildId);
        const sameChannel = currentConfig.produtos_channel_id === canal.id;

        updateGuildConfig(interaction.guildId, {
            produtos_channel_id: canal.id,
            loja_message_id: sameChannel
                ? currentConfig.loja_message_id
                : null
        });

        await interaction.reply({

            content:
                `✅ Canal de produtos definido para ${canal}.`,
            flags: MessageFlags.Ephemeral

        });

        await atualizarMensagemLoja(

            interaction.client,
            interaction.guildId

        );

    }

};
