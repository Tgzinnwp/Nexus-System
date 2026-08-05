const { Events } = require("discord.js");

module.exports = {
    name: Events.MessageCreate,

    async execute() {
        // Os tickets agora geram um unico log consolidado ao serem fechados.
    }
};
