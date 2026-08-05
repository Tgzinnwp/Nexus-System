const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

/**
 * Percorre recursivamente src/commands e retorna o caminho de todos os
 * arquivos .js encontrados.
 *
 * Convenção importante: qualquer pasta chamada "subcommands" é ignorada
 * por este scanner. Comandos com múltiplos subcomandos (ex.: /ticket,
 * /cargo, /config) concentram a definição do SlashCommandBuilder em um
 * único arquivo principal (ex.: commands/tickets/ticket.js), que por sua
 * vez importa manualmente os arquivos dentro de sua pasta subcommands/.
 * Isso evita registrar o mesmo comando duas vezes e mantém cada
 * subcomando em seu próprio arquivo, como pedido.
 */
function readCommandFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (item.name === 'subcommands') continue;
      files = files.concat(readCommandFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

module.exports = (client) => {
  client.commands = new Collection();
  client.cooldowns = new Collection();

  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = readCommandFiles(commandsPath);

  let loaded = 0;

  for (const filePath of commandFiles) {
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);

    if (!command?.data || typeof command?.execute !== 'function') {
      logger.warn(`O comando em "${filePath}" está incompleto e foi ignorado (faltando "data" ou "execute").`);
      continue;
    }

    client.commands.set(command.data.name, command);
    loaded++;
  }

  logger.info(`${loaded} comando(s) slash carregado(s) com sucesso.`);
};
