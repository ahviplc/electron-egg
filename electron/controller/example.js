'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { Controller, Utils } = require('ee-core');
const electronApp = require('electron').app;
const {
  dialog, shell, BrowserView, BrowserWindow,
  Notification, powerMonitor, screen, nativeTheme, desktopCapturer
} = require('electron');
const dayjs = require('dayjs');

let myTimer = null;
let browserViewObj = null;
let notificationObj = null;

// 这是主进程的app
// 此写法可以触发
// electronApp.on('ready', () => {
//   console.log("===== electron/controller/example.js electronApp ready =====")
// })

/**
 * 示例控制器
 * @class
 */
class ExampleController extends Controller {

  constructor(ctx) {
    super(ctx);
  }

  /**
   * 所有方法接收两个参数
   * @param args 前端传的参数
   * @param event - ipc通信时才有值。invoke()方法时，event == IpcMainInvokeEvent; send()/sendSync()方法时，event == IpcMainEvent
   */

  // =================================================================================================================================
  // LC Diy Code

  /**
   * 接收渲染进程的通信 改变窗口的位置 实现拖拽效果 这是兼容win和mac双平台的办法
   * 参数说明
   * { name: 'win-camera',this_x:  this_x,this_y:  this_y}
   * name 窗口名称
   * this_x 偏移量x
   * this_y 偏移量y
   *
   * @param args
   * @param event
   */
  makeItDraggable(args, event) {
    // 通过窗口名称获取此窗口的 BrowserWindow
    let this_BrowserWindow = this._getBrowserWindow(args.name);
    // 获取原窗口的位置 x y
    let firstPositionElement = this_BrowserWindow.getPosition()[0];
    let secondPositionElement = this_BrowserWindow.getPosition()[1];
    // 通过偏移量计算得出拖动之后的现在位置
    var now_x = firstPositionElement + args.this_x;
    var now_y = secondPositionElement + args.this_y;
    // 重新设置窗口的位置
    this_BrowserWindow.setPosition(now_x, now_y)
    console.log('===== electron/controller/example.js|ExampleController.makeItDraggable ', '原位置=> ', firstPositionElement, secondPositionElement, ' 偏移量=> ', args.this_x, args.this_y, ' 现在位置=> ', now_x, now_y,)
    // 执行成功 返回true
    return true
  }

  /**
   * 更改 BrowserWindow 的相关样式
   * https://www.electronjs.org/zh/docs/latest/api/browser-window
   * https://www.bootwiki.com/electron/electron-browser-window.html
   *
   * 窗口样式借鉴 https://gitee.com/xt-gitee/icamera/blob/master/main.js
   *
   * 一些窗口配置项
   * roundedCorners boolean (可选) macOS - 无边框窗口在 macOS 上，是否应该有圆角。 默认值为 true。 属性设置为 false ，将阻止窗口是可全屏的。
   * frame boolean (可选) - 设置为 false 时可以创建一个无边框窗口 默认值为 true。 | 可以去掉 顶部导航 去掉关闭|最大化|最小化|按钮
   * movable boolean 设置用户是否可以移动窗口。 在Linux上不起作用。
   * resizable boolean (可选) - 窗口大小是否可调整。 默认值为 true。
   * transparent boolean (可选) - 使窗口 透明。 默认值为 false. 在Windows上，仅在无边框窗口下起作用。| 使无框窗口透明
   * alwaysOnTop boolean (可选) - 窗口是否永远在别的窗口的上面。 默认值为 false.
   * show boolean (可选) - 窗口是否在创建时显示。 默认值为 true。
   *
   * 传入参数说明 {name: 'win-camera', height: 250, width: 250}
   * name 窗口名称
   * height 高
   * width 宽
   *
   * @param args
   */
  modifyBrowserWindowStyle(args, event) {
    let this_BrowserWindow = this._getBrowserWindow(args.name);
    // console.log(this_BrowserWindow);

    // 最大化窗口。 如果窗口尚未显示，该方法也会将其显示 (但不会聚焦)。
    // this_BrowserWindow.maximize()

    // 设置窗口的背景颜色
    // 透明的背景颜色【#00000000】
    this_BrowserWindow.setBackgroundColor('#00000000')
    // console.log(this_BrowserWindow.getBackgroundColor());

    // 调整窗口的 width 和 height
    // 从前端传过来获取
    this_BrowserWindow.setSize(args.width, args.height)

    // 启动或停止闪烁窗口, 以吸引用户的注意
    this_BrowserWindow.flashFrame(true)

    // 设置可以手动调整窗口大小
    // 设置用户是否可以手动调整窗口大小
    // this_BrowserWindow.setResizable(false)

    // 设置用户是否可以移动窗口。 在Linux上不起作用
    this_BrowserWindow.setMovable(true)

    // 居中
    this_BrowserWindow.center()

    // 设置窗口是否应始终显示在其他窗口的前面
    this_BrowserWindow.setAlwaysOnTop(true)

    // 让窗口不在任务栏中显示
    this_BrowserWindow.setSkipTaskbar(false)

    // 取消工具栏
    // 设置窗口菜单栏是否自动隐藏。 一旦设置，菜单栏将只在用户单击 Alt 键时显示。
    this_BrowserWindow.setAutoHideMenuBar(true)
    // 设置菜单栏是否可见。 如果菜单栏自动隐藏，用户仍然可以通过单击 Alt 键来唤出菜单栏。
    this_BrowserWindow.setMenuBarVisibility(false)
    // 隐藏顶部菜单
    // this_BrowserWindow.setMenu(null);

    // 设置 transparent 和 frame 此页面的方法【createWindow (args)】也进行了相关的代码处理
    // 无边框窗口 【https://www.electronjs.org/zh/docs/latest/api/frameless-window】
    // 【frontend/src/views/base/window/Index.vue:61】
    // 此窗口忽略所有鼠标事件 设置为 false 点击将无法穿透窗口 设置为 true 点击可穿透窗口
    this_BrowserWindow.setIgnoreMouseEvents(false)

    // 事件监听 生效的
    this_BrowserWindow.on('minimize', () => {
      console.log('===== electron/controller/example.js', ' modifyBrowserWindowStyle()', ' 窗口最小化时触发 =====')
    })

    // debug
    // this_BrowserWindow.webContents.toggleDevTools()

    // 最后将其show出来 不写也会生效前面的配置
    // this_BrowserWindow.show()

    return true;
  }

