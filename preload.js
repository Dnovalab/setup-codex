const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  /**
   * 获取支持的模型列表
   * @returns {Promise<Array<{id: string, name: string, guide: string, registerUrl: string}>>}
   */
  getModelProviders: () => ipcRenderer.invoke('get-model-providers'),

  /**
   * 应用配置
   * @param {{ providerId: string, apiKey: string }} options
   * @returns {Promise<{success: boolean, result: {tool: string, success: boolean, error?: string, requiresProxy?: boolean, proxyInstallCmd?: string, proxyStartupCmd?: string}}>}
   */
  applyConfig: (options) => ipcRenderer.invoke('apply-config', options),

  /** 在浏览器中打开链接 */
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
