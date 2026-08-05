const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config/config');
const logger = require('./utils/logger');
const { startMercadoPagoWebhookServer } = require('./services/mercadoPagoWebhook');
const { startPaymentPolling } = require('./services/paymentFulfillment');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // servidores, canais, cargos, permissões
    GatewayIntentBits.GuildMembers, // entrada/saída de membros (privilegiado, ativar no Developer Portal)
    GatewayIntentBits.GuildMessages, // necessário para eventos messageDelete/messageUpdate
    GatewayIntentBits.MessageContent, // conteúdo das mensagens para logs de edição/exclusão (privilegiado)
    GatewayIntentBits.GuildModeration // eventos de ban/unban para o log de moderação
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

// ===== SISTEMA ANTI CRASH =====
// Evita que o processo derrube o bot inteiro por causa de um erro pontual.
// Isso NÃO substitui o try/catch dentro de cada comando/evento — é a
// última linha de defesa para o que passar despercebido por eles.
process.on('unhandledRejection', (reason) => {
  logger.error(`Promise rejeitada não tratada: ${reason?.stack || reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Exceção não capturada: ${error.stack}`);
});

process.on('uncaughtExceptionMonitor', (error) => {
  logger.error(`Exceção não capturada (monitor): ${error.stack}`);
});

client.on('error', (error) => logger.error(`Erro no cliente Discord: ${error.stack}`));
client.on('warn', (info) => logger.warn(`Aviso do cliente Discord: ${info}`));
client.rest.on('rateLimited', (info) => {
  logger.warn(`Rate limit atingido na rota ${info.route}. Aguardando ${info.timeToReset}ms.`);
});

// ===== INICIALIZAÇÃO =====
(async () => {
  try {
    require('./handlers/commandHandler')(client);
    require('./handlers/eventHandler')(client);
    require('./handlers/buttonHandler')(client);
    require('./handlers/selectMenuHandler')(client);
    require('./handlers/modalHandler')(client);

    await client.login(config.token);

    startMercadoPagoWebhookServer(client);
    startPaymentPolling(client);
  } catch (error) {
    logger.error(`Falha ao inicializar o bot: ${error.stack}`);
    process.exit(1);
  }
})();
