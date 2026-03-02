import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"
import path from "path"

export interface ILogger {
  info(message: string, meta?: any): void
  error(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  debug(message: string, meta?: any): void
  child(meta: any): ILogger // ILogger with custom metadata
}

const WinstonLoggerAdapter = (modulePath: string): ILogger => {
  // setup logger
  const orderedJson = winston.format((info) => {
    const { timestamp, level, service, rute, message, ...rest } = info

    return {
      timestamp,
      level,
      service,
      rute,
      message,
      ...rest
    }
  })

  const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    orderedJson(),
    winston.format.json({ deterministic: false })
  )

  const logger = winston.createLogger({
    level: "info",
    format: fileFormat,
    defaultMeta: {
      service: "monitoreo-etf"
    },
    transports: [
      // new winston.transports.Console({
      //   format:winston.format.json()
      // }),
      // new winston.transports.File({ filename: 'error.log', level: 'error' }),
      // new winston.transports.File({ filename: 'combined.log' }),
      new DailyRotateFile({
        filename: "logs/app-errors-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "14d",
        level: "error"
      }),
      new DailyRotateFile({
        filename: "logs/app-%DATE%.log",
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "14d",
        level: "info"
      })
    ]
  })

  const devConsoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss" }), // Timestamp más corto para leer
    winston.format.printf(({ timestamp, level, message, rute, function: fn, service, ...meta }) => {
      // Construimos un string limpio
      const pathInfo = rute ? `[${rute}]` : ""
      const funcInfo = fn ? `[${fn}]` : ""
      const serviceInfo = service ? `[${service}]` : ""

      // Si hay meta extra (como errores), los mostramos al final
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""
      return `${timestamp} ${level} - ${serviceInfo}: ${pathInfo}${funcInfo} ${message}${metaStr}`
    })
  )

  const consoleFormat =
    process.env.NODE_ENV === "production"
      ? fileFormat
      : winston.format.combine(winston.format.colorize(), winston.format.simple(), devConsoleFormat)

  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === "production" ? "info" : "debug"
    })
  )

  const getLogger = (modulePath: string) => {
    const relativePath = path.relative(process.cwd(), modulePath)

    return logger.child({
      rute: relativePath
    })
  }

  const loggerConfigured = getLogger(modulePath)

  const info = (message: string, meta?: any) => loggerConfigured.info(message, meta)
  const error = (message: string, meta?: any) => loggerConfigured.error(message, meta)
  const warn = (message: string, meta?: any) => loggerConfigured.warn(message, meta)
  const debug = (message: string, meta?: any) => loggerConfigured.debug(message, meta)
  const child = (meta: any) => {
    return loggerConfigured.child(meta)
  }

  return {
    info,
    error,
    warn,
    debug,
    child
  }
}

const getLogger = (modulePath: string): ILogger => {
  return WinstonLoggerAdapter(modulePath)
}
export { getLogger }
