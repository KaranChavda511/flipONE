// src/services/logger.js
import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logs folder absolute path (inside project root)
const logDirectory = path.resolve(__dirname, "../../logs");

// Ensure logs folder exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true }); // Create logs folder if missing
}

// Define log file paths
const errorLogPath = path.join(logDirectory, "error.log");
const combinedLogPath = path.join(logDirectory, "combined.log");

// Winston formatting
const { combine, timestamp, errors, printf, json, colorize } = winston.format;

// Development format (colorized logs)
const devFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    return `${timestamp} ${level}: ${stack || message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ""
    }`;
  })
);

// Production format (JSON structured logs)
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

// Create logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  defaultMeta: { service: "user-service" },
  transports: [
    // File logs
    new winston.transports.File({ filename: errorLogPath, level: "error" }),
    new winston.transports.File({ filename: combinedLogPath }),

    // Daily rotating logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDirectory, "%DATE%-combined.log"),
      datePattern: "YYYY-MM-DD",
      level: "info",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logDirectory, "%DATE%-error.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

// Log to console in development mode
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: devFormat,
    })
  );
}

export default logger;
