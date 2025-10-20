const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 保持对窗口对象的全局引用，否则窗口会被自动关闭
let mainWindow;

function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: '芯片数据实时接收系统',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false // 允许跨域请求
        },
        icon: path.join(__dirname, 'icon.ico')
    });

    // 加载应用的index.html
    mainWindow.loadFile('index.html');

    // 打开开发者工具
    // mainWindow.webContents.openDevTools();

    // 窗口关闭时触发
    mainWindow.on('closed', function() {
        // 取消引用窗口对象，如果你的应用支持多窗口，
        // 通常会把多个窗口对象存放在一个数组里，
        // 与此同时，你应该删除相应的元素。
        mainWindow = null;
    });
}

// Electron 会在初始化完成后并准备好创建浏览器窗口时调用这个方法
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function() {
        // 在macOS上，当单击dock图标并且没有其他窗口打开时，
        // 通常在应用程序中重新创建一个窗口。
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', function() {
    // 在macOS上，除非用户用Cmd + Q确定退出，
    // 否则绝大部分的应用及其菜单栏会保持活动状态。
    if (process.platform !== 'darwin') app.quit();
});

// 处理文件保存请求
ipcMain.handle('save-file', async (event, { content, filePath }) => {
    try {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return true;
    } catch (error) {
        console.error('保存文件失败:', error);
        return false;
    }
});

// 处理文件读取请求
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        console.error('读取文件失败:', error);
        return null;
    }
});

// 处理获取应用路径请求
ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
});
