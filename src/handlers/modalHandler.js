const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

/**
 * Carrega os arquivos de modal em client.modals, indexados pelo customId
 * (mesma convenção "identificador:dado" usada nos botões e select menus).
 */
module.exports = (client) => {
  client.modals = new Collection();

  const modalsPath = path.join(__dirname, '..', 'modals');
  if (!fs.existsSync(modalsPath)) return;

  const modalFiles = fs.readdirSync(modalsPath).filter((file) => file.endsWith('.js'));
  let loaded = 0;

  for (const file of modalFiles) {
    const filePath = path.join(modalsPath, file);
    delete require.cache[require.resolve(filePath)];
    const modal = require(filePath);

    if (!modal?.customId || typeof modal?.execute !== 'function') {
      logger.warn(`O modal em "${file}" está incompleto e foi ignorado (faltando "customId" ou "execute").`);
      continue;
    }

    client.modals.set(modal.customId, modal);
    loaded++;
  }

  logger.info(`${loaded} modal(is) carregado(s) com sucesso.`);
};
