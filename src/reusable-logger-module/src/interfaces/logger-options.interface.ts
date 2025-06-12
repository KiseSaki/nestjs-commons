/**
 * ReusableLoggerModule 的配置选项。
 */
export interface ReusableLoggerOptions {
  /**
   * 要记录的最小日志级别。
   * 示例: 'error', 'warn', 'info', 'debug', 'verbose', 'silly'。
   * @default 'info'
   */
  level?: string;

  /**
   * 启用或禁用控制台日志。
   * @default true
   */
  enableConsole?: boolean;

  /**
   * 启用或禁用文件日志。
   * @default false
   */
  enableFile?: boolean;

  /**
   * 存储日志文件的目录。
   * 如果 'enableFile' 为 true 则必需。
   * @default 'logs'
   */
  logDir?: string;

  /**
   * 保留的最大日志文件数（用于轮换）。
   * @default 10
   */
  maxFiles?: number;

  /**
   * 单个日志文件在轮换前的最大大小（例如，'20MB', '1G'）。
   * @default '10MB'
   */
  maxSize?: string;

  /**
   * 日志文件每日轮换的日期模式。
   * @default 'YYYY-MM-DD'
   */
  datePattern?: string;

  /**
   * 是否压缩归档的日志文件。
   * @default true
   */
  zippedArchive?: boolean;

  /**
   * Node 环境（例如，'development', 'production'）。
   * 影响控制台格式和调试日志的默认行为。
   * @default 'development'
   */
  nodeEnv?: string;
}
