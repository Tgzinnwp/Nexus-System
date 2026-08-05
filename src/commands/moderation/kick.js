const {
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} = require("discord.js");

const config = require("../../config/config");

const data = new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa um usuario do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addStringOption((option) =>
        option
            .setName("user_id")
            .setDescription("ID do usuario que sera expulso")
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("motivo")
            .setDescription("Motivo da expulsao")
            .setRequired(false)
    );

async function execute(interaction) {
    const userId = interaction.options.getString("user_id").trim();
    const reason = interaction.options.getString("motivo") || "Sem motivo informado";
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) {
        await interaction.reply({
            content: "Nao encontrei esse usuario dentro do servidor.",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    if (!member.kickable) {
        await interaction.reply({
            content: "Nao consigo expulsar esse usuario. Verifique minha permissao e a hierarquia de cargos.",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    await member.kick(reason);

    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} Usuario ${member.user.tag} expulso. Motivo: ${reason}`);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = {
    data,
    execute
};
