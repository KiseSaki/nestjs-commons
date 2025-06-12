# NestJS Commons

自用的包含可重用 NestJS 模块的通用库。

## 📦 包含的模块

### 🔍 Reusable Logger Module

基于 Winston 的高度可配置日志模块，提供丰富的日志功能和格式化选项。

**特性：**
- 支持控制台和文件日志输出
- 日志文件自动轮换和压缩
- 多种日志级别（error, warn, info, debug, verbose）
- 专门的日志方法（MQTT, Redis, InfluxDB 等）
- 性能监控日志
- 连接状态监控
- 子日志记录器支持
- 全局可用（使用 @Global 装饰器）
