/**
 * Logger simples e sem dependências externas.
 * Formata mensagens no console com timestamp, cor e rótulo por nível.
 */

const colors = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function timestamp() {
  return new Date().toLocaleString('pt-BR', { hour12: false });
}

function print(color, label, message) {
  console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${color}[${label}]${colors.reset} ${message}`);
}

module.exports = {
  info: (message) => print(colors.cyan, 'INFO', message),
  success: (message) => print(colors.green, 'SUCESSO', message),
  warn: (message) => print(colors.yellow, 'AVISO', message),
  error: (message) => print(colors.red, 'ERRO', message),
  debug: (message) => {
    if (process.env.DEBUG === 'true') print(colors.magenta, 'DEBUG', message);
  }
};
