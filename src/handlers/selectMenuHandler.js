const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

/**
 * Carrega os arquivos de select menu em client.selectMenus, indexados
 * pelo customId (mesma convenção "identificador:dado" usada nos botões).
 * Cobre todos os tipos: string select, role select, user select,
 * channel select e mentionable select.
 */
module.exports = (client) => {
  client.selectMenus = new Collection();

  const selectMenusPath = path.join(__dirname, '..', 'selectMenus');
  if (!fs.existsSync(selectMenusPath)) return;

  const selectMenuFiles = fs.readdirSync(selectMenusPath).filter((file) => file.endsWith('.js'));
  let loaded = 0;

  for (const file of selectMenuFiles) {
    const filePath = path.join(selectMenusPath, file);
    delete require.cache[require.resolve(filePath)];
    const selectMenu = require(filePath);

    if (!selectMenu?.customId || typeof selectMenu?.execute !== 'function') {
      logger.warn(`O select menu em "${file}" está incompleto e foi ignorado (faltando "customId" ou "execute").`);
      continue;
    }

    client.selectMenus.set(selectMenu.customId, selectMenu);
    loaded++;
  }

  logger.info(`${loaded} select menu(s) carregado(s) com sucesso.`);
};
