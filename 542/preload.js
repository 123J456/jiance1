const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
    // 文件操作
    saveFile: (content, filePath) => ipcRenderer.invoke('save-file', { content, filePath }),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    
    // 获取应用路径
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    
    // 显示通知
    showNotification: (title, body) => {
        new Notification(title, { body });
    }
});
