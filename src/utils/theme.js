const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");

const BRAND_NAME = process.env.BOT_BRAND_NAME || "NX System";

function createEmbed(options = {}) {
    const {
        title,
        description,
        color = config.colors.default,
        footer = true
    } = options;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTimestamp();

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (footer) embed.setFooter({ text: BRAND_NAME });

    return embed;
}

function successEmbed(description, title = "Tudo certo") {
    return createEmbed({
        title,
        description,
        color: config.colors.success
    });
}

function errorEmbed(description, title = "Algo deu errado") {
    return createEmbed({
        title,
        description,
        color: config.colors.error
    });
}

function warningEmbed(description, title = "Atencao") {
    return createEmbed({
        title,
        description,
        color: config.colors.warning
    });
}

function infoEmbed(description, title) {
    return createEmbed({
        title,
        description,
        color: config.colors.info
    });
}

module.exports = {
    createEmbed,
    errorEmbed,
    infoEmbed,
    successEmbed,
    warningEmbed
};
