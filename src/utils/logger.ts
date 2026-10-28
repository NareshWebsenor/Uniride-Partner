import { LOG_LEVEL } from '@env';

type Level = 'debug' | 'info' | 'warn' | 'error';
type Details = {
  scope?: string;
  code?: string;
  status?: number;
  hasResponse?: boolean;
  durationMs?: number;
};

const levels: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function write(level: Level, event: string, details?: Details) {
  if (!__DEV__) {
    return;
  }
  const configured = LOG_LEVEL as Level | undefined;
  const threshold = configured && configured in levels ? levels[configured] : 0;
  if (levels[level] < threshold) {
    return;
  }
  // Call sites supply event codes, never request bodies, tokens or user data.
  console[level]({ level, event, ...details });
}

export const logger = {
  debug: (event: string, details?: Details) => write('debug', event, details),
  info: (event: string, details?: Details) => write('info', event, details),
  warn: (event: string, details?: Details) => write('warn', event, details),
  error: (event: string, details?: Details) => write('error', event, details),
};
