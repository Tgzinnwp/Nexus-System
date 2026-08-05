const {
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} = require("discord.js");

const config = require("../../config/config");

const data = new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bane um usuario do servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((option) =>
        option
            .setName("user_id")
            .setDescription("ID do usuario que sera banido")
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("motivo")
            .setDescription("Motivo do banimento")
            .setRequired(false)
    );

async function execute(interaction) {
    const userId = interaction.options.getString("user_id").trim();
    const reason = interaction.options.getString("motivo") || "Sem motivo informado";

    await interaction.guild.bans.create(userId, {
        reason
    }).catch(async () => {
        await interaction.reply({
            content: "Nao consegui banir esse usuario. Verifique o ID, minha permissao e a hierarquia de cargos.",
            flags: MessageFlags.Ephemeral
        });
        return null;
    });

    if (interaction.replied) return;

    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} Usuario \`${userId}\` banido. Motivo: ${reason}`);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = {
    data,
    execute
};