  /**
   * 获取对应 BrowserWindow 通过窗口名称name
   * @param this_name 窗口名称
   */
  _getBrowserWindow(this_name) {
    // 使用日志记录功能 logger
    // this.app === eeApp;
    this.app.logger.info('===== electron/controller/example.js|ExampleController.getBrowserWindow')

    // 插件模块，扩展 app对象功能
    // 获取 window 插件
    const addonWindow = this.app.addon.window;

    // 主窗口的name默认是main，其它窗口name开发者自己定义
    const name = this_name;
    // 先获取id
    const id = addonWindow.getWCid(name);

    // console.log(id,name)

    // 实际移除
    // 通过窗口的id 返回 BrowserWindow | null - 带有给定 id 的窗口。
    const thisBrowserWindow = BrowserWindow.fromId(id);
    return thisBrowserWindow;
  }

  // 快速通知 只是输出标题和内容
  // 参数示例 {title: '通知', body: '退出直播'}
  showNotificationOnlyTitleANDBody(arg, event) {
    new Notification({title: arg.title, body: arg.body}).show()
  }

  // 获取所有可以被捕获的独立窗口
  async openCamera(args, event) {
    // 这是传来的参数
    // console.log(args)

    const data = {
      msg: '',
      DesktopCapturerSourceList: []
    }

    // 获取了所有可以被捕获的独立窗口
    const sources = await desktopCapturer.getSources({types: ['window', 'screen']})

    for (const source of sources) {
      const dataObj = {
        id: '',
        name: ''
      };
      dataObj.id = source.id
      dataObj.name = source.name
      data.DesktopCapturerSourceList.push(dataObj)
    }

    data.msg = '获取了所有可以被捕获的独立窗口'
    // 返回前端 frontend/src/views/other/camera/Index.vue
    return data
  }

  // 返回单独的一个被捕获的独立窗口 | name = 'EE框架'
  // 返回到前端 开始串流 渲染 通过【navigator.mediaDevices.getUserMedia】
  async openCamera2(args, event) {
    // 这是传来的参数
    // console.log(args)

    const data = {
      msg: '',
      DesktopCapturerSourceList: [],
    }

    // 获取了所有可以被捕获的独立窗口
    const sources = await desktopCapturer.getSources({types: ['window', 'screen']})

    for (const source of sources) {
      if (source.name === 'Entire Screen') {
        const dataObj = {
          id: '',
          name: ''
        };
        dataObj.id = source.id
        dataObj.name = source.name
        data.DesktopCapturerSourceList.push(dataObj)
      }
    }

    data.msg = '获取了所有可以被捕获的独立窗口'
    // 返回前端 frontend/src/views/other/camera/Index.vue
    return data
  }
  // =================================================================================================================================

