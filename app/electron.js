'use strict';
const {ipcMain} = require('electron');
const electron = require('electron');
const Dialog = require('electron').dialog;
const app = electron.app;// 控制应用生命周期的模块。
const BrowserWindow = electron.BrowserWindow;// 创建原生浏览器窗口的模块
const Menu = electron.Menu;
const Tray = electron.Tray;
const path = require('path');

// 保持一个对于 window 对象的全局引用，不然，当 JavaScript 被 GC，
// window 会被自动地关闭
let chatWindow=null,tray=null,config = {};

//创建聊天窗口
function createChatWindow(){
    chatWindow= new BrowserWindow({
        width: 860,
        height: 590,
        frame:false,
        autoHideMenuBar:true,
        title:"聊天窗口"
    });
    //加载聊天窗口
    if (process.env.NODE_ENV === 'development') {
        config=require('../config');
        chatWindow.loadURL(`http://localhost:${config.port}/#/chatMainWindow`);
        //打开开发者工具条
        chatWindow.openDevTools();
    } 
    else {
        chatWindow.loadURL(`file://${__dirname}/dist/index.html#/chatMainWindow`);
    }
    tray = new Tray(path.join(__dirname, 'img/icon16.png'));
    const trayMenuTemplate = [
        // 恢复窗口
        {label: '显示主窗口',accelerator: 'CmdOrCtrl+R',click: function() {chatWindow.restore();chatWindow.show();}}, 
        {label: '最小化窗口',accelerator: 'CmdOrCtrl+M',click: function() {chatWindow.minimize();}}, 
        {type: 'separator'}, {label: '关于我们',accelerator: 'CmdOrCtrl+A',click: function() {}}, 
        {type: 'separator'}, {
            label: '退出',
            accelerator: 'CmdOrCtrl+Q',
            click: function() {
                Dialog.showMessageBox({
                    type: 'question',
                    buttons: ['确定', '取消'],
                    title: '退出linkdood',
                    cancelId: 99,
                    message: '确定退出吗?'
                }, 
                function(response) {
                    if (response===0) app.quit();
                });
            }
        }
    ];
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setToolTip('信源豆豆');
    tray.setHighlightMode(true);
    tray.on('click', function() {
        chatWindow.restore();// 显示主窗口
        chatWindow.show();// 获取焦点
    });
    tray.setContextMenu(contextMenu);
    //聊天窗口关闭事件
    chatWindow.on('close', (event) => {
        //关闭应用
        app.quit();
    });
}

// 当 Electron 完成了初始化并且准备创建浏览器窗口的时候
// 这个方法就被调用
app.on('ready', createChatWindow);

// 当所有窗口被关闭了，退出。
app.on('window-all-closed', () => {
    // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
    // 应用会保持活动状态
    if (process.platform !== 'darwin') {app.quit();}
});

app.on('activate', () => {
    if (chatWindow!==null) {
        chatWindow.show();
    }
});

//监听程序最小化请求
ipcMain.on('main-window-message', function(event, arg) {
  console.log(`收到主进程消息:${arg}`);
  event.returnValue = 'ok';
  switch (arg){
      case "minimize":chatWindow.minimize();break;
      case "close":chatWindow.hide();break;
  }  
});
