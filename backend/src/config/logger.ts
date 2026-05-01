import winston from "winston";
import { env } from "./env";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info: winston.Logform.TransformableInfo) =>
      `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "glamo-nepal-api" },
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === "production" ? logFormat : consoleFormat,
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  ],
});

if (env.NODE_ENV === "test") {
  logger.silent = true;
}