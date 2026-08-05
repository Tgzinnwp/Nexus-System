require('dotenv').config();

// Variaveis obrigatorias para o bot funcionar. Se alguma estiver faltando,
// o processo encerra com uma mensagem clara em vez de falhar mais tarde.
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];

for (const key of requiredEnvVars) {
  if (!process.env[key] || process.env[key].trim() === '') {
    throw new Error(
      `[CONFIG] A variavel de ambiente "${key}" e obrigatoria e nao foi definida no arquivo .env. ` +
      'Copie o arquivo .env.example para .env e preencha os valores necessarios.'
    );
  }
}

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID?.trim() || null,
  ownerIds: process.env.OWNER_IDS
    ? process.env.OWNER_IDS.split(',').map((id) => id.trim()).filter(Boolean)
    : [],

  colors: {
    default: process.env.EMBED_COLOR || '#2B2D31',
    accent: '#8B5CF6',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    muted: '#6B7280'
  },

  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    loading: '⏳',
    ticket: '🎫',
    lock: '🔒',
    unlock: '🔓',
    arrow: '↳',
    sparkle: '✨',
    cart: '🛒',
    gift: '🎁',
    shield: '🛡️'
  },

  settings: {
    defaultCooldown: 3,
    ticketsPerUserDefault: 1
  },

  debug: process.env.DEBUG === 'true'
};
