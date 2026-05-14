const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ===================== 模型提供商配置（Codex 版） =====================
const PROVIDERS = [
  {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    registerUrl: 'https://platform.deepseek.com/sign_in',
    guide: '1. 打开 DeepSeek 官网并注册账号\n2. 登录后进入 API Keys 页面\n3. 点击"创建 API Key"，复制生成的密钥（以 sk- 开头）',
    codex: {
      proxyPort: 4446,
      proxyUpstream: 'https://api.deepseek.com/v1',
      configToml: () => `# codex-relay config
[model_providers.codex-proxy]
api_type = "openai"
api_base = "http://127.0.0.1:4446/v1"
api_key = "sk-codex-relay"`,
      authJson: () => JSON.stringify({ OPENAI_API_KEY: 'sk-placeholder' }, null, 2),
      envFile: (apiKey) => `# Codex Relay 配置
CODEX_RELAY_API_KEY=${apiKey}
CODEX_RELAY_UPSTREAM=https://api.deepseek.com/v1
`
    }
  },
  {
    id: 'qwen',
    name: '通义千问 (阿里云)',
    registerUrl: 'https://bailian.console.aliyun.com/',
    guide: '1. 打开阿里云百炼平台并登录（用支付宝/手机号注册）\n2. 开通"模型服务"后进入 API-KEY 管理\n3. 创建 API Key，复制保存',
    codex: {
      proxyPort: 4448,
      proxyUpstream: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      configToml: () => `# codex-relay config
[model_providers.codex-proxy]
api_type = "openai"
api_base = "http://127.0.0.1:4448/v1"
api_key = "sk-codex-relay"`,
      authJson: () => JSON.stringify({ OPENAI_API_KEY: 'sk-placeholder' }, null, 2),
      envFile: (apiKey) => `# Codex Relay 配置
CODEX_RELAY_API_KEY=${apiKey}
CODEX_RELAY_UPSTREAM=https://dashscope.aliyuncs.com/compatible-mode/v1
`
    }
  },
  {
    id: 'glm',
    name: '智谱 GLM (智谱AI)',
    registerUrl: 'https://open.bigmodel.cn/usercenter/project-manage',
    guide: '1. 打开智谱 AI 官网并注册（国内手机号即可）\n2. 登录后进入"项目管理"页面\n3. 创建项目或查看已有项目，复制 API Key',
    codex: {
      proxyPort: 4447,
      proxyUpstream: 'https://open.bigmodel.cn/api/paas/v4',
      configToml: () => `# codex-relay config
[model_providers.codex-proxy]
api_type = "openai"
api_base = "http://127.0.0.1:4447/v1"
api_key = "sk-codex-relay"`,
      authJson: () => JSON.stringify({ OPENAI_API_KEY: 'sk-placeholder' }, null, 2),
      envFile: (apiKey) => `# Codex Relay 配置
CODEX_RELAY_API_KEY=${apiKey}
CODEX_RELAY_UPSTREAM=https://open.bigmodel.cn/api/paas/v4
`
    }
  }
];

// ===================== 窗口 =====================
function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 680,
    resizable: false,
    maximizable: false,
    title: 'OpenAI Codex 一键配置',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools({ mode: 'bottom' });
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// ===================== IPC: 获取模型列表 =====================
ipcMain.handle('get-model-providers', async () => {
  return PROVIDERS.map(p => ({
    id: p.id,
    name: p.name,
    guide: p.guide,
    registerUrl: p.registerUrl
  }));
});

// ===================== IPC: 应用配置（仅 Codex） =====================
ipcMain.handle('apply-config', async (event, options) => {
  const { providerId, apiKey } = options;
  const provider = PROVIDERS.find(p => p.id === providerId);
  if (!provider) throw new Error(`未知模型: ${providerId}`);

  const configDir = path.join(os.homedir(), '.codex');
  const paths = {
    config: path.join(configDir, 'config.toml'),
    auth: path.join(configDir, 'auth.json'),
    env: path.join(configDir, '.env')
  };

  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(paths.config, provider.codex.configToml(), 'utf-8');
    fs.writeFileSync(paths.auth, provider.codex.authJson(), 'utf-8');
    fs.writeFileSync(paths.env, provider.codex.envFile(apiKey), 'utf-8');

    return {
      success: true,
      result: {
        tool: 'Codex',
        success: true,
        requiresProxy: true,
        proxyInstallCmd: 'pip install codex-relay',
        proxyStartupCmd: `CODEX_RELAY_API_KEY=${apiKey} CODEX_RELAY_UPSTREAM=${provider.codex.proxyUpstream} CODEX_RELAY_PORT=${provider.codex.proxyPort} codex-relay`
      }
    };
  } catch (err) {
    return {
      success: false,
      result: {
        tool: 'Codex',
        success: false,
        requiresProxy: true,
        error: err.message
      }
    };
  }
});

// ===================== IPC: 打开外部链接 =====================
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});
