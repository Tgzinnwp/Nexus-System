const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} = require("discord.js");

const { getGuildConfig, updateGuildConfig } = require("../../services/config");
const config = require("../../config/config");
const { createEmbed } = require("../../utils/theme");

const data = new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Configura o sistema de cargo por botao")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
        sub
            .setName("cargo")
            .setDescription("Define o cargo que sera dado pelo botao")
            .addStringOption((option) =>
                option
                    .setName("id")
                    .setDescription("ID do cargo que sera entregue")
                    .setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("painel")
            .setDescription("Envia a embed com o botao de pegar cargo")
            .addChannelOption((option) =>
                option
                    .setName("canal")
                    .setDescription("Canal onde a embed sera enviada")
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
    )
    .addSubcommand((sub) =>
        sub
            .setName("ver")
            .setDescription("Mostra a configuracao atual do autorole")
    );

function isDiscordId(value) {
    return /^\d{17,20}$/.test(value);
}

async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "cargo") {
        const roleId = interaction.options.getString("id").trim();

        if (!isDiscordId(roleId)) {
            await interaction.reply({
                content: "Informe um ID de cargo valido.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const role = await interaction.guild.roles
            .fetch(roleId)
            .catch(() => null);

        if (!role) {
            await interaction.reply({
                content: "Nao encontrei nenhum cargo com esse ID neste servidor.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        updateGuildConfig(interaction.guildId, {
            autorole_role_id: role.id
        });

        await interaction.reply({
            content: `Cargo do autorole definido para ${role}.`,
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    if (subcommand === "painel") {
        const guildConfig = getGuildConfig(interaction.guildId);

        if (!guildConfig.autorole_role_id) {
            await interaction.reply({
                content: "Configure primeiro o cargo com `/autorole cargo`.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const role = await interaction.guild.roles
            .fetch(guildConfig.autorole_role_id)
            .catch(() => null);

        if (!role) {
            await interaction.reply({
                content: "O cargo configurado nao existe mais. Use `/autorole cargo` para definir outro.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const channel = interaction.options.getChannel("canal");

        const embed = createEmbed({
            title: `${config.emojis.shield} AutoRole`,
            color: config.colors.accent,
            description: `Clique no botao abaixo para receber ou remover o cargo ${role}.`
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("autorole_toggle")
                .setLabel("Alternar cargo")
                .setStyle(ButtonStyle.Success)
        );

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        updateGuildConfig(interaction.guildId, {
            autorole_channel_id: channel.id
        });

        await interaction.reply({
            content: `Painel de autorole enviado em ${channel}.`,
            flags: MessageFlags.Ephemeral
        });

        return;
    }

    if (subcommand === "ver") {
        const guildConfig = getGuildConfig(interaction.guildId);

        await interaction.reply({
            content: [
                "**Configuracao do AutoRole**",
                `Cargo: ${guildConfig.autorole_role_id ? `<@&${guildConfig.autorole_role_id}>` : "nao definido"}`,
                `Canal do painel: ${guildConfig.autorole_channel_id ? `<#${guildConfig.autorole_channel_id}>` : "nao definido"}`
            ].join("\n"),
            flags: MessageFlags.Ephemeral
        });
    }
}

module.exports = {
    data,
    execute
};
