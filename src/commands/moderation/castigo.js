const {
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} = require("discord.js");

const config = require("../../config/config");

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

const data = new SlashCommandBuilder()
    .setName("castigo")
    .setDescription("Aplica timeout/castigo em um usuario")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addStringOption((option) =>
        option
            .setName("user_id")
            .setDescription("ID do usuario que recebera castigo")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("minutos")
            .setDescription("Duracao do castigo em minutos")
            .setMinValue(1)
            .setMaxValue(40320)
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("motivo")
            .setDescription("Motivo do castigo")
            .setRequired(false)
    );

async function execute(interaction) {
    const userId = interaction.options.getString("user_id").trim();
    const minutes = interaction.options.getInteger("minutos");
    const reason = interaction.options.getString("motivo") || "Sem motivo informado";
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) {
        await interaction.reply({
            content: "Nao encontrei esse usuario dentro do servidor.",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    if (!member.moderatable) {
        await interaction.reply({
            content: "Nao consigo aplicar castigo nesse usuario. Verifique minha permissao e a hierarquia de cargos.",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const durationMs = Math.min(minutes * 60 * 1000, MAX_TIMEOUT_MS);

    await member.timeout(durationMs, reason);

    const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setDescription(`${config.emojis.success} Castigo aplicado em ${member.user.tag} por ${minutes} minuto(s). Motivo: ${reason}`);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = {
    data,
    execute
};
