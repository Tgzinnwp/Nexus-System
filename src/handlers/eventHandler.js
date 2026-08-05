const fs = require('node:fs');
const path = require('node:path');
const logger = require('../utils/logger');

module.exports = (client) => {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

  let loaded = 0;

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    delete require.cache[require.resolve(filePath)];
    const event = require(filePath);

    if (!event?.name || typeof event?.execute !== 'function') {
      logger.warn(`O evento em "${file}" está incompleto e foi ignorado (faltando "name" ou "execute").`);
      continue;
    }

    // O client é sempre passado como último argumento para o listener,
    // além dos argumentos nativos que o discord.js já entrega
    // (ex.: em interactionCreate, o primeiro argumento é a própria interação).
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }

    loaded++;
  }

  logger.info(`${loaded} evento(s) carregado(s) com sucesso.`);
};
