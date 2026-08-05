const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const { scheduleOpenGiveaways } = require('../services/giveawayRunner');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.success(`Bot online como ${client.user.tag}!`);
    logger.info(`Servindo ${client.guilds.cache.size} servidor(es).`);

    client.user.setPresence({
      activities: [{ name: `${client.guilds.cache.size} servidores`, type: ActivityType.Watching }],
      status: 'online'
    });

    scheduleOpenGiveaways(client);
  }
};
