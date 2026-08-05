const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

/**
 * Carrega os arquivos de botão em client.buttons, indexados pelo customId.
 *
 * Convenção de customId: "identificador" ou "identificador:dado1:dado2".
 * O interactionCreate faz o lookup apenas pela primeira parte (antes dos
 * dois-pontos), permitindo que um mesmo handler de botão trate várias
 * instâncias diferentes (ex.: "ticket_close" é sempre o mesmo handler,
 * independente do canal em que o botão foi clicado).
 */
module.exports = (client) => {
  client.buttons = new Collection();

  const buttonsPath = path.join(__dirname, '..', 'buttons');
  if (!fs.existsSync(buttonsPath)) return;

  const buttonFiles = fs.readdirSync(buttonsPath).filter((file) => file.endsWith('.js'));
  let loaded = 0;

  for (const file of buttonFiles) {
    const filePath = path.join(buttonsPath, file);
    delete require.cache[require.resolve(filePath)];
    const button = require(filePath);

    if (!button?.customId || typeof button?.execute !== 'function') {
      logger.warn(`O botão em "${file}" está incompleto e foi ignorado (faltando "customId" ou "execute").`);
      continue;
    }

    client.buttons.set(button.customId, button);
    loaded++;
  }

  logger.info(`${loaded} botão(ões) carregado(s) com sucesso.`);
};
