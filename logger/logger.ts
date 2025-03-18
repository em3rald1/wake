type ColorDictionary = {
  info?:    string;
  warning?: string;
  error?:   string;
  reset?:   string;
};

type LoggerOptions = {
  logger: (message: string) => void;
  colors?: ColorDictionary;
  colors_support?: boolean;
};

type Loggers = {
  info:    (message: string) => void;
  warning: (message: string) => void;
  error:   (message: string) => void;
};

const DEFAULT_COLORS: ColorDictionary = {
  info:    "\x1b[34m",
  warning: "\x1b[33m",
  error:   "\x1b[31m",
  reset:   "\x1b[0m"
};

type LoggerTypes = 'info' | 'error' | 'warning';

export function construct_logger(options: LoggerOptions): Loggers {
  const logger_options: LoggerOptions = {
    colors: {
      'info':    options.colors?.info    ||    DEFAULT_COLORS.info,
      'warning': options.colors?.warning || DEFAULT_COLORS.warning,
      'error':   options.colors?.error   ||   DEFAULT_COLORS.error,
      'reset':   options.colors?.reset   ||   DEFAULT_COLORS.reset
    },
    ...options
  };

  return {
    info:    (message: string) => log('info',    message, logger_options),
    error:   (message: string) => log('error',   message, logger_options),
    warning: (message: string) => log('warning', message, logger_options)
  };
};

const new_date = () => new Date().toLocaleString();

const color =
  (color_key: keyof ColorDictionary, colors: ColorDictionary, colors_support?: boolean) =>
    colors_support ? colors[color_key] : "";

function log(type: LoggerTypes, message: string, options: LoggerOptions) {
  const start_color = color(type,    options.colors!, options.colors_support);
  const reset_color = color('reset', options.colors!, options.colors_support);

  options.logger(`[${start_color}${type} : ${new_date()}${reset_color}] ${message}`);
}
