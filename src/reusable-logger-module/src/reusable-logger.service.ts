import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

/**
 * 包装 Winston 的可重用日志服务。
 * 实现 NestJS LoggerService 接口。
 */
@Injectable({ scope: Scope.TRANSIENT }) // TRANSIENT 用于在创建子日志记录器时获得唯一实例
export class ReusableLoggerService implements NestLoggerService {
  private currentContext?: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: WinstonLogger
  ) {}

  public setContext(context: string) {
    this.currentContext = context;
  }

  log(message: any, context?: string, ...meta: any[]): void {
    this.logger.info(message, { context: context || this.currentContext, meta });
  }

  error(message: any, trace?: string | Error, context?: string, ...meta: any[]): void {
    const errorMeta: any = { context: context || this.currentContext, meta };
    if (trace instanceof Error) {
      errorMeta.stack = trace.stack;
      // 如果 Winston 的默认错误格式中还没有，可选择包含 error.name 和 error.message
      // errorMeta.error = { name: trace.name, message: trace.message };
    } else if (typeof trace === 'string' && trace.length > 0) {
       // 如果 trace 是字符串，假设它是预格式化的堆栈或附加详细信息
      errorMeta.trace = trace;
    }
    this.logger.error(message, errorMeta);
  }

  warn(message: any, context?: string, ...meta: any[]): void {
    this.logger.warn(message, { context: context || this.currentContext, meta });
  }

  debug(message: any, context?: string, ...meta: any[]): void {
    this.logger.debug(message, { context: context || this.currentContext, meta });
  }

  verbose(message: any, context?: string, ...meta: any[]): void {
    this.logger.verbose(message, { context: context || this.currentContext, meta });
  }

  // --- 来自原始服务的自定义日志方法 ---

  /**
   * 记录 MQTT 相关日志，优化格式。
   */
  mqtt(level: 'info' | 'debug' | 'warn' | 'error', message: string, data?: any): void {
    const context = 'MqttService'; // 考虑使其可配置或传入
    const meta = data ? { mqttData: data } : {};
    this.logger[level](message, { context, ...meta });
  }

  /**
   * 记录 Redis 相关日志，优化格式。
   */
  redis(level: 'info' | 'debug' | 'warn' | 'error', message: string, data?: any): void {
    const context = 'RedisService';
    const meta = data ? { redisData: data } : {};
    this.logger[level](message, { context, ...meta });
  }

  /**
   * 记录 InfluxDB 相关日志，优化格式。
   */
  influxdb(level: 'info' | 'debug' | 'warn' | 'error', message: string, data?: any): void {
    const context = 'InfluxdbService';
    const meta = data ? { influxdbData: data } : {};
    this.logger[level](message, { context, ...meta });
  }
  
  /**
   * 记录性能相关日志。
   */
  performance(operation: string, duration: number, context?: string, meta?: any): void {
    const perfMessage = `${operation} 执行耗时: ${duration}ms`;
    this.logger.debug(perfMessage, { 
        context: context || 'Performance', 
        operation, 
        duration, 
        ...meta 
    });
  }

  /**
   * 记录应用程序启动日志。
   */
  startup(message: string, meta?: any): void {
    this.log(`🚀 ${message}`, 'Bootstrap', meta);
  }

  /**
   * 记录服务连接状态日志。
   */
  connection(service: string, status: 'connected' | 'disconnected' | 'error', message?: string, meta?: any): void {
    const emoji = status === 'connected' ? '✅' : status === 'disconnected' ? '❌' : '⚠️';
    const logMessage = `${emoji} ${service} ${message || status}`;
    
    const connectionContext = 'ConnectionMonitor';
    if (status === 'error') {
      this.error(logMessage, undefined, connectionContext, meta);
    } else if (status === 'disconnected') {
      this.warn(logMessage, connectionContext, meta);
    } else {
      this.log(logMessage, connectionContext, meta);
    }
  }

  /**
   * 记录数据处理日志。
   */
  dataProcessing(operation: string, count: number, context?: string, meta?: any): void {
    const message = `📊 ${operation}: 已处理 ${count} 项。`;
    this.debug(message, context || 'DataProcessing', {
      operation,
      count,
      ...meta
    });
  }

  /**
   * 创建具有预定义上下文的子日志记录器实例。
   * @param context 子日志记录器的上下文字符串。
   * @returns ReusableChildLogger 实例。
   */
  createChildLogger(context: string): ReusableChildLogger {
    // 这种方法创建一个具有自己上下文的新服务实例。
    // 需要 ReusableLoggerService 为 Scope.TRANSIENT 或使用 ChildLogger 的工厂。
    const child = new ReusableChildLogger(this.logger, context);
    return child;
  }
}

/**
 * 子日志记录器类，自动为日志消息添加上下文。
 * 此版本直接使用父级的 Winston 日志记录器实例，但具有自己的上下文。
 */
export class ReusableChildLogger implements NestLoggerService {
  constructor(
    private readonly winstonLoggerInstance: WinstonLogger,
    private readonly context: string
  ) {}

  log(message: any, ...meta: any[]): void {
    this.winstonLoggerInstance.info(message, { context: this.context, meta });
  }

  error(message: any, trace?: string | Error, ...meta: any[]): void {
     const errorMeta: any = { context: this.context, meta };
    if (trace instanceof Error) {
      errorMeta.stack = trace.stack;
    } else if (typeof trace === 'string' && trace.length > 0) {
      errorMeta.trace = trace;
    }
    this.winstonLoggerInstance.error(message, errorMeta);
  }

  warn(message: any, ...meta: any[]): void {
    this.winstonLoggerInstance.warn(message, { context: this.context, meta });
  }

  debug(message: any, ...meta: any[]): void {
    this.winstonLoggerInstance.debug(message, { context: this.context, meta });
  }

  verbose(message: any, ...meta: any[]): void {
    this.winstonLoggerInstance.verbose(message, { context: this.context, meta });
  }

  // 如果子日志记录器的自定义方法也应该是上下文感知的，请为 ChildLogger 重新实现这些方法
  // 为了简化，这里省略了，但可以通过调用父级方法或直接调用来添加。
  // 示例:
  // performance(operation: string, duration: number, meta?: any): void {
  //   const perfMessage = `${operation} 执行耗时: ${duration}ms`;
  //   this.winstonLoggerInstance.debug(perfMessage, { 
  //       context: this.context, // 子上下文
  //       operation, 
  //       duration, 
  //       ...meta 
  //   });
  // }
}
