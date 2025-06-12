import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { ReusableLoggerOptions } from './interfaces/logger-options.interface';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 确保日志目录存在。
 * 如果不存在则递归创建。
 * @param logDir 日志目录路径。
 */
export const ensureLogDirectory = (logDir: string): void => {
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (error) {
      // 如果目录创建失败，回退到控制台日志
      console.error(`创建日志目录失败: ${logDir}。文件日志将被禁用或失败。`, error);
    }
  }
};

/**
 * 基于提供的选项创建 Winston 日志记录器配置。
 * @param options 日志记录器的配置选项。
 * @returns Winston 日志记录器选项。
 */
export const createWinstonConfig = (options: ReusableLoggerOptions): winston.LoggerOptions => {
  const logLevel = options.level || 'info';
  const enableConsole = options.enableConsole !== undefined ? options.enableConsole : true;
  const enableFile = options.enableFile || false;
  const logDir = options.logDir || 'logs';
  const maxFiles = options.maxFiles || 10;
  const maxSize = options.maxSize || '10MB';
  const datePattern = options.datePattern || 'YYYY-MM-DD';
  const zippedArchive = options.zippedArchive !== undefined ? options.zippedArchive : true;
  const nodeEnv = options.nodeEnv || 'development';
  const isProduction = nodeEnv === 'production';

  // 文件日志格式 (JSON)
  const fileLogFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
      let logEntry: any = {
        timestamp,
        level: level.toUpperCase(),
        message,
      };
      if (context) {
        logEntry.context = context;
      }
      if (meta && Object.keys(meta).length > 0) {
        logEntry = { ...logEntry, ...meta };
      }
      if (stack) {
        logEntry.stack = stack;
      }
      return JSON.stringify(logEntry);
    })
  );
  
  // 控制台日志格式（基于文本，开发环境带颜色）
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: isProduction ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    ...(isProduction ? [] : [winston.format.colorize({ all: true })]), // 仅在非生产环境下着色
    nestWinstonModuleUtilities.format.nestLike('ReusableApp', { // 如果需要，应用名称可配置
      colors: !isProduction,
      prettyPrint: !isProduction,
    }),
  );


  const transports: winston.transport[] = [];

  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        level: isProduction ? 'info' : logLevel, // 生产环境控制台可能不那么详细
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
      })
    );
  }

  if (enableFile) {
    if (!logDir) {
        console.error("未指定日志目录 ('logDir')，但启用了文件日志 ('enableFile')。文件日志将被跳过。");
    } else {
        ensureLogDirectory(logDir); // 在设置文件传输器之前确保目录存在

        // 错误日志
        transports.push(
          new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            level: 'error',
            format: fileLogFormat,
            datePattern,
            zippedArchive,
            maxSize,
            maxFiles: maxFiles * 2, // 保留错误日志更长时间
            handleExceptions: true,
            handleRejections: true,
          })
        );

        // 警告日志
        transports.push(
          new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'warn-%DATE%.log'),
            level: 'warn',
            format: fileLogFormat,
            datePattern,
            zippedArchive,
            maxSize,
            maxFiles,
          })
        );
        
        // 信息日志（以及更高级别，如果没有被特定的错误/警告传输器捕获）
        transports.push(
          new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'info-%DATE%.log'),
            level: 'info', 
            format: fileLogFormat,
            datePattern,
            zippedArchive,
            maxSize,
            maxFiles,
          })
        );

        // 所有级别的综合日志（可选，可能很详细）
        transports.push(
          new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'combined-%DATE%.log'),
            format: fileLogFormat,
            level: logLevel, // 使用通用 logLevel 进行综合
            datePattern,
            zippedArchive,
            maxSize,
            maxFiles,
          })
        );

        // 调试日志（仅在非生产环境或通过 logLevel 显式设置时）
        if (!isProduction || logLevel === 'debug' || logLevel === 'verbose' || logLevel === 'silly') {
          transports.push(
            new winston.transports.DailyRotateFile({
              filename: path.join(logDir, 'debug-%DATE%.log'),
              level: 'debug', // 捕获调试和更详细的级别
              format: fileLogFormat,
              datePattern,
              zippedArchive,
              maxSize,
              maxFiles,
            })
          );
        }
    }
  }

  return {
    level: logLevel,
    format: winston.format.combine(winston.format.splat(), winston.format.simple()), // 默认格式，各个传输器会覆盖
    transports,
    exitOnError: false, // 不要在处理的异常上退出
  };
};

/**
 * 从 NestJS 到 Winston 的日志级别映射。
 * 如果此日志记录器被设置为默认 NestJS 日志记录器，则很有用。
 */
export const nestToWinstonLogLevel: Record<string, string> = {
  log: 'info',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
  verbose: 'verbose', // Winston 使用 'verbose'，NestJS 'verbose' 可以映射到 Winston 'silly' 或 'verbose'
};
