import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ReusableLoggerService } from './reusable-logger.service';
import { createWinstonConfig, ensureLogDirectory } from './reusable-winston.config';
import { ReusableLoggerOptions } from './interfaces/logger-options.interface';

@Global() // 一旦导入模块，使 ReusableLoggerService 全局可用
@Module({})
export class ReusableLoggerModule {
  /**
   * 异步注册 ReusableLoggerModule。
   * 允许异步配置（例如，从 ConfigService 获取选项）。
   * @param asyncOptions 异步注册的选项。
   * @returns DynamicModule 实例。
   */
  static forRootAsync(asyncOptions: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<ReusableLoggerOptions> | ReusableLoggerOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [ReusableLoggerService];

    // 如果工厂本身需要来自其他模块的提供者，它们应该在 asyncOptions.imports 中
    // 并注入到 asyncOptions.useFactory 中。

    return {
      module: ReusableLoggerModule,
      imports: [
        ...(asyncOptions.imports || []), // 导入 useFactory 所需的模块
        WinstonModule.forRootAsync({
          // 这些导入和注入是为了 WinstonModule 的 useFactory
          imports: asyncOptions.imports, 
          useFactory: async (...args: any[]) => {
            // 1. 使用提供的工厂解析 ReusableLoggerOptions
            const loggerOptions = await asyncOptions.useFactory(...args);
            
            // 2. 如果启用文件日志，确保日志目录存在
            // 这个检查也在 createWinstonConfig 内部，但在这里做确保它早期发生。
            if (loggerOptions.enableFile && loggerOptions.logDir) {
              ensureLogDirectory(loggerOptions.logDir);
            }
            
            // 3. 创建并返回 Winston 特定的配置
            return createWinstonConfig(loggerOptions);
          },
          inject: asyncOptions.inject || [],
        }),
      ],
      providers: providers,
      // 导出 ReusableLoggerService 用于注入，如果需要直接访问 WINSTON_MODULE_PROVIDER，也导出 WinstonModule。
      exports: [ReusableLoggerService, WinstonModule], 
    };
  }
}
