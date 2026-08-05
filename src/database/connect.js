const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Conecta ao MongoDB e registra listeners para os eventos de conexão.
 * É chamada uma única vez, na inicialização do bot (src/index.js).
 */
async function connectDatabase() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.success('MongoDB conectado com sucesso.');
  });

  mongoose.connection.on('error', (error) => {
    logger.error(`Erro na conexão com o MongoDB: ${error.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB desconectado. O driver tentará reconectar automaticamente.');
  });

  await mongoose.connect(config.mongoUri);
}

module.exports = connectDatabase;
