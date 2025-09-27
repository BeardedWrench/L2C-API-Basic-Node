export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const config = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  includeTimestamp: true,
  useColors: process.env.NODE_ENV !== 'production',
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function getColorForLevel(level: LogLevel): string {
  if (!config.useColors) return '';

  switch (level) {
    case LogLevel.ERROR:
      return colors.red;
    case LogLevel.WARN:
      return colors.yellow;
    case LogLevel.INFO:
      return colors.green;
    case LogLevel.DEBUG:
      return colors.cyan;
    default:
      return colors.bright;
  }
}

function getLevelName(level: LogLevel): string {
  switch (level) {
    case LogLevel.ERROR:
      return 'ERROR';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.DEBUG:
      return 'DEBUG';
    default:
      return 'UNKNOWN';
  }
}

function formatMessage(level: LogLevel, message: string, data?: any): string {
  const timestamp = config.includeTimestamp ? new Date().toISOString : '';
  const levelName = getLevelName(level);
  const color = getColorForLevel(level);
  const reset = config.useColors ? colors.reset : '';

  let logMessage = '';

  if (timestamp) {
    logMessage += `${colors.dim}[${timestamp}]${reset} `;
  }

  logMessage = `${color}${colors.bright}[${levelName}]${reset} ${message}`;

  if (data !== undefined) {
    logMessage = ` ${colors.dim}${JSON.stringify(data, null, 2)}${reset}`;
  }
  return logMessage;
}

function log(level: LogLevel, message: string, data?: any): void {
  if (level > config.level) return;

  const formattedMessage = formatMessage(level, message, data);

  switch (level) {
    case LogLevel.ERROR:
      console.error(formattedMessage);
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage);
      break;
    case LogLevel.INFO:
      console.info(formattedMessage);
      break;
    case LogLevel.DEBUG:
      console.debug(formattedMessage);
      break;
    default:
      console.log(formatMessage);
  }
}

export const logger = {
  error: (message: string, data?: any) => log(LogLevel.ERROR, message, data),
  warn: (message: string, data?: any) => log(LogLevel.WARN, message, data),
  info: (message: string, data?: any) => log(LogLevel.INFO, message, data),
  debug: (message: string, data?: any) => log(LogLevel.DEBUG, message, data),
  setLevel: (level: LogLevel) => {
    config.level = level;
  },
  getLevel: () => config.level,
  isLevelEnabled: (level: LogLevel) => level <= config.level,
};
