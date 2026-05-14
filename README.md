# OpenAI Codex 国产模型一键配置

为 **OpenAI Codex** 桌面版配置国产 AI 模型，国内直连，无需翻墙。

## 原理

Codex 桌面版依赖 OpenAI Responses API，国产模型不兼容此协议。
方案是用 [codex-relay](https://pypi.org/project/codex-relay/) 在本地启动代理做协议转换。

## 支持的模型

| 模型 | 提供商 |
|------|--------|
| DeepSeek (deepseek-v4-pro) | 深度求索 |
| 通义千问 (qwen-max) | 阿里云 |
| GLM (glm-4) | 智谱 AI |

## 使用

```bash
npm install
npm start
```

1. 选择模型提供商
2. 粘贴 API Key
3. 一键写入配置
4. 按照提示启动本地代理 → 打开 Codex

## 打包

```bash
npm run build:mac  # macOS .dmg
npm run build:win  # Windows .exe
```