  /**
   * test
   */
  async test () {
    const result = await this.service.example.test('electron');

    let tmpDir = Utils.getLogDir();
    console.log('tmpDir:', tmpDir);

    // console.log('this.app.request:', this.app.request.query);

    // const exampleAddon = this.app.addon.example;
    // const str = exampleAddon.hello();
    // console.log('str:', str);

    return result;
  }

  /**
   * json数据库操作
   */
  async dbOperation(args) {
    const { service } = this;
    const paramsObj = args;
    //console.log('eeeee paramsObj:', paramsObj);
    const data = {
      action: paramsObj.action,
      result: null,
      all_list: []
    };

    switch (paramsObj.action) {
      case 'add' :
        data.result = await service.storage.addTestData(paramsObj.info);;
        break;
      case 'del' :
        data.result = await service.storage.delTestData(paramsObj.delete_name);;
        break;
      case 'update' :
        data.result = await service.storage.updateTestData(paramsObj.update_name, paramsObj.update_age);
        break;
      case 'get' :
        data.result = await service.storage.getTestData(paramsObj.search_age);
        break;
    }

    data.all_list = await service.storage.getAllTestData();

    return data;
  }

  /**
   * sqlite数据库操作
   */
  async sqlitedbOperation(args) {
    const { service } = this;
    const paramsObj = args;
    //console.log('eeeee paramsObj:', paramsObj);
    const data = {
      action: paramsObj.action,
      result: null,
      all_list: []
    };

    switch (paramsObj.action) {
      case 'add' :
        data.result = await service.storage.addTestDataSqlite(paramsObj.info);;
        break;
      case 'del' :
        data.result = await service.storage.delTestDataSqlite(paramsObj.delete_name);;
        break;
      case 'update' :
        data.result = await service.storage.updateTestDataSqlite(paramsObj.update_name, paramsObj.update_age);
        break;
      case 'get' :
        data.result = await service.storage.getTestDataSqlite(paramsObj.search_age);
        break;
      case 'getDataDir' :
        data.result = await service.storage.getDataDir();
        break;
      case 'setDataDir' :
        data.result = await service.storage.setCustomDataDir(paramsObj.data_dir);
        break;
    }

    data.all_list = await service.storage.getAllTestDataSqlite();

    return data;
  }

  /**
   * 消息提示对话框
   */
  messageShow () {
    dialog.showMessageBoxSync({
      type: 'info', // "none", "info", "error", "question" 或者 "warning"
      title: '自定义标题-message',
      message: '自定义消息内容',
      detail: '其它的额外信息'
    })

    return '打开了消息框';
  }

  /**
   * 消息提示与确认对话框
   */
  messageShowConfirm () {
    const res = dialog.showMessageBoxSync({
      type: 'info',
      title: '自定义标题-message',
      message: '自定义消息内容',
      detail: '其它的额外信息',
      cancelId: 1, // 用于取消对话框的按钮的索引
      defaultId: 0, // 设置默认选中的按钮
      buttons: ['确认', '取消'], // 按钮及索引
    })
    let data = (res === 0) ? '点击确认按钮' : '点击取消按钮';

    return data;
  }

  /**
   * 选择目录
   */
  selectFolder () {
    const filePaths = dialog.showOpenDialogSync({
      properties: ['openDirectory', 'createDirectory']
    });

    if (_.isEmpty(filePaths)) {
      return null
    }

    return filePaths[0];
  }

  /**
   * 打开目录
   */
  openDirectory (args) {
    if (!args.id) {
      return false;
    }
    let dir = '';
    if (path.isAbsolute(args.id)) {
      dir = args.id;
    } else {
      dir = electronApp.getPath(args.id);
    }

    shell.openPath(dir);
    return true;
  }

  /**
   * 加载视图内容
   */
  loadViewContent (args) {
    let content = null;
    if (args.type == 'html') {
      content = path.join('file://', electronApp.getAppPath(), args.content)
    } else {
      content = args.content;
    }

    browserViewObj = new BrowserView();
    this.app.electron.mainWindow.setBrowserView(browserViewObj)
    browserViewObj.setBounds({
      x: 300,
      y: 170,
      width: 650,
      height: 400
    });
    browserViewObj.webContents.loadURL(content);
    return true
  }

