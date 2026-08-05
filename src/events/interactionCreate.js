const {
    Events,
    EmbedBuilder,
    Collection,
    MessageFlags
} = require("discord.js");

const logger = require("../utils/logger");
const config = require("../config/config");

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction, client) {

        // Slash Commands
        if (interaction.isChatInputCommand() || interaction.isAutocomplete()) {
            return handleCommand(interaction, client);
        }

        // Buttons
        if (interaction.isButton()) {
            return handleComponent(
                interaction,
                client,
                client.buttons,
                "botão"
            );
        }

        // Select Menus
        if (interaction.isAnySelectMenu()) {
            return handleComponent(
                interaction,
                client,
                client.selectMenus,
                "select menu"
            );
        }

        // Modals
        if (interaction.isModalSubmit()) {
            return handleComponent(
                interaction,
                client,
                client.modals,
                "modal"
            );
        }

    }
};

async function handleCommand(interaction, client) {

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    if (
        interaction.isAutocomplete() &&
        typeof command.autocomplete === "function"
    ) {
        try {
            return await command.autocomplete(interaction, client);
        } catch (err) {
            logger.error(err.stack);
            return;
        }
    }

    if (command.cooldown) {
        if (checkCooldown(interaction, client, command)) {
            return;
        }
    }

    try {

        await command.execute(interaction, client);

    } catch (err) {

        logger.error(err.stack);

        await replyWithError(interaction);

    }

}

async function handleComponent(
    interaction,
    client,
    collection,
    type
) {

    let id = interaction.customId.split(":")[0];

    if (id.startsWith("comprar_")) {
        id = "comprar";
    }

    const handler = collection.get(id);

    if (!handler) {

        logger.warn(
            `Nenhum handler de ${type} encontrado para "${id}".`
        );

        return;

    }

    try {

        await handler.execute(interaction, client);

    } catch (err) {

        logger.error(err.stack);

        await replyWithError(interaction);

    }

}

function checkCooldown(interaction, client, command) {

    if (!client.cooldowns.has(command.data.name)) {

        client.cooldowns.set(
            command.data.name,
            new Collection()
        );

    }

    const timestamps = client.cooldowns.get(command.data.name);

    const cooldown = command.cooldown * 1000;

    const now = Date.now();

    if (timestamps.has(interaction.user.id)) {

        const expiration =
            timestamps.get(interaction.user.id) + cooldown;

        if (now < expiration) {

            const remaining =
                ((expiration - now) / 1000).toFixed(1);

            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription(
                    `${config.emojis.warning} Aguarde **${remaining}s** antes de usar \`/${command.data.name}\` novamente.`
                );

            interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            }).catch(() => {});

            return true;

        }

    }

    timestamps.set(interaction.user.id, now);

    setTimeout(() => {

        timestamps.delete(interaction.user.id);

    }, cooldown);

    return false;

}

async function replyWithError(interaction) {

    const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setDescription(
            `${config.emojis.error} Ocorreu um erro ao processar esta interação.`
        );

    try {

        if (interaction.replied || interaction.deferred) {

            await interaction.followUp({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

        } else {

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

        }

    } catch (err) {

        logger.error(err.stack);

    }

}
