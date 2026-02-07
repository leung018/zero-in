export const createLogger = (module: string = 'Zero In') => ({
  debug: (message: string, ...args: unknown[]) => {
    console.debug(`[${module}]`, message, ...args)
  },
  info: (message: string, ...args: unknown[]) => {
    console.info(`[${module}]`, message, ...args)
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[${module}]`, message, ...args)
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[${module}]`, message, ...args)
  }
})