  /**
   * 移除视图内容
   */
  removeViewContent () {
    this.app.electron.mainWindow.removeBrowserView(browserViewObj);
    return true
  }

  /**
   * 打开新窗口
   */
  createWindow (args) {
    let content = null;
    if (args.type == 'html') {
      content = path.join('file://', electronApp.getAppPath(), args.content)
    } else if (args.type == 'web') {
      content = args.content;
    } else if (args.type == 'vue') {
      let addr = 'http://localhost:8080'
      if (this.config.env == 'prod') {
        const mainServer = this.app.config.mainServer;
        addr = mainServer.protocol + mainServer.host + ':' + mainServer.port;
      }

      content = addr + args.content;
    } else {
      // some
    }

    const addonWindow = this.app.addon.window;

    // BrowserWindow 的原生属性 frame 处理
    // frame boolean (可选) - 设置为 false 时可以创建一个无边框窗口 默认值为 true。 | 可以去掉 顶部导航 去掉关闭|最大化|最小化|按钮
    // 给赋值默认值 true
    if (args.frame == undefined) {
      args.frame = true
    }

    // 通过将 transparent 选项设置为 true, 还可以使无框窗口透明
    // 给赋值默认值 false
    if (args.transparent == undefined) {
      args.transparent = false
    }

    let opt = {
      title: args.windowName || 'new window',
      width: args.width || 980, // 自己扩展的参数配置项
      height: args.height || 650,
      frame: args.frame,
      transparent: args.transparent,
    }
    const name = args.windowName || 'window-1';

    // 加个判断
    // 如果窗口的name不等于 window-1【因为这个是默认的 就无所谓 放过吧 所有的打开页面 没有配置 windowName属性的 都是叫做 window-1】
    // 并且 如果name值在addonWindow.map中已经包含 就return掉 不创建新窗口
    if (!(name === 'window-1')) {
      // hasOwnProperty() 返回一个布尔值，用于表示一个对象自身是否包含指定的属性
      if (addonWindow.windowContentsIdMap.hasOwnProperty(name)) {
        return `${name}` + ' 窗口已经创建 只可以创建一个 不可以重复创建'
      }
    }

    const win = addonWindow.create(name, opt);
    const winContentsId = win.webContents.id;

    // load page
    win.loadURL(content);

    return winContentsId
  }

  /**
   * 获取窗口contents id
   */
  getWCid (args) {
    const addonWindow = this.app.addon.window;

    // 主窗口的name默认是main，其它窗口name开发者自己定义
    const name = args;
    const id = addonWindow.getWCid(name);

    return id;
  }

  /**
   * 移除窗口 通过窗口名称
   */
  removeWCid (args) {
    // 使用日志记录功能 logger
    // this.app === eeApp;
    this.app.logger.info('===== electron/controller/example.js|ExampleController.removeWCid')

    // 插件模块，扩展 app对象功能
    // 获取 window 插件
    const addonWindow = this.app.addon.window;

    // 主窗口的name默认是main，其它窗口name开发者自己定义
    const name = args;
    // 先获取id
    const id = addonWindow.getWCid(name);
    // 先在map中移除
    addonWindow.removeWCid(name);

    // console.log(id,name)

    // 实际移除
    // 通过窗口的id 返回 BrowserWindow | null - 带有给定 id 的窗口。
    const thisBrowserWindow  = BrowserWindow.fromId(id);
    if(thisBrowserWindow){

      // 执行官方api 关闭窗口
      // 尝试关闭窗口。 该方法与用户手动单击窗口的关闭按钮效果相同。 但网页可能会取消这个关闭操作。 查看 关闭事件。
      // https://www.electronjs.org/zh/docs/latest/api/browser-window#winclose
      thisBrowserWindow.close()
    }

    return true;
  }

  /**
   * 加载扩展程序
   */
  // async loadExtension (args) {
  //   const crxFile = args[0];
  //   if (_.isEmpty(crxFile)) {
  //     return false;
  //   }
  //   const extensionId = path.basename(crxFile, '.crx');
  //   const chromeExtensionDir = chromeExtension.getDirectory();
  //   const extensionDir = path.join(chromeExtensionDir, extensionId);

  //   console.log("[api] [example] [loadExtension] extension id:", extensionId);
  //   unzip(crxFile, extensionDir).then(() => {
  //     console.log("[api] [example] [loadExtension] unzip success!");
  //     chromeExtension.load(extensionId);
  //   });

  //   return true;
  // }

