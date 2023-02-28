const Appliaction = require('ee-core').Appliaction;

// 作者把一些主进程【app】的一些逻辑写在了【node_modules/ee-core/lib/eeApp.js】【createElectronApp ()】
class Main extends Appliaction {

  constructor() {
    super();
    // this === eeApp;
  }

  /**
   * core app have been loaded
   */
  async ready () {
    // do some things
    console.log('===== electron-egg/main.js ','ready =====')
    // 使用日志记录功能 logger
    // this === eeApp;
    this.logger.info('===== electron-egg/main.js ','ready 测试log功能=====')
  }

  /**
   * electron app ready
   */
  async electronAppReady () {
    // do some things
    console.log('===== electron-egg/main.js ','electronAppReady =====')
  }

  /**
   * main window have been loaded
   */
  async windowReady () {
    // do some things
    console.log('===== electron-egg/main.js ','windowReady =====')

    // 延迟加载，无白屏
    const winOpt = this.config.windowsOption;
    if (winOpt.show == false) {
      const win = this.electron.mainWindow;
      win.once('ready-to-show', () => {
        console.log('===== electron-egg/main.js ','windowReady ready-to-show =====')
        win.show();
      })
    }

    // 放开代码注释 即可查看
    // console.log('===== electron-egg/main.js | this === eeApp 输出一下 ',this)
  }

  /**
   * before app close
   */
  async beforeClose () {
    // do some things
    console.log('===== electron-egg/main.js ','beforeClose =====')
  }
}

new Main();

