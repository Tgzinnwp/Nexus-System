/**
 * Script independente para registrar (ou atualizar) os comandos slash na
 * API do Discord. Execute com "npm run deploy" sempre que adicionar,
 * remover ou alterar a assinatura (nome, descrição, opções) de um comando.
 *
 * Não é executado automaticamente pelo src/index.js: registrar comandos
 * é uma operação de configuração, não algo que deva rodar a cada boot do bot.
 */
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const config = require('./config/config');
const logger = require('./utils/logger');

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

(async () => {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = readCommandFiles(commandsPath);

  for (const filePath of commandFiles) {
    const command = require(filePath);
    if (!command?.data) continue;
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    logger.info(`Registrando ${commands.length} comando(s) slash...`);

    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    const data = await rest.put(route, { body: commands });

    logger.success(
      `${data.length} comando(s) registrado(s) com sucesso ${config.guildId ? `no servidor ${config.guildId}` : 'globalmente (pode levar até 1h para propagar)'}.`
    );
  } catch (error) {
    logger.error(`Erro ao registrar comandos: ${error.stack}`);
    process.exit(1);
  }
})();