  /**
   * 创建系统通知
   */
  sendNotification (arg, event) {
    const channel = 'controller.example.sendNotification';
    if (!Notification.isSupported()) {
      return '当前系统不支持通知';
    }

    let options = {};
    if (!_.isEmpty(arg.title)) {
      options.title = arg.title;
    }
    if (!_.isEmpty(arg.subtitle)) {
      options.subtitle = arg.subtitle;
    }
    if (!_.isEmpty(arg.body)) {
      options.body = arg.body;
    }
    if (!_.isEmpty(arg.silent)) {
      options.silent = arg.silent;
    }

    notificationObj = new Notification(options);

    if (arg.clickEvent) {
      notificationObj.on('click', (e) => {
        let data = {
          type: 'click',
          msg: '您点击了通知消息'
        }
        event.reply(`${channel}`, data)
      });
    }

    if (arg.closeEvent) {
      notificationObj.on('close', (e) => {
        let data = {
          type: 'close',
          msg: '您关闭了通知消息'
        }
        event.reply(`${channel}`, data)
      });
    }

    notificationObj.show();

    return true
  }

  /**
   * 电源监控
   */
  initPowerMonitor (arg, event) {
    const channel = 'controller.example.initPowerMonitor';
    powerMonitor.on('on-ac', (e) => {
      let data = {
        type: 'on-ac',
        msg: '接入了电源'
      }
      event.reply(`${channel}`, data)
    });

    powerMonitor.on('on-battery', (e) => {
      let data = {
        type: 'on-battery',
        msg: '使用电池中'
      }
      event.reply(`${channel}`, data)
    });

    powerMonitor.on('lock-screen', (e) => {
      let data = {
        type: 'lock-screen',
        msg: '锁屏了'
      }
      event.reply(`${channel}`, data)
    });

    powerMonitor.on('unlock-screen', (e) => {
      let data = {
        type: 'unlock-screen',
        msg: '解锁了'
      }
      event.reply(`${channel}`, data)
    });

    return true
  }

  /**
   * 获取屏幕信息
   */
  getScreen (arg) {
    let data = [];
    let res = {};
    if (arg == 0) {
      let res = screen.getCursorScreenPoint();
      data = [
        {
          title: '横坐标',
          desc: res.x
        },
        {
          title: '纵坐标',
          desc: res.y
        },
      ]

      return data;
    }
    if (arg == 1) {
      res = screen.getPrimaryDisplay();
    }
    if (arg == 2) {
      let resArr = screen.getAllDisplays();
      // 数组，只取一个吧
      res = resArr[0];
    }
    // console.log('[electron] [ipc] [example] [getScreen] res:', res);
    data = [
      {
        title: '分辨率',
        desc: res.bounds.width + ' x ' + res.bounds.height
      },
      {
        title: '单色显示器',
        desc: res.monochrome ? '是' : '否'
      },
      {
        title: '色深',
        desc: res. colorDepth
      },
      {
        title: '色域',
        desc: res.colorSpace
      },
      {
        title: 'scaleFactor',
        desc: res.scaleFactor
      },
      {
        title: '加速器',
        desc: res.accelerometerSupport
      },
      {
        title: '触控',
        desc: res.touchSupport == 'unknown' ? '不支持' : '支持'
      },
    ]

    return data;
  }

  /**
   * 调用其它程序（exe、bash等可执行程序）
   */
  openSoftware (softName) {
    if (!softName) {
      return false;
    }

    let softwarePath = path.join(Utils.getExtraResourcesDir(), softName);
    this.app.logger.info('[openSoftware] softwarePath:', softwarePath);

    // 检查程序是否存在
    if (!fs.existsSync(softwarePath)) {
      return false;
    }
    // 命令行字符串 并 执行
    let cmdStr = 'start ' + softwarePath;
    exec(cmdStr);

    return true;
  }

  /**
   * 获取系统主题
   */
  getTheme () {
    let theme = 'system';
    if (nativeTheme.shouldUseHighContrastColors) {
      theme = 'light';
    } else if (nativeTheme.shouldUseInvertedColorScheme) {
      theme = 'dark';
    }

    return theme;
  }

  /**
   * 设置系统主题
   */
  setTheme (args) {

    // TODO 好像没有什么明显效果
    nativeTheme.themeSource = args;

    return args;
  }


  /**
   * 检查是否有新版本
   */
  checkForUpdater () {
    const autoUpdaterAddon = this.app.addon.autoUpdater;
    autoUpdaterAddon.checkUpdate();

    return;
  }

