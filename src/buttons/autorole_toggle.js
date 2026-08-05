const { EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");

const { getGuildConfig } = require("../services/config");
const config = require("../config/config");

module.exports = {
    customId: "autorole_toggle",

    async execute(interaction) {
        const guildConfig = getGuildConfig(interaction.guildId);

        if (!guildConfig.autorole_role_id) {
            await interaction.reply({
                content: "Nenhum cargo foi configurado para este botao.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const role = await interaction.guild.roles
            .fetch(guildConfig.autorole_role_id)
            .catch(() => null);

        if (!role) {
            await interaction.reply({
                content: "O cargo configurado nao existe mais. Avise um administrador.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const botMember = interaction.guild.members.me;

        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            await interaction.reply({
                content: "Nao tenho permissao para gerenciar cargos.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (role.position >= botMember.roles.highest.position) {
            await interaction.reply({
                content: "Nao consigo gerenciar esse cargo porque ele esta acima ou no mesmo nivel do meu cargo.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const member = await interaction.guild.members
            .fetch(interaction.user.id)
            .catch(() => null);

        if (!member) {
            await interaction.reply({
                content: "Nao consegui localizar seu membro no servidor.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const hasRole = member.roles.cache.has(role.id);

        if (hasRole) {
            await member.roles.remove(role, "AutoRole por botao");
        } else {
            await member.roles.add(role, "AutoRole por botao");
        }

        const embed = new EmbedBuilder()
            .setColor(hasRole ? config.colors.warning : config.colors.success)
            .setDescription(
                hasRole
                    ? `${config.emojis.success} Cargo ${role} removido.`
                    : `${config.emojis.success} Cargo ${role} adicionado.`
            );

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        });
    }
};
