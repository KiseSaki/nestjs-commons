# 可重用的 NestJS 日志模块 (Winston)

此模块为 NestJS 应用程序提供可配置的日志服务，使用 Winston 进行日志记录。

## 功能特性

- 可配置的日志级别 (info, warn, error, debug, verbose)
- 开发环境下带颜色的控制台日志
- 带日轮换、最大大小和最大文件数的文件日志
- 适用于日志管理系统的 JSON 格式文件日志
- 可自定义的日志目录和文件命名模式
- 带自动上下文的子日志记录器
- 实现 NestJS `LoggerService` 接口

## 安装 / 集成

1.  **复制模块**: 将整个 `reusable-logger-module` 目录复制到 NestJS 项目中（例如，放在 `src/shared/logger` 或类似位置）。
2.  **安装依赖**: 确保项目具有必要的依赖：
    ```bash
    npm install winston nest-winston winston-daily-rotate-file
    # 或者
    yarn add winston nest-winston winston-daily-rotate-file
    # 或者
    pnpm add winston nest-winston winston-daily-rotate-file
    ```

## 配置

将 `ReusableLoggerModule` 导入到应用程序的根模块中（例如，`AppModule`）。使用静态 `forRootAsync` 方法提供配置。

**示例 `app.module.ts`：**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 假设使用 @nestjs/config
import { ReusableLoggerModule, ReusableLoggerOptions } from './path-to/reusable-logger-module'; // 调整路径

@Module({
  imports: [
    ConfigModule.forRoot({
      // 配置设置
      isGlobal: true,
      // 示例: 为日志记录器加载环境变量
      // envFilePath: '.env',
    }),
    ReusableLoggerModule.forRootAsync({
      imports: [ConfigModule], // 如果在 useFactory 中使用 ConfigService，则导入 ConfigModule
      useFactory: async (configService: ConfigService): Promise<ReusableLoggerOptions> => ({
        level: configService.get<string>('LOG_LEVEL', 'info'),
        enableConsole: configService.get<boolean>('LOG_CONSOLE_ENABLED', process.env.NODE_ENV !== 'production'),
        enableFile: configService.get<boolean>('LOG_FILE_ENABLED', true),
        logDir: configService.get<string>('LOG_DIR', 'logs'),
        maxFiles: configService.get<number>('LOG_MAX_FILES', 30),
        maxSize: configService.get<string>('LOG_MAX_SIZE', '20MB'),
        datePattern: configService.get<string>('LOG_DATE_PATTERN', 'YYYY-MM-DD'),
        zippedArchive: configService.get<boolean>('LOG_ZIPPED_ARCHIVE', true),
        nodeEnv: configService.get<string>('NODE_ENV', 'development'),
      }),
      inject: [ConfigService],
    }),
    // ... 其他模块
  ],
})
export class AppModule {}
```

## 使用方法

将 `ReusableLoggerService` 注入到服务或控制器中：

```typescript
import { Injectable } from '@nestjs/common';
import { ReusableLoggerService } from './path-to/reusable-logger-module'; // 调整路径

@Injectable()
export class MyService {
  private readonly logger: ReusableLoggerService;

  constructor(private readonly baseLogger: ReusableLoggerService) {
    this.logger = baseLogger.createChildLogger(MyService.name); // 创建带上下文的子日志记录器
  }

  doSomething() {
    this.logger.log('正在执行某些操作...');
    this.logger.debug('执行某些操作的调试信息。', { additionalData: 'value' });
    try {
      // ...
    } catch (error) {
      this.logger.error('执行某些操作失败', error);
    }
  }
}
```

## 配置选项 (`ReusableLoggerOptions`)

- `level` (string, 可选): 最小日志级别。默认为 `'info'`。
- `enableConsole` (boolean, 可选): 启用控制台日志。默认为 `true`。
- `enableFile` (boolean, 可选): 启用文件日志。默认为 `false`。
- `logDir` (string, 可选): 日志文件目录。默认为 `'logs'`。如果 `enableFile` 为 `true` 则必需。
- `maxFiles` (number, 可选): 保留的最大日志文件数。默认为 `10`。
- `maxSize` (string, 可选): 日志文件的最大大小（例如，`'20MB'`）。默认为 `'10MB'`。
- `datePattern` (string, 可选): 日志文件轮换的日期模式。默认为 `'YYYY-MM-DD'`。
- `zippedArchive` (boolean, 可选): 压缩归档的日志文件。默认为 `true`。
- `nodeEnv` (string, 可选): 应用程序环境（`'development'`、`'production'`）。默认为 `'development'`。影响控制台日志格式和默认调试文件日志。