  /**
   * 下载新版本
   */
  downloadApp () {
    const autoUpdaterAddon = this.app.addon.autoUpdater;
    autoUpdaterAddon.download();
    return;
  }

  /**
   * 检测http服务是否开启
   */
  async checkHttpServer () {
    const httpServerConfig = this.app.config.httpServer;
    const url = httpServerConfig.protocol + httpServerConfig.host + ':' + httpServerConfig.port;

    const data = {
      enable: httpServerConfig.enable,
      server: url
    }
    return data;
  }

  /**
   * 一个http请求访问此方法
   */
  async doHttpRequest () {
    // http方法
    const method = this.app.request.method;
    // http get 参数
    let params = this.app.request.query;
    params = (params instanceof Object) ? params : JSON.parse(JSON.stringify(params));
    // http post 参数
    const body = this.app.request.body;

    const httpInfo = {
      method,
      params,
      body
    }
    console.log('httpInfo:', httpInfo);

    if (!body.id) {
      return false;
    }
    const dir = electronApp.getPath(body.id);
    shell.openPath(dir);

    return true;
  }

  /**
   * 一个socket io请求访问此方法
   */
  async doSocketRequest (args) {
    if (!args.id) {
      return false;
    }
    const dir = electronApp.getPath(args.id);
    shell.openPath(dir);

    return true;
  }

  /**
   * 异步消息类型
   * @param args 前端传的参数
   * @param event - IpcMainInvokeEvent 文档：https://www.electronjs.org/zh/docs/latest/api/structures/ipc-main-invoke-event
   */
   async ipcInvokeMsg (args, event) {
    let timeNow = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const data = args + ' - ' + timeNow;

    return data;
  }

  /**
   * 同步消息类型
   * @param args 前端传的参数
   * @param event - IpcMainEvent 文档：https://www.electronjs.org/docs/latest/api/structures/ipc-main-event
   */
  async ipcSendSyncMsg (args) {
    let timeNow = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const data = args + ' - ' + timeNow;

    return data;
  }

  /**
   * 双向异步通信
   * @param args 前端传的参数
   * @param event - IpcMainEvent 文档：https://www.electronjs.org/docs/latest/api/structures/ipc-main-event
   */
  ipcSendMsg (args, event) {
    // 前端ipc频道 channel
    const channel = 'controller.example.ipcSendMsg';

    if (args.type == 'start') {
      // 每隔1秒，向前端页面发送消息
      // 用定时器模拟
      myTimer = setInterval(function(e, c, msg) {
        let timeNow = Date.now();
        let data = msg + ':' + timeNow;
        e.reply(`${c}`, data)
      }, 1000, event, channel, args.content)

      return '开始了'
    } else if (args.type == 'end') {
      clearInterval(myTimer);
      return '停止了'
    } else {
      return 'ohther'
    }
  }

  /**
   * 上传文件
   */
  async uploadFile() {
    let tmpDir = Utils.getLogDir();
    const files = this.app.request.files;
    let file = files.file;

    let tmpFilePath = path.join(tmpDir, file.originalFilename);
    try {
      let tmpFile = fs.readFileSync(file.filepath);
      fs.writeFileSync(tmpFilePath, tmpFile);
    } finally {
      await fs.unlink(file.filepath, function(){});
    }
    const fileStream = fs.createReadStream(tmpFilePath);
    const uploadRes = await this.service.example.uploadFileToSMMS(fileStream);

    return uploadRes;
  }

  /**
   * 启动java项目
   */
  async startJavaServer () {
    let data = {
      code: 0,
      msg: '',
      server: ''
    }
    const javaCfg = this.app.config.addons.javaServer || {};
    if (!javaCfg.enable) {
      data.code = -1;
      data.msg = 'addon not enabled!';
      return data;
    }

    const javaServerAddon = this.app.addon.javaServer;
    await javaServerAddon.createServer();

    data.server = 'http://localhost:' + javaCfg.port;

    return data;
  }

  /**
   * 关闭java项目
   */
  async closeJavaServer () {
    let data = {
      code: 0,
      msg: '',
    }
    const javaCfg = this.app.config.addons.javaServer || {};
    if (!javaCfg.enable) {
      data.code = -1;
      data.msg = 'addon not enabled!';
      return data;
    }

    const javaServerAddon = this.app.addon.javaServer;
    await javaServerAddon.kill();

    return data;
  }

  /**
   * 测试接口
   */
  hello (args) {
    console.log('hello ', args);
  }
}

ExampleController.toString = () => '[class ExampleController]';
module.exports = ExampleController;
